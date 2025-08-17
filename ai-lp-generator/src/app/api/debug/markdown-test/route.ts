import { NextRequest, NextResponse } from 'next/server'
import { 
  ConceptParams,
  generateMarkdownWithGemini,
  buildMarkdown
} from '@/lib/generator/concept'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 DEBUG: Markdown test starting...')
    
    const body = await request.json()
    const params: ConceptParams = {
      siteName: body.siteName || 'DEBUG TEST SITE',
      brief: body.brief || 'デバッグテスト用サイト',
      problem: 'デバッグテスト問題',
      affinity: 'デバッグテスト親近感',
      solution: 'デバッグテスト解決策',
      offer: 'デバッグテスト提案',
      narrowingDown: 'デバッグテスト絞り込み',
      action: 'デバッグテストアクション',
      colors: {
        primary: '#0EA5E9',
        accent: '#9333EA',
        background: '#0B1221',
      },
      nav: ['Home', 'About', 'Contact'],
      logoText: 'DEBUG',
      socials: {
        x: '',
        linkedin: '',
        github: '',
      },
      contact: {
        email: 'debug@test.com',
        url: 'https://debug.test',
      },
    }
    
    console.log('🚨 DEBUG: Testing markdown generation with params:', params)
    
    // Test fallback markdown generation first
    const fallbackMarkdown = buildMarkdown(params)
    console.log('🚨 DEBUG: Fallback markdown generated, length:', fallbackMarkdown.length)
    
    // Test Gemini markdown generation (if available)
    let geminiMarkdown: string | null = null
    try {
      geminiMarkdown = await generateMarkdownWithGemini(params, params.brief)
      console.log('🚨 DEBUG: Gemini markdown generated, length:', geminiMarkdown.length)
    } catch (geminiError) {
      console.log('🚨 DEBUG: Gemini generation failed (expected if no API key):', geminiError)
    }
    
    return NextResponse.json({
      success: true,
      message: 'Markdown generation test successful',
      results: {
        fallback: {
          success: true,
          length: fallbackMarkdown.length,
          preview: fallbackMarkdown.substring(0, 200) + '...'
        },
        gemini: geminiMarkdown ? {
          success: true,
          length: geminiMarkdown.length,
          preview: geminiMarkdown.substring(0, 200) + '...'
        } : {
          success: false,
          error: 'Gemini API not available or failed'
        }
      }
    })
    
  } catch (error: any) {
    console.error('🚨 DEBUG: Markdown test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}