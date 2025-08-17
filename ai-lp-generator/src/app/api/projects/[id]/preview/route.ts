import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminStorage } from '@/lib/supabase-admin'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const BUCKET_NAME = 'project-archives'

interface RunningProject {
  port: number
  process: any
  startTime: Date
  projectId: string
}

// 動作中のプロジェクトを管理
const runningProjects = new Map<string, RunningProject>()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const supabase = await createServerSupabaseClient()
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 既に起動中のプロジェクトがあるかチェック
    const existingProject = runningProjects.get(projectId)
    if (existingProject) {
      return NextResponse.json({
        success: true,
        previewUrl: `http://localhost:${existingProject.port}`,
        port: existingProject.port,
        status: 'running',
        startTime: existingProject.startTime
      })
    }

    // プロジェクトディレクトリのパスを構築
    const projectPath = path.join(
      process.cwd(),
      'generated_projects',
      projectId
    )

    // プロジェクトディレクトリの存在確認
    try {
      await fs.access(projectPath)
      console.log(`✅ Project exists locally: ${projectPath}`)
    } catch {
      console.log(`📥 Project not found locally, downloading from Supabase: ${projectId}`)
      
      // Supabaseからアーカイブプロジェクトをダウンロードして展開
      try {
        await downloadAndExtractProject(projectId, user.id, projectPath)
        console.log(`✅ Project extracted successfully: ${projectPath}`)
      } catch (downloadError) {
        console.error('❌ Failed to download project from Supabase:', downloadError)
        return NextResponse.json(
          { error: 'プロジェクトのダウンロードに失敗しました' },
          { status: 404 }
        )
      }
    }

    // 利用可能なポートを見つける
    const port = await findAvailablePort()
    
    // Next.jsプロジェクトを起動
    const projectProcess = await startNextProject(projectPath, port)
    
    // 起動中のプロジェクトを記録
    runningProjects.set(projectId, {
      port,
      process: projectProcess,
      startTime: new Date(),
      projectId
    })

    // プロセス終了時のクリーンアップ
    projectProcess.on('exit', () => {
      runningProjects.delete(projectId)
    })

    // プロジェクトが起動するまで少し待機
    await new Promise(resolve => setTimeout(resolve, 3000))

    return NextResponse.json({
      success: true,
      previewUrl: `http://localhost:${port}`,
      port,
      status: 'starting',
      startTime: new Date()
    })

  } catch (error) {
    console.error('Error starting project preview:', error)
    return NextResponse.json(
      { error: 'プレビューの開始に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const project = runningProjects.get(projectId)
    
    if (!project) {
      return NextResponse.json(
        { error: 'プロジェクトが起動していません' },
        { status: 404 }
      )
    }

    // プロセスを終了
    if (project.process && !project.process.killed) {
      project.process.kill('SIGTERM')
    }

    runningProjects.delete(projectId)

    return NextResponse.json({
      success: true,
      message: 'プロジェクトが停止されました'
    })

  } catch (error) {
    console.error('Error stopping project:', error)
    return NextResponse.json(
      { error: 'プロジェクトの停止に失敗しました' },
      { status: 500 }
    )
  }
}

// 利用可能なポートを見つける関数
async function findAvailablePort(startPort: number = 3100): Promise<number> {
  const { createServer } = require('net')
  
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(startPort, () => {
      const port = server.address()?.port
      server.close(() => resolve(port))
    })
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve).catch(reject)
    })
  })
}

// Next.jsプロジェクトを起動する関数
async function startNextProject(projectPath: string, port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    // 依存関係がインストールされているかチェック
    const nodeModulesPath = path.join(projectPath, 'node_modules')
    
    fs.access(nodeModulesPath)
      .then(() => {
        // node_modulesが存在する場合は直接起動
        startDevelopmentServer(projectPath, port, resolve, reject)
      })
      .catch(() => {
        // node_modulesが存在しない場合はまずインストール
        console.log(`Installing dependencies for ${projectPath}...`)
        const installProcess = spawn('npm', ['install'], {
          cwd: projectPath,
          stdio: 'pipe'
        })

        installProcess.on('close', (code) => {
          if (code === 0) {
            console.log(`Dependencies installed for ${projectPath}`)
            startDevelopmentServer(projectPath, port, resolve, reject)
          } else {
            reject(new Error(`npm install failed with code ${code}`))
          }
        })

        installProcess.on('error', reject)
      })
  })
}

// Supabaseからプロジェクトアーカイブをダウンロードして展開する関数
async function downloadAndExtractProject(projectId: string, userId: string, targetPath: string): Promise<void> {
  const storage = getAdminStorage()
  
  console.log(`📥 Downloading project ${projectId} for user ${userId}`)
  
  // プロジェクトファイルリストを取得
  const { data: projectFiles, error: listError } = await storage
    .from(BUCKET_NAME)
    .list(`${userId}/${projectId}`, { limit: 10 })

  if (listError) {
    throw new Error(`Failed to list project files: ${listError.message}`)
  }

  // ZIPファイルを見つける
  const zipFile = projectFiles?.find(file => file.name?.endsWith('.zip'))
  if (!zipFile) {
    throw new Error(`Archive not found for project ${projectId}`)
  }

  const zipPath = `${userId}/${projectId}/${zipFile.name}`
  console.log(`📦 Found archive: ${zipPath}`)

  // ZIPファイルをダウンロード
  const { data: zipData, error: downloadError } = await storage
    .from(BUCKET_NAME)
    .download(zipPath)

  if (downloadError) {
    throw new Error(`Failed to download archive: ${downloadError.message}`)
  }

  // ZIPファイルを展開
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const zipContent = await zip.loadAsync(await zipData.arrayBuffer())

  // ターゲットディレクトリを作成
  await fs.mkdir(targetPath, { recursive: true })

  // ZIPファイルの内容を展開
  const filePromises = Object.keys(zipContent.files).map(async (fileName) => {
    const file = zipContent.files[fileName]
    
    if (file.dir) {
      // ディレクトリの場合
      const dirPath = path.join(targetPath, fileName)
      await fs.mkdir(dirPath, { recursive: true })
    } else {
      // ファイルの場合
      const filePath = path.join(targetPath, fileName)
      const fileDir = path.dirname(filePath)
      
      // ディレクトリを作成
      await fs.mkdir(fileDir, { recursive: true })
      
      // ファイル内容を取得
      const content = await file.async('uint8array')
      await fs.writeFile(filePath, content)
    }
  })

  await Promise.all(filePromises)

  // package.jsonが存在するかチェック
  const packageJsonPath = path.join(targetPath, 'package.json')
  try {
    await fs.access(packageJsonPath)
    console.log(`✅ package.json found in extracted project`)
  } catch {
    console.log(`⚠️ package.json not found, creating basic one`)
    
    // 基本的なpackage.jsonを作成
    const basicPackageJson = {
      "name": projectId,
      "version": "0.1.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
      },
      "dependencies": {
        "next": "15.0.3",
        "react": "19.0.0",
        "react-dom": "19.0.0"
      },
      "devDependencies": {
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        "eslint": "^8",
        "eslint-config-next": "15.0.3",
        "typescript": "^5"
      }
    }
    
    await fs.writeFile(packageJsonPath, JSON.stringify(basicPackageJson, null, 2))
  }

  console.log(`✅ Project extracted to: ${targetPath}`)
}

function startDevelopmentServer(
  projectPath: string,
  port: number,
  resolve: Function,
  reject: Function
) {
  console.log(`Starting Next.js server at ${projectPath} on port ${port}`)
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: projectPath,
    stdio: 'pipe',
    env: {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'development'
    }
  })

  devProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(`[${port}]:`, output)
    
    // Next.jsが起動完了のサインをチェック
    if (output.includes('Local:') || output.includes('Ready')) {
      resolve(devProcess)
    }
  })

  devProcess.stderr.on('data', (data) => {
    console.error(`[${port}] Error:`, data.toString())
  })

  devProcess.on('error', reject)

  // タイムアウト処理（30秒で起動しない場合）
  setTimeout(() => {
    resolve(devProcess) // 一旦resolveして後でチェック
  }, 30000)
}