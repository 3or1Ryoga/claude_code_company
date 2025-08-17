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
    const landingPage = await landingPageService.publishLandingPage(id, user.id)

    return NextResponse.json({
      success: true,
      data: landingPage,
      message: 'ランディングページが公開されました'
    })

  } catch (error) {
    console.error('Error publishing landing page:', error)
    return NextResponse.json(
      { error: 'ランディングページの公開に失敗しました' },
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

    const landingPageService = new LandingPageService()
    const landingPage = await landingPageService.unpublishLandingPage(id, user.id)

    return NextResponse.json({
      success: true,
      data: landingPage,
      message: 'ランディングページが非公開になりました'
    })

  } catch (error) {
    console.error('Error unpublishing landing page:', error)
    return NextResponse.json(
      { error: 'ランディングページの非公開に失敗しました' },
      { status: 500 }
    )
  }
}