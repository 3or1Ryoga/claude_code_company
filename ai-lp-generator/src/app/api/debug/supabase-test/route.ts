import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 DEBUG: Supabase test starting...')
    
    // Test Supabase connection
    const supabase = await createServerSupabaseClient()
    console.log('🚨 DEBUG: Supabase client created')
    
    // Test authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    console.log('🚨 DEBUG: Auth check result:', { user: user?.id, authError })
    
    if (authError) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed',
        details: authError
      })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      })
    }
    
    // Test database connection with a simple query
    const { data: testData, error: queryError } = await supabase
      .from('concepts')
      .select('count')
      .limit(1)
    
    console.log('🚨 DEBUG: Test query result:', { testData, queryError })
    
    if (queryError) {
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        details: queryError
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      user: {
        id: user.id,
        email: user.email
      },
      database: {
        connected: true,
        testQuery: 'concepts table accessible'
      }
    })
    
  } catch (error: any) {
    console.error('🚨 DEBUG: Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}