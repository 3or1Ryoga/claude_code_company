import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAdminStorage } from '@/lib/supabase-admin'

const BUCKET_NAME = 'project-archives'

interface StorageProject {
  id: string
  name: string
  fullPath: string
  size: number
  createdAt: string
  downloadCount?: number
}

export async function GET(request: NextRequest) {
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

    const storage = getAdminStorage()
    
    // List all files in user's folder
    const { data: files, error: listError } = await storage
      .from(BUCKET_NAME)
      .list(user.id, {
        limit: 100,
        offset: 0
      })

    if (listError) {
      console.error('Error listing storage files:', listError)
      return NextResponse.json(
        { error: 'Failed to fetch storage projects' },
        { status: 500 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        projects: []
      })
    }

    const projects: StorageProject[] = []

    // Process each directory (project folder)
    for (const item of files) {
      if (item.name && item.name !== '.emptyFolderPlaceholder') {
        // List files in project folder
        const { data: projectFiles, error: projectError } = await storage
          .from(BUCKET_NAME)
          .list(`${user.id}/${item.name}`, {
            limit: 10
          })

        if (projectError) {
          console.error(`Error listing project ${item.name}:`, projectError)
          continue
        }

        // Find the zip file (usually v1.zip, v2.zip, etc.)
        const zipFile = projectFiles?.find(file => file.name?.endsWith('.zip'))
        
        if (zipFile) {
          // Extract project info from folder name
          const projectName = item.name
          const fullPath = `${user.id}/${item.name}/${zipFile.name}`
          
          // Parse timestamp from project name if it follows the pattern
          let createdAt = item.created_at || new Date().toISOString()
          const timestampMatch = projectName.match(/-(\d{14})$/)
          if (timestampMatch) {
            const timestamp = timestampMatch[1]
            // Convert timestamp format: 20250816014132 -> 2025-08-16T01:41:32Z
            const year = timestamp.substring(0, 4)
            const month = timestamp.substring(4, 6)
            const day = timestamp.substring(6, 8)
            const hour = timestamp.substring(8, 10)
            const minute = timestamp.substring(10, 12)
            const second = timestamp.substring(12, 14)
            createdAt = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`
          }

          projects.push({
            id: projectName,
            name: projectName.replace(/-\d{14}$/, ''), // Remove timestamp for display
            fullPath,
            size: zipFile.metadata?.size || 0,
            createdAt,
            downloadCount: 0 // TODO: Track download count in database
          })
        }
      }
    }

    // Sort by creation date (newest first)
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      projects
    })

  } catch (error) {
    console.error('Error in GET /api/storage/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}