import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageService } from '@/lib/landing-pages'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { importData } = body

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

    if (!importData || !importData.metadata || !importData.config) {
      return NextResponse.json(
        { error: '無効なインポートデータです' },
        { status: 400 }
      )
    }

    const landingPageService = new LandingPageService()
    const importedPage = await landingPageService.importLandingPage(user.id, importData)

    return NextResponse.json({
      success: true,
      data: importedPage,
      message: 'ランディングページがインポートされました'
    })

  } catch (error) {
    console.error('Error importing landing page:', error)
    return NextResponse.json(
      { error: 'ランディングページのインポートに失敗しました' },
      { status: 500 }
    )
  }
}