import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { dynamicPreviewManager } from '@/lib/dynamic-preview'

// プレビュー開始API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId } = await params

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // プロジェクト存在・権限確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id, archive_path')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つからないか、アクセス権限がありません' },
        { status: 404 }
      )
    }

    // プレビュー開始
    const buildStatus = await dynamicPreviewManager.startPreview(projectId)

    // レスポンス
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name
      },
      preview: {
        status: buildStatus.status,
        port: buildStatus.port,
        url: buildStatus.url,
        buildLogs: buildStatus.buildLogs,
        startedAt: buildStatus.startedAt,
        readyAt: buildStatus.readyAt,
        error: buildStatus.error
      }
    })

  } catch (error) {
    console.error('Preview start error:', error)
    return NextResponse.json(
      { error: 'プレビュー開始に失敗しました' },
      { status: 500 }
    )
  }
}

// プレビューステータス取得API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId } = await params

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // プロジェクト権限確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id, preview_status, preview_port, preview_url')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    // 動的プレビューステータス取得
    const previewStatus = dynamicPreviewManager.getPreviewStatus(projectId)

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name
      },
      preview: previewStatus ? {
        status: previewStatus.status,
        port: previewStatus.port,
        url: previewStatus.url,
        startTime: previewStatus.startTime,
        buildOutput: previewStatus.buildOutput?.slice(-20), // 最新20行
        error: previewStatus.error
      } : {
        status: project.preview_status || 'stopped',
        port: project.preview_port,
        url: project.preview_url
      }
    })

  } catch (error) {
    console.error('Preview status error:', error)
    return NextResponse.json(
      { error: 'プレビューステータス取得に失敗しました' },
      { status: 500 }
    )
  }
}

// プレビュー停止API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { projectId } = await params

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // プロジェクト権限確認
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つかりません' },
        { status: 404 }
      )
    }

    // プレビュー停止
    const stopped = await dynamicPreviewManager.stopPreview(projectId)

    return NextResponse.json({
      success: true,
      stopped,
      message: stopped ? 'プレビューを停止しました' : 'プレビューは既に停止しています'
    })

  } catch (error) {
    console.error('Preview stop error:', error)
    return NextResponse.json(
      { error: 'プレビュー停止に失敗しました' },
      { status: 500 }
    )
  }
}