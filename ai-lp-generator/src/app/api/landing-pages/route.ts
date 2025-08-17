import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '10'
    const offset = searchParams.get('offset') || '0'
    const search = searchParams.get('search') || ''

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

    let query = supabase
      .from('projects')
      .select('id, name, concept, description, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,concept.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching landing pages:', error)
      return NextResponse.json(
        { error: 'ランディングページの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

  } catch (error) {
    console.error('Error in GET /api/landing-pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { name, concept, description, template_id, layout_config } = body

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

    if (!name || !concept) {
      return NextResponse.json(
        { error: 'ランディングページ名とコンセプトは必須です' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        concept: concept.trim(),
        description: description?.trim() || null,
        code: JSON.stringify(layout_config || {}),
        dependencies: [],
        archive_path: 'editor-mode-no-archive',
        archive_size: 0,
        checksum: 'editor-mode',
        version: 1
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating landing page:', error)
      return NextResponse.json(
        { error: 'ランディングページの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'ランディングページが作成されました'
    })

  } catch (error) {
    console.error('Error in POST /api/landing-pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}