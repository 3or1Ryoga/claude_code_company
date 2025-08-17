import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { 
  saveConceptMarkdown, 
  ConceptParams,
  generateMarkdownWithGemini,
  buildMarkdown
} from '@/lib/generator/concept'

export const runtime = 'nodejs'

// Add OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// PASONA Framework Validation Schema
interface PasonaValidation {
  siteName: string
  problem?: string
  affinity?: string
  solution?: string
  offer?: string
  narrowingDown?: string
  action?: string
  colors?: {
    primary: string
    accent: string
    background: string
  }
  nav?: string[]
  logoText?: string
  socials?: {
    x?: string
    linkedin?: string
    github?: string
  }
  contact?: {
    email?: string
    url?: string
  }
  brief?: string
}

// Enhanced error logging function
function logError(context: string, error: any, additionalData?: any) {
  const timestamp = new Date().toISOString()
  console.error(`🚨 [${timestamp}] ${context}:`, {
    error: error?.message || error,
    stack: error?.stack,
    code: error?.code,
    details: error?.details,
    additionalData
  })
}

// PASONA validation function
function validatePasonaStructure(data: any): { isValid: boolean; errors: string[]; validated: PasonaValidation } {
  const errors: string[] = []
  
  // Required field validation
  if (!data.siteName || typeof data.siteName !== 'string' || data.siteName.trim().length === 0) {
    errors.push('サイト名は必須です')
  }
  
  // PASONA framework completeness check
  const pasonaFields = ['problem', 'affinity', 'solution', 'offer', 'narrowingDown', 'action']
  const missingPasona = pasonaFields.filter(field => 
    !data[field] || typeof data[field] !== 'string' || data[field].trim().length === 0
  )
  
  if (missingPasona.length > 0) {
    console.warn('⚠️ PASONA fields missing or empty:', missingPasona)
  }
  
  // Color validation
  const colorRegex = /^#[0-9A-Fa-f]{6}$/
  if (data.primary && !colorRegex.test(data.primary)) {
    errors.push('プライマリーカラーの形式が正しくありません (#RRGGBB形式)')
  }
  if (data.accent && !colorRegex.test(data.accent)) {
    errors.push('アクセントカラーの形式が正しくありません (#RRGGBB形式)')
  }
  if (data.background && !colorRegex.test(data.background)) {
    errors.push('背景カラーの形式が正しくありません (#RRGGBB形式)')
  }
  
  // Email validation
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('メールアドレスの形式が正しくありません')
  }
  
  // URL validation  
  if (data.url && !/^https?:\/\/.+/.test(data.url)) {
    errors.push('URLの形式が正しくありません (http://またはhttps://)')
  }
  
  const validated: PasonaValidation = {
    siteName: String(data.siteName || '').trim(),
    brief: data.brief?.trim() || '',
    problem: data.problem?.trim() || '',
    affinity: data.affinity?.trim() || '',
    solution: data.solution?.trim() || '',
    offer: data.offer?.trim() || '',
    narrowingDown: data.narrowingDown?.trim() || '',
    action: data.action?.trim() || '',
    colors: {
      primary: data.primary?.trim() || '#0EA5E9',
      accent: data.accent?.trim() || '#9333EA',
      background: data.background?.trim() || '#0B1221',
    },
    nav: String(data.nav || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean),
    logoText: data.logoText?.trim() || '',
    socials: {
      x: data.x?.trim() || '',
      linkedin: data.linkedin?.trim() || '',
      github: data.github?.trim() || '',
    },
    contact: {
      email: data.email?.trim() || '',
      url: data.url?.trim() || '',
    }
  }
  
  return { isValid: errors.length === 0, errors, validated }
}

// Retry mechanism for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      logError(`Retry attempt ${attempt}/${maxRetries} failed`, error)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🚨 [${requestId}] Concepts API POST request received`)
  
  try {
    // Authentication check with enhanced logging
    console.log(`🔐 [${requestId}] Checking authentication...`)
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      logError(`[${requestId}] Authentication error`, authError)
      return NextResponse.json(
        { 
          success: false,
          error: '認証エラーが発生しました',
          details: authError.message,
          requestId 
        },
        { status: 401 }
      )
    }

    if (!user) {
      console.log(`⚠️ [${requestId}] No authenticated user found`)
      return NextResponse.json(
        { 
          success: false,
          error: '認証が必要です',
          requestId 
        },
        { status: 401 }
      )
    }

    console.log(`✅ [${requestId}] User authenticated: ${user.id}`)

    // Request body parsing with enhanced error handling
    let body: any
    try {
      body = await request.json()
      console.log(`📝 [${requestId}] Request body parsed successfully`)
      console.log(`📊 [${requestId}] Request data:`, JSON.stringify(body, null, 2))
    } catch (parseError) {
      logError(`[${requestId}] JSON parsing failed`, parseError)
      return NextResponse.json(
        { 
          success: false,
          error: 'リクエストデータの形式が正しくありません',
          requestId 
        },
        { status: 400 }
      )
    }

    // PASONA structure validation
    console.log(`🧪 [${requestId}] Validating PASONA structure...`)
    const validation = validatePasonaStructure(body)
    
    if (!validation.isValid) {
      console.log(`❌ [${requestId}] Validation failed:`, validation.errors)
      return NextResponse.json(
        { 
          success: false,
          error: 'データ検証に失敗しました',
          validationErrors: validation.errors,
          requestId 
        },
        { status: 400 }
      )
    }

    console.log(`✅ [${requestId}] PASONA validation passed`)
    const params = validation.validated

    // Convert to ConceptParams format for existing functions
    const conceptParams: ConceptParams = {
      siteName: params.siteName,
      brief: params.brief,
      problem: params.problem,
      affinity: params.affinity,
      solution: params.solution,
      offer: params.offer,
      narrowingDown: params.narrowingDown,
      action: params.action,
      colors: params.colors!,
      nav: params.nav!,
      logoText: params.logoText,
      socials: params.socials!,
      contact: params.contact!
    }

    console.log(`💭 [${requestId}] Starting markdown generation...`)
    
    // Generate markdown with retry mechanism
    let markdown: string
    try {
      markdown = await retryOperation(async () => {
        try {
          const result = await generateMarkdownWithGemini(conceptParams, params.brief)
          console.log(`✨ [${requestId}] Gemini API markdown generation successful`)
          return result
        } catch (geminiError) {
          console.log(`⚠️ [${requestId}] Gemini generation failed, using fallback:`, (geminiError as Error).message)
          const fallback = buildMarkdown(conceptParams)
          console.log(`📝 [${requestId}] Fallback markdown generation successful`)
          return fallback
        }
      })
    } catch (markdownError) {
      logError(`[${requestId}] Markdown generation failed completely`, markdownError)
      return NextResponse.json(
        { 
          success: false,
          error: 'マークダウン生成に失敗しました',
          details: (markdownError as Error).message,
          requestId 
        },
        { status: 500 }
      )
    }

    // Save markdown file with retry
    let fileResult: any
    try {
      console.log(`💾 [${requestId}] Saving concept markdown file...`)
      fileResult = await retryOperation(() => 
        saveConceptMarkdown({ ...conceptParams, markdown })
      )
      console.log(`✅ [${requestId}] Concept file saved: ${fileResult.filePathRelative}`)
    } catch (fileError) {
      logError(`[${requestId}] File save failed`, fileError)
      return NextResponse.json(
        { 
          success: false,
          error: 'ファイル保存に失敗しました',
          details: (fileError as Error).message,
          requestId 
        },
        { status: 500 }
      )
    }
    
    // Save to Supabase with retry mechanism
    console.log(`🗄️ [${requestId}] Saving to Supabase concepts table...`)
    
    const dbOperation = async () => {
      const { data: conceptData, error: insertError } = await supabase
        .from('concepts')
        .insert({
          site_name: params.siteName,
          pasona_input: {
            problem: params.problem,
            affinity: params.affinity,
            solution: params.solution,
            offer: params.offer,
            narrowing_down: params.narrowingDown,
            action: params.action
          },
          markdown_content: markdown,
          brief: params.brief,
          colors: params.colors,
          nav: params.nav,
          logo_text: params.logoText,
          socials: params.socials,
          contact: params.contact,
          file_path: fileResult.filePathRelative,
          user_id: user.id
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }
      
      return conceptData
    }

    let conceptData: any
    try {
      conceptData = await retryOperation(dbOperation)
      console.log(`✅ [${requestId}] Concept saved to database with ID: ${conceptData.id}`)
    } catch (dbError) {
      logError(`[${requestId}] Database insert failed`, dbError, {
        userId: user.id,
        siteName: params.siteName,
        filePathRelative: fileResult.filePathRelative
      })
      
      // Enhanced error handling for missing table
      if ((dbError as any)?.code === '42P01') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Conceptsテーブルが存在しません',
            details: 'EMERGENCY_CONCEPTS_TABLE.sql をSupabaseダッシュボードで実行してください',
            code: (dbError as any)?.code,
            sqlFile: 'EMERGENCY_CONCEPTS_TABLE.sql',
            instructions: 'Supabase Dashboard > SQL Editor で緊急SQLを実行',
            requestId 
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: 'データベース保存に失敗しました',
          details: (dbError as any)?.message,
          code: (dbError as any)?.code,
          requestId 
        },
        { status: 500 }
      )
    }
    
    // Success response
    const successResponse = { 
      success: true, 
      conceptId: conceptData.id,
      filePath: fileResult.filePathRelative,
      siteName: params.siteName,
      message: `コンセプト「${params.siteName}」を作成しました`,
      requestId,
      timestamp: new Date().toISOString()
    }
    
    console.log(`🎉 [${requestId}] Concept creation completed successfully`)
    return NextResponse.json(successResponse)
    
  } catch (error: any) {
    logError(`[${requestId}] Unexpected error in POST handler`, error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'サーバー内部エラーが発生しました',
        details: error?.message || 'Unknown error',
        requestId 
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving concepts
export async function GET(request: NextRequest) {
  const requestId = `get_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`📋 [${requestId}] Concepts API GET request received`)
  
  try {
    // Authentication check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: '認証が必要です',
          requestId 
        },
        { status: 401 }
      )
    }

    console.log(`✅ [${requestId}] User authenticated: ${user.id}`)

    // Query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'created_at'
    const sortOrder = searchParams.get('order') || 'desc'

    console.log(`🔍 [${requestId}] Query params: limit=${limit}, offset=${offset}, sort=${sortBy} ${sortOrder}`)

    // Fetch concepts with retry
    const fetchOperation = async () => {
      const { data: concepts, error: fetchError } = await supabase
        .from('concepts')
        .select('*')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1)

      if (fetchError) {
        throw fetchError
      }
      
      return concepts
    }

    const concepts = await retryOperation(fetchOperation)
    
    console.log(`📊 [${requestId}] Retrieved ${concepts.length} concepts`)
    
    return NextResponse.json({
      success: true,
      concepts,
      pagination: {
        limit,
        offset,
        count: concepts.length
      },
      requestId
    })
    
  } catch (error: any) {
    logError(`[${requestId}] Error in GET handler`, error)
    return NextResponse.json(
      { 
        success: false,
        error: 'コンセプト取得に失敗しました',
        details: error?.message || 'Unknown error',
        requestId 
      },
      { status: 500 }
    )
  }
}