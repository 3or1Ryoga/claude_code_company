import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { dynamicPreviewManager } from '@/lib/dynamic-preview'

// 全プレビューステータス取得API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // ユーザーのプロジェクト一覧取得
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, preview_status, preview_port, preview_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      throw new Error(`プロジェクト取得エラー: ${projectsError.message}`)
    }

    // アクティブプレビュー情報取得
    const activePreviews = dynamicPreviewManager.getActivePreviews()
    const activePreviewMap = new Map(
      activePreviews.map(preview => [preview.projectId, preview])
    )

    // ポート使用状況取得
    const portUsage = dynamicPreviewManager.getPortUsage()

    // プロジェクトとプレビューステータス統合
    const projectsWithPreview = projects?.map(project => {
      const activePreview = activePreviewMap.get(project.id)
      
      return {
        id: project.id,
        name: project.name,
        created_at: project.created_at,
        preview: activePreview ? {
          status: activePreview.status,
          port: activePreview.port,
          url: activePreview.url,
          startTime: activePreview.startTime,
          isActive: true,
          buildOutput: activePreview.buildOutput?.slice(-10) // 最新10行
        } : {
          status: project.preview_status || 'stopped',
          port: project.preview_port,
          url: project.preview_url,
          isActive: false
        }
      }
    }) || []

    return NextResponse.json({
      success: true,
      projects: projectsWithPreview,
      summary: {
        totalProjects: projects?.length || 0,
        activePreview: activePreviews.length,
        availablePorts: portUsage.available.length,
        usedPorts: portUsage.used.length
      },
      system: {
        portRange: '3002-3010',
        usedPorts: portUsage.used,
        availablePorts: portUsage.available,
        activePreviews: activePreviews.map(p => ({
          projectId: p.projectId,
          port: p.port,
          status: p.status,
          startTime: p.startTime
        }))
      }
    })

  } catch (error) {
    console.error('Preview status overview error:', error)
    return NextResponse.json(
      { error: 'プレビューステータス取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 全プレビュー停止API（管理者用）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 全プレビュー停止
    const stoppedCount = await dynamicPreviewManager.stopAllPreviews()

    // Supabaseの全プレビューステータスを停止に更新
    await supabase
      .from('projects')
      .update({ 
        preview_status: 'stopped',
        preview_port: null,
        preview_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .not('preview_status', 'is', null)

    return NextResponse.json({
      success: true,
      stoppedCount,
      message: `${stoppedCount}個のプレビューを停止しました`
    })

  } catch (error) {
    console.error('Stop all previews error:', error)
    return NextResponse.json(
      { error: '全プレビュー停止に失敗しました' },
      { status: 500 }
    )
  }
}