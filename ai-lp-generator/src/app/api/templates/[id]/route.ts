import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { TemplateService } from '@/lib/templates'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const templateService = new TemplateService()
    const template = await templateService.getTemplate(id)

    if (!template) {
      return NextResponse.json(
        { error: 'テンプレートが見つかりません' },
        { status: 404 }
      )
    }

    // Increment usage count if template is accessed
    await templateService.incrementUsageCount(id)

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Error in GET /api/templates/[id]:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    const body = await request.json()
    
    const { name, description, config, category, sections, thumbnail, is_public } = body

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const templateService = new TemplateService()
    const template = await templateService.updateTemplate(id, user.id, {
      name,
      description,
      config,
      category,
      sections,
      thumbnail,
      is_public
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'テンプレートが更新されました'
    })

  } catch (error) {
    console.error('Error in PUT /api/templates/[id]:', error)
    return NextResponse.json(
      { error: 'テンプレートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const templateService = new TemplateService()
    await templateService.deleteTemplate(id, user.id)

    return NextResponse.json({
      success: true,
      message: 'テンプレートが削除されました'
    })

  } catch (error) {
    console.error('Error in DELETE /api/templates/[id]:', error)
    return NextResponse.json(
      { error: 'テンプレートの削除に失敗しました' },
      { status: 500 }
    )
  }
}