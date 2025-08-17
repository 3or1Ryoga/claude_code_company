import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createArchiveDownloadUrl } from '@/lib/storage'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectPath: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { projectPath } = await params
    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      )
    }

    // Decode the path (in case it was URL encoded)
    const decodedPath = decodeURIComponent(projectPath)
    
    // Ensure the path belongs to the current user
    if (!decodedPath.startsWith(`${user.id}/`)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create signed download URL (expires in 10 minutes)
    const signedUrl = await createArchiveDownloadUrl(decodedPath, 600)
    
    // TODO: Track download count in database
    // You could add download tracking here if needed

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 600
    })

  } catch (error) {
    console.error('Error in GET /api/storage/download:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}