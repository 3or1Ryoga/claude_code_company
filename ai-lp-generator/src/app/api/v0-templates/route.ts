import { NextRequest, NextResponse } from 'next/server'
import { v0ChatService } from '@/lib/v0-chat'

// V0風テンプレート取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'

    if (featured) {
      // 人気テンプレート取得
      const templates = await v0ChatService.getFeaturedTemplates(category || undefined)
      
      return NextResponse.json({
        success: true,
        templates
      })
    }

    // すべてのテンプレート取得（カテゴリフィルタリング対応）
    const supabase = (v0ChatService as any).supabase || 
      require('@supabase/supabase-js').createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

    let query = supabase
      .from('v0_generated_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query.limit(20)

    if (error) {
      throw new Error(`テンプレート取得に失敗: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      templates: templates || []
    })

  } catch (error) {
    console.error('V0 Templates API Error:', error)
    return NextResponse.json(
      { error: 'テンプレート取得に失敗しました' },
      { status: 500 }
    )
  }
}

// V0風テンプレート作成API（管理者用）
export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      category, 
      industry, 
      sections, 
      config, 
      preview_image_url,
      is_featured = false 
    } = await request.json()

    if (!name || !category || !sections || !config) {
      return NextResponse.json(
        { error: '必要なフィールドが不足しています' },
        { status: 400 }
      )
    }

    const supabase = require('@supabase/supabase-js').createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: template, error } = await supabase
      .from('v0_generated_templates')
      .insert({
        name,
        category,
        industry,
        sections,
        config,
        preview_image_url,
        is_featured,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`テンプレート作成に失敗: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      template
    })

  } catch (error) {
    console.error('V0 Templates Create Error:', error)
    return NextResponse.json(
      { error: 'テンプレート作成に失敗しました' },
      { status: 500 }
    )
  }
}