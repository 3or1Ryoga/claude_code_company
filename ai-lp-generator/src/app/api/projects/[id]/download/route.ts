import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // JWT トークンから user ID を取得
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    let userId: string

    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as any
      userId = decoded.sub
    } catch (error) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 })
    }

    const params = await context.params
    const projectId = params.id

    // プロジェクトの存在確認と所有者チェック (RLS対応)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, archive_path')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ 
        error: 'プロジェクトが見つからないか、アクセス権限がありません' 
      }, { status: 404 })
    }

    if (!project.archive_path) {
      return NextResponse.json({ 
        error: 'このプロジェクトにはダウンロード可能なアーカイブがありません' 
      }, { status: 404 })
    }

    // Supabase Storage から署名URL を生成 (1時間有効)
    const { data, error } = await supabase.storage
      .from('project-archives')
      .createSignedUrl(project.archive_path, 3600) // 1時間有効

    if (error) {
      console.error('署名URL生成エラー:', error)
      return NextResponse.json({ 
        error: '署名URLの生成に失敗しました' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      projectName: project.name,
      expiresIn: 3600
    })

  } catch (error) {
    console.error('ダウンロードAPI エラー:', error)
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました' 
    }, { status: 500 })
  }
}