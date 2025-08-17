import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const limit = searchParams.get('limit') || '10'
    const offset = searchParams.get('offset') || '0'
    const search = searchParams.get('search') || ''

    // If ID is provided, fetch single project
    if (id) {
      // First try to get from database by ID
      let { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      // If not found by ID, try to find by project name
      if (error) {
        const { data: nameData, error: nameError } = await supabase
          .from('projects')
          .select('*')
          .eq('name', id)
          .single()
        
        if (nameError) {
          // If still not found, try to create from filesystem
          const fs = await import('fs/promises')
          const path = await import('path')
          
          try {
            const projectDir = path.join(process.cwd(), 'generated_projects', id)
            const projectInfoPath = path.join(projectDir, 'project-info.json')
            const pageFilePath = path.join(projectDir, 'src', 'app', 'page.tsx')
            
            // Check if project directory exists
            await fs.access(projectDir)
            
            let projectInfo = {}
            try {
              const infoData = await fs.readFile(projectInfoPath, 'utf8')
              projectInfo = JSON.parse(infoData)
            } catch (e) {
              // Use default project info if file doesn't exist
              projectInfo = {
                projectName: id,
                siteName: id,
                createdAt: new Date().toISOString()
              }
            }
            
            let generatedCode = ''
            try {
              generatedCode = await fs.readFile(pageFilePath, 'utf8')
            } catch (e) {
              console.warn('Could not read page.tsx file:', e)
            }
            
            // Create a virtual project object
            const virtualProject = {
              id: id,
              project_name: projectInfo.siteName || id,
              name: projectInfo.siteName || id,
              generated_code: generatedCode,
              code: generatedCode,
              concept: projectInfo.concept || '',
              preview_url: null,
              created_at: projectInfo.createdAt || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              status: 'active'
            }
            
            return NextResponse.json({
              success: true,
              project: virtualProject
            })
          } catch (fsError) {
            console.error('Error accessing project files:', fsError)
            return NextResponse.json(
              { error: 'Project not found' },
              { status: 404 }
            )
          }
        } else {
          data = nameData
        }
      }

      return NextResponse.json({
        success: true,
        project: data
      })
    }

    // Otherwise, fetch project list
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,concept.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
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
    console.error('Error in GET /api/projects:', error)
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
    
    const { name, concept, description, code, dependencies } = body

    // Validate required fields
    if (!name || !concept || !code) {
      return NextResponse.json(
        { error: 'Name, concept, and code are required' },
        { status: 400 }
      )
    }

    // Insert new project
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        concept: concept.trim(),
        description: description?.trim() || null,
        code,
        dependencies: dependencies || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Project created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { id, name, concept, description, code, dependencies } = body

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (concept !== undefined) updateData.concept = concept.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (code !== undefined) updateData.code = code
    if (dependencies !== undefined) updateData.dependencies = dependencies

    // Update project
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Project updated successfully'
    })

  } catch (error) {
    console.error('Error in PUT /api/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Delete project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Error in DELETE /api/projects:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
