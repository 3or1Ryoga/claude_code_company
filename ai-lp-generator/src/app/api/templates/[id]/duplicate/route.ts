import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { TemplateService } from '@/lib/templates'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { id } = await params
    const body = await request.json()
    const { newName } = body

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
    const duplicatedTemplate = await templateService.duplicateTemplate(
      id, 
      user.id, 
      newName
    )

    return NextResponse.json({
      success: true,
      data: duplicatedTemplate,
      message: 'テンプレートが複製されました'
    })

  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { error: 'テンプレートの複製に失敗しました' },
      { status: 500 }
    )
  }
}