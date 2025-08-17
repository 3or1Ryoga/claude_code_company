import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { LandingPageService } from '@/lib/landing-pages'

export async function GET(
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
    const exportData = await landingPageService.exportLandingPage(id, user.id)

    // Create filename based on landing page name
    const filename = `${exportData.metadata.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'landing_page'}_export.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error exporting landing page:', error)
    return NextResponse.json(
      { error: 'ランディングページのエクスポートに失敗しました' },
      { status: 500 }
    )
  }
}