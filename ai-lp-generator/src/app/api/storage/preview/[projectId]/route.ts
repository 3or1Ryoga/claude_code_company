import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminStorage } from '@/lib/supabase-admin'

const BUCKET_NAME = 'project-archives'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const storage = getAdminStorage()

    console.log(`🔍 Storage API: Searching for projectId=${projectId} under user=${user.id}`)
    console.log(`🔍 Storage API: Looking in path="${user.id}/${projectId}"`)

    // Find the zip file for this project
    const { data: projectFiles, error: listError } = await storage
      .from(BUCKET_NAME)
      .list(`${user.id}/${projectId}`, {
        limit: 10
      })

    if (listError) {
      console.error('❌ Error listing project files:', listError)
      console.error('❌ Error details:', {
        message: listError.message,
        stack: listError.stack,
        status: listError.statusCode,
        originalError: listError.originalError
      })
      return NextResponse.json(
        { error: 'Failed to access project files', details: listError },
        { status: 500 }
      )
    }

    console.log('✅ Storage API response received')
    console.log('📂 Found files:', projectFiles?.map(f => ({ name: f.name, size: f.metadata?.size })))

    const zipFile = projectFiles?.find(file => file.name?.endsWith('.zip'))
    if (!zipFile) {
      return NextResponse.json(
        { error: 'Project archive not found' },
        { status: 404 }
      )
    }

    const zipPath = `${user.id}/${projectId}/${zipFile.name}`

    // Download the zip file
    const { data: zipData, error: downloadError } = await storage
      .from(BUCKET_NAME)
      .download(zipPath)

    if (downloadError) {
      console.error('Error downloading zip file:', downloadError)
      return NextResponse.json(
        { error: 'Failed to download project archive' },
        { status: 500 }
      )
    }

    // Extract and process the zip content
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Load zip content
      const zipContent = await zip.loadAsync(await zipData.arrayBuffer())
      
      // Look for project-info.json
      let projectInfo = null
      const projectInfoFile = zipContent.files['project-info.json']
      if (projectInfoFile) {
        const infoContent = await projectInfoFile.async('string')
        try {
          projectInfo = JSON.parse(infoContent)
        } catch (e) {
          console.warn('Failed to parse project-info.json:', e)
        }
      }

      // Look for page.tsx (the main LP file)
      let pageContent = null
      const pageFile = zipContent.files['src/app/page.tsx']
      if (pageFile) {
        pageContent = await pageFile.async('string')
      } else {
        // Try to find any tsx or jsx file in src/app/
        for (const fileName of Object.keys(zipContent.files)) {
          if (fileName.includes('src/app/') && (fileName.endsWith('.tsx') || fileName.endsWith('.jsx'))) {
            const file = zipContent.files[fileName]
            pageContent = await file.async('string')
            break
          }
        }
      }

      // Create preview data
      const previewData = {
        projectInfo: projectInfo || {
          projectName: projectId,
          siteName: projectId.replace(/-\d{14}$/, ''),
          createdAt: new Date().toISOString()
        },
        pageContent,
        hasPreview: !!pageContent,
        zipFileCount: Object.keys(zipContent.files).length
      }

      return NextResponse.json({
        success: true,
        preview: previewData
      })

    } catch (zipError) {
      console.error('Error processing zip file:', zipError)
      return NextResponse.json(
        { error: 'Failed to process project archive' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in GET /api/storage/preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}