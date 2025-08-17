import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { generateProject, GenerateOptions } from '@/lib/generator/generate'
import { zipDirectoryToBuffer } from '@/lib/zip'
import { uploadProjectArchive, createArchiveDownloadUrl } from '@/lib/storage'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { 
      concept, 
      description, 
      saveProject, 
      projectName,
      name,
      file,
      skipAiFix = false,
      start = false,
      useCliMode = false,
      conceptId = null
    } = body
    
    if (!concept && !name && !file) {
      return NextResponse.json(
        { error: 'Concept, name, or file is required' },
        { status: 400 }
      )
    }

    // Check if V0_API_KEY is set
    const v0ApiKey = process.env.V0_API_KEY
    if (!v0ApiKey) {
      return NextResponse.json(
        { error: 'V0_API_KEY not configured' },
        { status: 500 }
      )
    }

    // CLI mode: generate full project
    if (useCliMode) {
      // Authentication check for CLI mode
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

      const projectInfo = await generateProject({
        concept,
        name: name || projectName,
        file,
        skipAiFix,
        start,
        v0ApiKey,
        v0Model: process.env.V0_MODEL
      })

      try {
        // Create ZIP archive and upload to Supabase Storage
        console.log('📦 Creating ZIP archive and uploading to storage...')
        console.log('🔍 DEBUG: Upload parameters:', {
          userId: user.id,
          projectId: projectInfo.projectName,
          directoryPath: projectInfo.projectPath,
          projectInfo: JSON.stringify(projectInfo, null, 2)
        })
        
        const uploadResult = await uploadProjectArchive({
          userId: user.id,
          projectId: projectInfo.projectName,
          version: 1,
          directoryPath: projectInfo.projectPath
        })
        
        console.log('✅ Archive uploaded successfully:', uploadResult.path)
        console.log('📊 Archive size:', uploadResult.size, 'bytes')
        console.log('🔒 Checksum:', uploadResult.checksum)

        // Save project info to database using admin client with new schema
        const adminSupabase = createAdminSupabaseClient()
        const { data: projectData, error: insertError } = await adminSupabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectInfo.siteName,
            description: description || null,
            code: '', // CLI mode generates files, not inline code
            dependencies: (projectInfo as any).dependencies || [],
            concept_id: conceptId, // uuid references concepts(id)
            archive_path: uploadResult.path, // text not null
            archive_size: uploadResult.size, // bigint not null
            checksum: uploadResult.checksum, // text not null
            version: 1 // int default 1
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error saving project to database:', insertError)
          // Don't fail the request, just log the error
        } else {
          console.log('✅ Project saved to database with ID:', projectData.id)
        }

        return NextResponse.json({
          success: true,
          project: projectInfo,
          archive: {
            downloadUrl: uploadResult.signedUrl,
            path: uploadResult.path,
            size: uploadResult.size,
            checksum: uploadResult.checksum
          },
          projectId: projectData?.id || null,
          mode: 'cli'
        })

      } catch (archiveError) {
        console.error('❌ Error creating or uploading archive:', archiveError)
        console.error('❌ Archive error details:', {
          message: (archiveError as any)?.message,
          stack: (archiveError as any)?.stack,
          projectPath: projectInfo?.projectPath,
          userId: user.id
        })
        
        // Return project info even if archiving failed
        return NextResponse.json({
          success: true,
          project: projectInfo,
          archiveError: `Failed to create or upload archive: ${(archiveError as any)?.message}`,
          mode: 'cli'
        })
      }
    }

    // Web mode: generate code only
    const { generateText } = await import('ai')
    const { vercel } = await import('@ai-sdk/vercel')
    const v0 = vercel(process.env.V0_MODEL || 'v0-1.5-md')

    // Create prompt based on concept and description
    const prompt = `
      You are an expert web developer. Based on the concept "${concept}"${description ? ` and description "${description}"` : ''}, 
      generate a single React component for a Next.js App Router page.
      The code should be a complete TSX file content for a landing page. 
      Use TypeScript and Tailwind CSS.
      Create a modern, responsive landing page with:
      - Hero section
      - Features/benefits section
      - Call-to-action section
      - Professional styling with Tailwind CSS
      
      Do not include any explanation, just return the TSX code.
    `

    // Call V0 API to generate code
    const { text: rawCode } = await generateText({ 
      model: v0, 
      prompt: prompt 
    })

    // Clean up markdown code blocks if present
    const cleanedCode = rawCode.replace(/^```tsx\n?/, '').replace(/\n?```$/, '')

    // Extract dependencies from generated code
    const { extractDependencies } = await import('@/lib/generator/generate')
    const dependencies = extractDependencies(cleanedCode)

    let savedProject = null

    // Auto-save to projects table if requested
    if (saveProject) {
      const finalProjectName = projectName || `${concept} Landing Page`
      
      try {
        // Get user for web mode
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

        const { data: projectData, error: saveError } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: finalProjectName.trim(),
            description: description?.trim() || null,
            code: cleanedCode,
            dependencies: dependencies,
            concept_id: conceptId, // uuid references concepts(id)
            archive_path: 'web-mode-no-archive', // text not null (web mode placeholder)
            archive_size: Buffer.byteLength(cleanedCode, 'utf8'), // bigint not null
            checksum: require('crypto').createHash('sha256').update(cleanedCode).digest('hex'), // text not null
            version: 1 // int default 1
          })
          .select()
          .single()

        if (saveError) {
          console.error('Error saving project:', saveError)
          // Don't fail the whole request, just log the error
        } else {
          savedProject = projectData
        }
      } catch (saveError) {
        console.error('Error auto-saving project:', saveError)
        // Continue with the response even if save fails
      }
    }

    // Return generated code, dependencies, and save status
    const response: any = {
      success: true,
      code: cleanedCode,
      dependencies,
      concept,
      description: description || null
    }

    if (saveProject) {
      response.saved = savedProject ? true : false
      if (savedProject) {
        response.project = savedProject
        response.message = 'Landing page generated and saved successfully'
      } else {
        response.saveError = 'Failed to save project, but code generation succeeded'
      }
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error generating LP:', error)
    return NextResponse.json(
      { error: 'Failed to generate landing page' },
      { status: 500 }
    )
  }
}