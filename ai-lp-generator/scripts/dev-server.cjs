#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

// TypeScript版のポートマネージャーをJSで簡易実装
const net = require('net')
const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class SimplePortManager {
  constructor(preferredPort = 3001) {
    this.preferredPort = preferredPort
    this.fallbackPorts = [3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010]
  }

  async isPortAvailable(port) {
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

  async findAvailablePort() {
    // 優先ポートをチェック
    if (await this.isPortAvailable(this.preferredPort)) {
      return this.preferredPort
    }

    // フォールバックポートをチェック
    for (const port of this.fallbackPorts) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }

    // 動的検索
    for (let port = 3000; port < 4000; port++) {
      if (await this.isPortAvailable(port)) {
        return port
      }
    }

    throw new Error('利用可能なポートが見つかりません')
  }

  async killNextProcesses() {
    try {
      console.log('🔍 既存のNext.jsプロセスを検索中...')
      
      // Next.js関連プロセスを検索して終了
      const { stdout } = await execAsync('ps aux | grep -E "(next-server|next dev)" | grep -v grep')
      const lines = stdout.trim().split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        const parts = line.split(/\s+/)
        const pid = parseInt(parts[1])
        
        if (pid && !isNaN(pid)) {
          console.log(`📝 Next.jsプロセス終了: PID ${pid}`)
          try {
            await execAsync(`kill -TERM ${pid}`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // まだ生きているかチェック
            try {
              await execAsync(`kill -0 ${pid}`)
              await execAsync(`kill -KILL ${pid}`)
              console.log(`💀 強制終了: PID ${pid}`)
            } catch {
              console.log(`✅ 正常終了: PID ${pid}`)
            }
          } catch (error) {
            console.warn(`⚠️  PID ${pid} 終了失敗:`, error.message)
          }
        }
      }
    } catch (error) {
      console.log('📝 既存のNext.jsプロセスは見つかりませんでした')
    }
  }

  async generateReport() {
    console.log('\n=== ポート状況レポート ===')
    
    const preferredAvailable = await this.isPortAvailable(this.preferredPort)
    console.log(`優先ポート ${this.preferredPort}: ${preferredAvailable ? '✅ 利用可能' : '❌ 使用中'}`)
    
    console.log('\nフォールバックポート状況:')
    for (const port of this.fallbackPorts.slice(0, 5)) {
      const available = await this.isPortAvailable(port)
      console.log(`  ポート ${port}: ${available ? '✅' : '❌'}`)
    }
    
    // プロセス情報
    try {
      const { stdout } = await execAsync('lsof -i :3000-3010 | grep LISTEN')
      if (stdout.trim()) {
        console.log('\n使用中のポート:')
        console.log(stdout)
      }
    } catch {
      console.log('\n使用中のポート: なし')
    }
    
    console.log('========================\n')
  }
}

async function startDevServer() {
  console.log('🚀 Next.js開発サーバー起動システム')
  console.log('🔧 ポート競合回避機能付き\n')

  const portManager = new SimplePortManager(3001)
  
  try {
    // 現状レポート
    await portManager.generateReport()
    
    // 既存プロセスをクリーンアップ
    await portManager.killNextProcesses()
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 利用可能ポートを検索
    const port = await portManager.findAvailablePort()
    console.log(`🎯 使用ポート: ${port}`)
    
    // 環境変数を設定
    process.env.PORT = port.toString()
    process.env.NEXT_DEV_PORT = port.toString()
    
    // Next.js開発サーバーを起動
    console.log(`\n🌟 Next.js開発サーバーをポート${port}で起動中...\n`)
    
    const nextProcess = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: port.toString(),
        NEXT_DEV_PORT: port.toString()
      }
    })
    
    nextProcess.on('close', (code) => {
      console.log(`\n📝 Next.js開発サーバーが終了しました (コード: ${code})`)
    })
    
    nextProcess.on('error', (error) => {
      console.error('❌ Next.js開発サーバー起動エラー:', error)
      process.exit(1)
    })
    
    // SIGINTハンドラー (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n🛑 サーバー停止中...')
      nextProcess.kill('SIGINT')
      setTimeout(() => {
        process.exit(0)
      }, 2000)
    })
    
    // SIGTERMハンドラー
    process.on('SIGTERM', () => {
      console.log('\n🛑 サーバー終了中...')
      nextProcess.kill('SIGTERM')
      setTimeout(() => {
        process.exit(0)
      }, 2000)
    })
    
  } catch (error) {
    console.error('❌ サーバー起動に失敗しました:', error.message)
    process.exit(1)
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  startDevServer().catch(console.error)
}

module.exports = { startDevServer, SimplePortManager }