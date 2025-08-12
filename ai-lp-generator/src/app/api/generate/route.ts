import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateText } from 'ai'
import { vercel } from '@ai-sdk/vercel'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { concept, description, saveProject, projectName } = body
    
    if (!concept) {
      return NextResponse.json(
        { error: 'Concept is required' },
        { status: 400 }
      )
    }

    // Check if V0_API_KEY is set
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: 'V0_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Initialize V0 model
    const v0 = vercel('v0-1.5-md')

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
    function extractDependencies(code: string): string[] {
      const dependencyRegex = /from\s+['"]((?![\.\/\@])[^'"]+)['"]/g
      const dependencies = new Set<string>()
      let match
      while ((match = dependencyRegex.exec(code)) !== null) {
        if (match[1] !== 'react' && !match[1].startsWith('next/')) {
          dependencies.add(match[1])
        }
      }
      return Array.from(dependencies)
    }

    const dependencies = extractDependencies(cleanedCode)

    let savedProject = null

    // Auto-save to projects table if requested
    if (saveProject) {
      const finalProjectName = projectName || `${concept} Landing Page`
      
      try {
        const { data: projectData, error: saveError } = await supabase
          .from('projects')
          .insert({
            name: finalProjectName.trim(),
            concept: concept.trim(),
            description: description?.trim() || null,
            code: cleanedCode,
            dependencies: dependencies
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