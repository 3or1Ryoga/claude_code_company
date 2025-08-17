import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { TemplateService } from '@/lib/templates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('user_id')

    const templateService = new TemplateService()

    let result
    if (userId) {
      // Get user's templates (including public ones)
      result = await templateService.getUserTemplates(userId, {
        limit,
        offset,
        search: search || undefined,
        include_public: true
      })
    } else {
      // Get public templates only
      result = await templateService.getPublicTemplates({
        category: category || undefined,
        limit,
        offset,
        search: search || undefined
      })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/templates:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
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

    if (!name || !config || !sections) {
      return NextResponse.json(
        { error: 'テンプレート名、設定、セクションは必須です' },
        { status: 400 }
      )
    }

    const templateService = new TemplateService()
    const template = await templateService.createTemplate(user.id, {
      name,
      description,
      category: category || 'custom',
      thumbnail,
      sections,
      config,
      is_public: is_public || false
    })

    return NextResponse.json({
      success: true,
      data: template,
      message: 'テンプレートが作成されました'
    })

  } catch (error) {
    console.error('Error in POST /api/templates:', error)
    return NextResponse.json(
      { error: 'テンプレートの作成に失敗しました' },
      { status: 500 }
    )
  }
}