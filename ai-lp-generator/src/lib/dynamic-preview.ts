import { spawn, exec, ChildProcess } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import net from 'net'
import { createClient } from '@supabase/supabase-js'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 動的プレビュー管理クラス
export interface PreviewProcess {
  projectId: string
  port: number
  process: ChildProcess
  status: 'starting' | 'building' | 'running' | 'error' | 'stopped'
  startTime: Date
  url?: string
  buildOutput?: string[]
  error?: string
}

export interface ProjectBuildStatus {
  projectId: string
  status: 'pending' | 'building' | 'ready' | 'error'
  port?: number
  url?: string
  buildLogs: string[]
  startedAt: Date
  readyAt?: Date
  error?: string
}

export class DynamicPreviewManager {
  private activeProcesses = new Map<string, PreviewProcess>()
  private portRange = { start: 3002, end: 3010 }
  private usedPorts = new Set<number>()

  constructor() {
    // プロセス終了時のクリーンアップ
    process.on('exit', () => this.cleanup())
    process.on('SIGINT', () => this.cleanup())
    process.on('SIGTERM', () => this.cleanup())
  }

  // 利用可能ポート検索
  private async findAvailablePort(): Promise<number> {
    for (let port = this.portRange.start; port <= this.portRange.end; port++) {
      if (!this.usedPorts.has(port) && await this.isPortFree(port)) {
        this.usedPorts.add(port)
        return port
      }
    }
    throw new Error('利用可能なポートがありません (3002-3010)')
  }

  // ポート使用状況確認
  private isPortFree(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
      server.listen(port, () => {
        server.close(() => resolve(true))
      })
      server.on('error', () => resolve(false))
    })
  }

  // プロジェクトパス取得
  private getProjectPath(projectId: string): string {
    return path.join(process.cwd(), 'generated_projects', projectId)
  }

  // プロジェクト存在確認
  private async projectExists(projectId: string): Promise<boolean> {
    try {
      const projectPath = this.getProjectPath(projectId)
      const stats = await fs.stat(projectPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  }

  // package.json確認・修正
  private async ensurePackageJson(projectPath: string): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json')
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
      
      // Next.js開発スクリプト確認
      if (!packageJson.scripts) {
        packageJson.scripts = {}
      }
      
      if (!packageJson.scripts.dev) {
        packageJson.scripts.dev = 'next dev'
      }
      
      if (!packageJson.scripts.build) {
        packageJson.scripts.build = 'next build'
      }

      // 必要な依存関係確認
      const requiredDeps = {
        'next': '^15.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0'
      }

      if (!packageJson.dependencies) {
        packageJson.dependencies = {}
      }

      let needsUpdate = false
      for (const [dep, version] of Object.entries(requiredDeps)) {
        if (!packageJson.dependencies[dep]) {
          packageJson.dependencies[dep] = version
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
      }

    } catch (error) {
      throw new Error(`package.json処理エラー: ${error}`)
    }
  }

  // 依存関係インストール
  private async installDependencies(projectPath: string): Promise<string[]> {
    const logs: string[] = []
    
    try {
      logs.push('📦 依存関係をインストール中...')
      
      const { stdout, stderr } = await execAsync('npm install', {
        cwd: projectPath,
        timeout: 120000 // 2分タイムアウト
      })
      
      if (stdout) logs.push(`STDOUT: ${stdout}`)
      if (stderr) logs.push(`STDERR: ${stderr}`)
      
      logs.push('✅ 依存関係インストール完了')
      
    } catch (error) {
      logs.push(`❌ 依存関係インストールエラー: ${error}`)
      throw error
    }
    
    return logs
  }

  // Next.js開発サーバー起動
  private async startDevServer(projectId: string, projectPath: string, port: number): Promise<PreviewProcess> {
    const logs: string[] = []
    
    logs.push(`🚀 Next.js開発サーバー起動中 (ポート: ${port})`)
    
    const devProcess = spawn('npm', ['run', 'dev', '--', '--port', port.toString()], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: port.toString() }
    })

    const previewProcess: PreviewProcess = {
      projectId,
      port,
      process: devProcess,
      status: 'starting',
      startTime: new Date(),
      url: `http://localhost:${port}`,
      buildOutput: logs
    }

    // プロセス出力監視
    devProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      previewProcess.buildOutput?.push(`STDOUT: ${output}`)
      
      // 起動完了検知
      if (output.includes('Ready in') || output.includes('Local:')) {
        previewProcess.status = 'running'
        this.updateSupabaseStatus(projectId, 'ready', port, `http://localhost:${port}`)
      }
      
      // ビルドエラー検知
      if (output.includes('Error:') || output.includes('Failed to compile')) {
        previewProcess.status = 'error'
        previewProcess.error = output
      }
    })

    devProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      previewProcess.buildOutput?.push(`STDERR: ${output}`)
      
      if (output.includes('Error') || output.includes('EADDRINUSE')) {
        previewProcess.status = 'error'
        previewProcess.error = output
      }
    })

    devProcess.on('close', (code) => {
      previewProcess.status = code === 0 ? 'stopped' : 'error'
      this.usedPorts.delete(port)
      this.activeProcesses.delete(projectId)
      
      if (code !== 0) {
        previewProcess.error = `プロセス終了コード: ${code}`
      }
    })

    devProcess.on('error', (error) => {
      previewProcess.status = 'error'
      previewProcess.error = error.message
      this.usedPorts.delete(port)
      this.activeProcesses.delete(projectId)
    })

    return previewProcess
  }

  // Supabaseステータス更新
  private async updateSupabaseStatus(
    projectId: string, 
    status: string, 
    port?: number, 
    url?: string
  ): Promise<void> {
    try {
      await supabase
        .from('projects')
        .update({
          preview_status: status,
          preview_port: port,
          preview_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
    } catch (error) {
      console.error('Supabaseステータス更新エラー:', error)
    }
  }

  // メイン: プロジェクトプレビュー開始
  async startPreview(projectId: string): Promise<ProjectBuildStatus> {
    const buildStatus: ProjectBuildStatus = {
      projectId,
      status: 'pending',
      buildLogs: [],
      startedAt: new Date()
    }

    try {
      // 既存プロセス確認
      if (this.activeProcesses.has(projectId)) {
        const existing = this.activeProcesses.get(projectId)!
        if (existing.status === 'running') {
          return {
            ...buildStatus,
            status: 'ready',
            port: existing.port,
            url: existing.url,
            readyAt: new Date()
          }
        }
      }

      buildStatus.buildLogs.push('🔍 プロジェクト存在確認中...')
      
      // プロジェクト存在確認
      if (!await this.projectExists(projectId)) {
        throw new Error(`プロジェクトが見つかりません: ${projectId}`)
      }

      const projectPath = this.getProjectPath(projectId)
      buildStatus.buildLogs.push(`📁 プロジェクトパス: ${projectPath}`)

      // ポート割り当て
      const port = await this.findAvailablePort()
      buildStatus.port = port
      buildStatus.url = `http://localhost:${port}`
      buildStatus.buildLogs.push(`🔌 ポート割り当て: ${port}`)

      // package.json確認・修正
      buildStatus.status = 'building'
      await this.updateSupabaseStatus(projectId, 'building')
      
      await this.ensurePackageJson(projectPath)
      buildStatus.buildLogs.push('✅ package.json確認完了')

      // 依存関係インストール
      const installLogs = await this.installDependencies(projectPath)
      buildStatus.buildLogs.push(...installLogs)

      // 開発サーバー起動
      const previewProcess = await this.startDevServer(projectId, projectPath, port)
      this.activeProcesses.set(projectId, previewProcess)
      
      buildStatus.buildLogs.push(...(previewProcess.buildOutput || []))

      // 起動完了待機 (最大30秒)
      const timeout = 30000
      const startTime = Date.now()
      
      while (previewProcess.status === 'starting' && Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      if (previewProcess.status === 'running') {
        buildStatus.status = 'ready'
        buildStatus.readyAt = new Date()
      } else if (previewProcess.status === 'error') {
        buildStatus.status = 'error'
        buildStatus.error = previewProcess.error
      } else {
        buildStatus.status = 'error'
        buildStatus.error = 'タイムアウト: 30秒以内に起動しませんでした'
      }

    } catch (error) {
      buildStatus.status = 'error'
      buildStatus.error = error instanceof Error ? error.message : String(error)
      buildStatus.buildLogs.push(`❌ エラー: ${buildStatus.error}`)
      
      await this.updateSupabaseStatus(projectId, 'error')
    }

    return buildStatus
  }

  // プレビュー停止
  async stopPreview(projectId: string): Promise<boolean> {
    const previewProcess = this.activeProcesses.get(projectId)
    
    if (!previewProcess) {
      return false
    }

    try {
      // プロセス終了
      previewProcess.process.kill('SIGTERM')
      
      // 5秒後に強制終了
      setTimeout(() => {
        if (!previewProcess.process.killed) {
          previewProcess.process.kill('SIGKILL')
        }
      }, 5000)

      // ポート解放
      this.usedPorts.delete(previewProcess.port)
      this.activeProcesses.delete(projectId)

      // Supabaseステータス更新
      await this.updateSupabaseStatus(projectId, 'stopped')
      
      return true
    } catch (error) {
      console.error(`プレビュー停止エラー (${projectId}):`, error)
      return false
    }
  }

  // 全プロセス停止
  async stopAllPreviews(): Promise<number> {
    const projectIds = Array.from(this.activeProcesses.keys())
    let stopped = 0

    for (const projectId of projectIds) {
      if (await this.stopPreview(projectId)) {
        stopped++
      }
    }

    return stopped
  }

  // アクティブプレビュー一覧
  getActivePreviews(): PreviewProcess[] {
    return Array.from(this.activeProcesses.values())
  }

  // プレビューステータス取得
  getPreviewStatus(projectId: string): PreviewProcess | null {
    return this.activeProcesses.get(projectId) || null
  }

  // ポート使用状況
  getPortUsage(): { used: number[], available: number[] } {
    const allPorts = Array.from({ length: this.portRange.end - this.portRange.start + 1 }, 
      (_, i) => this.portRange.start + i)
    
    return {
      used: Array.from(this.usedPorts),
      available: allPorts.filter(port => !this.usedPorts.has(port))
    }
  }

  // クリーンアップ
  private async cleanup(): Promise<void> {
    console.log('🧹 動的プレビューマネージャーをクリーンアップ中...')
    await this.stopAllPreviews()
  }
}

// シングルトンインスタンス
export const dynamicPreviewManager = new DynamicPreviewManager()