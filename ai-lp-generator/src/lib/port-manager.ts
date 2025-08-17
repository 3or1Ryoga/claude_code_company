import { spawn, exec } from 'child_process'
import net from 'net'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface PortInfo {
  port: number
  isAvailable: boolean
  process?: {
    pid: number
    name: string
    command: string
  }
}

export interface PortManagerConfig {
  preferredPort: number
  fallbackPorts: number[]
  autoKill: boolean
  retryAttempts: number
  retryDelay: number
}

export class PortManager {
  private config: PortManagerConfig
  
  constructor(config: Partial<PortManagerConfig> = {}) {
    this.config = {
      preferredPort: 3001,
      fallbackPorts: [3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010],
      autoKill: false,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config
    }
  }

  /**
   * 指定ポートが使用可能かチェック
   */
  async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      
      server.listen(port, () => {
        server.close(() => {
          resolve(true)
        })
      })
      
      server.on('error', () => {
        resolve(false)
      })
    })
  }

  /**
   * ポートの詳細情報を取得
   */
  async getPortInfo(port: number): Promise<PortInfo> {
    const isAvailable = await this.isPortAvailable(port)
    
    if (isAvailable) {
      return { port, isAvailable: true }
    }

    try {
      // macOS/Linux対応
      const { stdout } = await execAsync(`lsof -i :${port}`)
      const lines = stdout.trim().split('\n')
      
      if (lines.length > 1) {
        const processLine = lines[1] // ヘッダーをスキップ
        const parts = processLine.split(/\s+/)
        
        return {
          port,
          isAvailable: false,
          process: {
            pid: parseInt(parts[1]),
            name: parts[0],
            command: parts.slice(8).join(' ')
          }
        }
      }
    } catch (error) {
      console.warn(`ポート${port}の情報取得に失敗:`, error)
    }

    return { port, isAvailable: false }
  }

  /**
   * 使用可能なポートを検索
   */
  async findAvailablePort(): Promise<number> {
    // まず優先ポートをチェック
    if (await this.isPortAvailable(this.config.preferredPort)) {
      return this.config.preferredPort
    }

    // フォールバックポートを順次チェック
    for (const port of this.config.fallbackPorts) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }

    // 動的ポート検索 (3000番台で空きを探す)
    for (let port = 3000; port < 4000; port++) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }

    throw new Error('使用可能なポートが見つかりません')
  }

  /**
   * プロセスを終了
   */
  async killProcess(pid: number): Promise<boolean> {
    try {
      // SIGTERM で穏やかに終了を試行
      await execAsync(`kill -TERM ${pid}`)
      
      // 3秒待機
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // プロセスがまだ生きているかチェック
      try {
        await execAsync(`kill -0 ${pid}`)
        // まだ生きている場合は強制終了
        await execAsync(`kill -KILL ${pid}`)
        console.log(`プロセス ${pid} を強制終了しました`)
      } catch {
        // プロセスが既に終了している
        console.log(`プロセス ${pid} は正常に終了しました`)
      }
      
      return true
    } catch (error) {
      console.error(`プロセス ${pid} の終了に失敗:`, error)
      return false
    }
  }

  /**
   * ポートを解放して確保
   */
  async releaseAndClaimPort(port: number): Promise<boolean> {
    const portInfo = await this.getPortInfo(port)
    
    if (portInfo.isAvailable) {
      return true
    }

    if (!this.config.autoKill || !portInfo.process) {
      console.warn(`ポート ${port} は使用中です (PID: ${portInfo.process?.pid})`)
      return false
    }

    console.log(`ポート ${port} を使用中のプロセス ${portInfo.process.pid} を終了します...`)
    
    const killed = await this.killProcess(portInfo.process.pid)
    if (!killed) {
      return false
    }

    // 少し待ってから再確認
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return await this.isPortAvailable(port)
  }

  /**
   * すべてのNext.jsプロセスを検索
   */
  async findNextProcesses(): Promise<Array<{pid: number, port?: number, command: string}>> {
    try {
      const { stdout } = await execAsync('ps aux | grep -i "next\\|node.*dev" | grep -v grep')
      const lines = stdout.trim().split('\n').filter(line => line.trim())
      
      const processes = []
      
      for (const line of lines) {
        const parts = line.split(/\s+/)
        const pid = parseInt(parts[1])
        const command = parts.slice(10).join(' ')
        
        if (command.includes('next') || command.includes('dev')) {
          // ポート情報を取得
          let port: number | undefined
          try {
            const { stdout: lsofOutput } = await execAsync(`lsof -p ${pid} -i TCP | grep LISTEN`)
            const portMatch = lsofOutput.match(/:(\d+)\s*\(LISTEN\)/)
            if (portMatch) {
              port = parseInt(portMatch[1])
            }
          } catch {
            // ポート情報取得失敗は無視
          }
          
          processes.push({ pid, port, command })
        }
      }
      
      return processes
    } catch (error) {
      console.warn('Next.jsプロセス検索に失敗:', error)
      return []
    }
  }

  /**
   * すべてのNext.jsプロセスをクリーンアップ
   */
  async cleanupNextProcesses(): Promise<number> {
    const processes = await this.findNextProcesses()
    let killedCount = 0
    
    for (const process of processes) {
      console.log(`Next.jsプロセスを終了: PID ${process.pid}, Port ${process.port || 'unknown'}`)
      
      if (await this.killProcess(process.pid)) {
        killedCount++
      }
    }
    
    return killedCount
  }

  /**
   * メインの実行関数
   */
  async ensurePort(): Promise<number> {
    console.log('🔍 ポート競合チェックを開始...')
    
    // 優先ポートを取得試行
    if (await this.releaseAndClaimPort(this.config.preferredPort)) {
      console.log(`✅ 優先ポート ${this.config.preferredPort} を確保しました`)
      return this.config.preferredPort
    }
    
    // 利用可能なポートを検索
    console.log('🔄 代替ポートを検索中...')
    const availablePort = await this.findAvailablePort()
    
    console.log(`✅ ポート ${availablePort} を確保しました`)
    return availablePort
  }

  /**
   * システム状況レポート
   */
  async generateReport(): Promise<string> {
    const report = []
    report.push('=== ポート管理レポート ===')
    
    // 優先ポートの状況
    const preferredPortInfo = await this.getPortInfo(this.config.preferredPort)
    report.push(`優先ポート ${this.config.preferredPort}: ${preferredPortInfo.isAvailable ? '利用可能' : '使用中'}`)
    
    if (!preferredPortInfo.isAvailable && preferredPortInfo.process) {
      report.push(`  → PID: ${preferredPortInfo.process.pid}, プロセス: ${preferredPortInfo.process.name}`)
    }
    
    // フォールバックポートの状況
    report.push('\nフォールバックポート状況:')
    for (const port of this.config.fallbackPorts.slice(0, 5)) {
      const info = await this.getPortInfo(port)
      report.push(`  ポート ${port}: ${info.isAvailable ? '利用可能' : '使用中'}`)
    }
    
    // Next.jsプロセス一覧
    const nextProcesses = await this.findNextProcesses()
    report.push(`\nNext.jsプロセス: ${nextProcesses.length}個`)
    
    for (const process of nextProcesses) {
      report.push(`  PID ${process.pid}, Port ${process.port || 'unknown'}: ${process.command.slice(0, 60)}...`)
    }
    
    return report.join('\n')
  }
}

// 緊急対応用のユーティリティ関数
export async function emergencyPortCleanup(): Promise<void> {
  console.log('🚨 緊急ポートクリーンアップを実行...')
  
  const manager = new PortManager({ 
    preferredPort: 3001, 
    autoKill: true 
  })
  
  // レポート出力
  console.log(await manager.generateReport())
  
  // Next.jsプロセスをクリーンアップ
  const killedCount = await manager.cleanupNextProcesses()
  console.log(`📝 ${killedCount}個のプロセスを終了しました`)
  
  // 少し待機
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // ポート確保
  const port = await manager.ensurePort()
  console.log(`🎯 最終確保ポート: ${port}`)
}