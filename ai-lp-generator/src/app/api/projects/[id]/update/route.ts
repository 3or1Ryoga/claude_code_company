import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectIdParam } = await params
    console.log('📝 Starting project update for ID:', projectIdParam)
    const supabase = await createServerSupabaseClient()
    
    // 認証確認 (テスト時は一時的に無効化)
    let user = null
    if (process.env.NODE_ENV !== 'development') {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        console.error('❌ Authentication failed:', authError)
        return NextResponse.json({ error: '認証が必要です', details: authError }, { status: 401 })
      }
      user = authUser
    } else {
      // 開発環境では認証をスキップしてテスト用のダミーユーザーを使用
      user = { id: 'test-user-id' }
    }

    console.log('✅ User authenticated:', user.id)

    const body = await request.json()
    const { pageContent, projectInfo } = body

    if (!pageContent) {
      console.error('❌ No pageContent provided')
      return NextResponse.json({ error: 'pageContentが必要です' }, { status: 400 })
    }

    console.log('📦 Received pageContent length:', pageContent.length)

    // DBからプロジェクト情報を取得してプロジェクト名を確認
    let actualProjectName = projectIdParam
    
    // まず、projectIdParamが実際のプロジェクト名かどうかを確認
    let projectPath = path.join(process.cwd(), 'generated_projects', projectIdParam)
    
    try {
      await fs.access(projectPath)
      console.log('✅ Direct project directory found:', projectPath)
    } catch {
      // プロジェクトディレクトリが見つからない場合、DBから検索
      console.log('🔍 Searching for project in database...')
      
      let projectsQuery = supabase
        .from('projects')
        .select('archive_path, name')
        .eq('id', projectIdParam)
        .limit(1)
      
      // 開発環境でない場合のみuser_idでフィルタリング
      if (process.env.NODE_ENV !== 'development') {
        projectsQuery = projectsQuery.eq('user_id', user.id)
      }

      const { data: projects, error: fetchError } = await projectsQuery

      if (fetchError || !projects || projects.length === 0) {
        console.error('❌ Project not found in database:', fetchError)
        return NextResponse.json(
          { error: 'プロジェクトがデータベースに見つかりません', projectId: projectIdParam },
          { status: 404 }
        )
      }

      const project = projects[0]
      console.log('📋 Found project in DB:', project)

      // archive_pathからプロジェクト名を抽出
      if (project.archive_path && project.archive_path !== 'web-mode-no-archive') {
        const pathParts = project.archive_path.split('/')
        actualProjectName = pathParts[pathParts.length - 1].replace('.zip', '')
        console.log('🎯 Extracted project name from archive_path:', actualProjectName)
      } else {
        // プロジェクト名がない場合は、generated_projectsディレクトリをスキャン
        const generatedProjectsDir = path.join(process.cwd(), 'generated_projects')
        const dirents = await fs.readdir(generatedProjectsDir, { withFileTypes: true })
        
        for (const dirent of dirents) {
          if (dirent.isDirectory()) {
            const projectInfoPath = path.join(generatedProjectsDir, dirent.name, 'project-info.json')
            try {
              const projectInfoContent = await fs.readFile(projectInfoPath, 'utf8')
              const projectInfoData = JSON.parse(projectInfoContent)
              
              // プロジェクト名またはサイト名でマッチング
              if (projectInfoData.siteName === project.name || 
                  projectInfoData.projectName === project.name ||
                  dirent.name.includes(project.name.toLowerCase().replace(/\s+/g, '-'))) {
                actualProjectName = dirent.name
                console.log('🎯 Found matching project directory:', actualProjectName)
                break
              }
            } catch (e) {
              // project-info.jsonが読めない場合はスキップ
              continue
            }
          }
        }
      }

      projectPath = path.join(process.cwd(), 'generated_projects', actualProjectName)
    }

    console.log('📂 Final project path:', projectPath)

    // プロジェクトディレクトリの存在確認
    try {
      await fs.access(projectPath)
      console.log('✅ Project directory exists')
    } catch (accessError) {
      console.error('❌ Project directory not found:', projectPath, accessError)
      return NextResponse.json(
        { 
          error: 'プロジェクトディレクトリが見つかりません', 
          projectPath,
          actualProjectName,
          originalId: projectIdParam,
          details: accessError 
        },
        { status: 404 }
      )
    }

    // page.tsxファイルのパス
    const pageFilePath = path.join(projectPath, 'src', 'app', 'page.tsx')
    console.log('📄 Page file path:', pageFilePath)

    try {
      // ディレクトリ構造を確認・作成
      const srcAppDir = path.join(projectPath, 'src', 'app')
      try {
        await fs.access(srcAppDir)
        console.log('✅ src/app directory exists')
      } catch {
        console.log('📁 Creating src/app directory...')
        await fs.mkdir(srcAppDir, { recursive: true })
      }

      // 新しいpage.tsxの内容を書き込み
      await fs.writeFile(pageFilePath, pageContent, 'utf8')
      console.log(`✅ Updated page.tsx for project ${actualProjectName}`)

      // プロジェクト情報も更新（必要に応じて）
      if (projectInfo) {
        const projectInfoPath = path.join(projectPath, 'project-info.json')
        await fs.writeFile(
          projectInfoPath, 
          JSON.stringify(projectInfo, null, 2), 
          'utf8'
        )
        console.log(`✅ Updated project-info.json for project ${actualProjectName}`)
      }

      return NextResponse.json({
        success: true,
        message: 'プロジェクトが正常に更新されました',
        updatedAt: new Date().toISOString(),
        filePath: pageFilePath,
        actualProjectName
      })

    } catch (writeError) {
      console.error('❌ Error writing files:', writeError)
      return NextResponse.json(
        { 
          error: 'ファイルの書き込みに失敗しました',
          details: writeError.message,
          filePath: pageFilePath,
          actualProjectName
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error updating project:', error)
    return NextResponse.json(
      { 
        error: 'プロジェクトの更新に失敗しました',
        details: error.message 
      },
      { status: 500 }
    )
  }
}