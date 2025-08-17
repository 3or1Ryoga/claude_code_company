import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageService } from '@/lib/landing-pages'

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

    const landingPageService = new LandingPageService()
    const duplicatedPage = await landingPageService.duplicateLandingPage(
      id, 
      user.id, 
      newName
    )

    return NextResponse.json({
      success: true,
      data: duplicatedPage,
      message: 'ランディングページが複製されました'
    })

  } catch (error) {
    console.error('Error duplicating landing page:', error)
    return NextResponse.json(
      { error: 'ランディングページの複製に失敗しました' },
      { status: 500 }
    )
  }
}