import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { fixCodeFiles, AiFixOptions } from '@/lib/generator/aiFix'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const { 
      code, 
      errors, 
      projectId,
      path: targetPath,
      useCliMode = false
    } = body
    
    // CLI mode: fix files in directory
    if (useCliMode && targetPath) {
      const geminiApiKey = process.env.GEMINI_API_KEY
      const geminiModel = process.env.GEMINI_MODEL

      const results = await fixCodeFiles({
        path: targetPath,
        geminiApiKey,
        geminiModel
      })

      return NextResponse.json({
        success: true,
        results,
        mode: 'cli'
      })
    }

    // Web mode: fix single code block
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    if (!errors || errors.length === 0) {
      return NextResponse.json(
        { error: 'At least one error description is required' },
        { status: 400 }
      )
    }

    // Check if V0_API_KEY is set for web mode
    if (!process.env.V0_API_KEY) {
      return NextResponse.json(
        { error: 'V0_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Initialize V0 model for web mode
    const { generateText } = await import('ai')
    const { vercel } = await import('@ai-sdk/vercel')
    const v0 = vercel('v0-1.5-md')

    // Create prompt for fixing errors
    const prompt = `
      You are an expert React and Next.js developer. 
      The following code has some errors or issues that need to be fixed:

      ORIGINAL CODE:
      \`\`\`tsx
      ${code}
      \`\`\`

      ERRORS TO FIX:
      ${errors}

      Please fix all the mentioned errors and return the corrected TSX code.
      Make sure to:
      1. Fix all syntax errors
      2. Add missing imports if needed
      3. Ensure TypeScript types are correct
      4. Keep the same structure and functionality
      5. Use proper React and Next.js patterns
      
      Return ONLY the fixed TSX code without any explanation or markdown formatting.
    `

    // Call V0 API to fix the code
    const { text: rawFixedCode } = await generateText({ 
      model: v0, 
      prompt: prompt 
    })

    // Clean up markdown code blocks if present
    const fixedCode = rawFixedCode.replace(/^```tsx?\n?/, '').replace(/\n?```$/, '')

    // If projectId is provided, update the project with fixed code
    if (projectId) {
      try {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            code: fixedCode,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)

        if (updateError) {
          console.error('Error updating project with fixed code:', updateError)
        }
      } catch (updateError) {
        console.error('Error updating project:', updateError)
      }
    }

    // Return fixed code
    return NextResponse.json({
      success: true,
      fixedCode,
      message: 'Code has been successfully fixed'
    })
    
  } catch (error) {
    console.error('Error fixing code with AI:', error)
    return NextResponse.json(
      { error: 'Failed to fix code with AI' },
      { status: 500 }
    )
  }
}