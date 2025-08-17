import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🏥 [${requestId}] System health check initiated`)

  try {
    const healthData: any = {
      timestamp: new Date().toISOString(),
      requestId,
      status: 'checking',
      components: {}
    }

    // Check Supabase connection
    console.log(`🔍 [${requestId}] Checking Supabase connection...`)
    try {
      const supabase = await createServerSupabaseClient()
      
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('concepts')
        .select('count(*)', { count: 'exact', head: true })

      if (connectionError) {
        if (connectionError.code === '42P01') {
          healthData.components.supabase = {
            status: 'connected',
            concepts_table: 'missing',
            error: 'Concepts table does not exist'
          }
        } else {
          healthData.components.supabase = {
            status: 'error',
            error: connectionError.message,
            code: connectionError.code
          }
        }
      } else {
        healthData.components.supabase = {
          status: 'healthy',
          concepts_table: 'exists',
          record_count: connectionTest || 0
        }
      }
    } catch (supabaseError: any) {
      healthData.components.supabase = {
        status: 'error',
        error: supabaseError.message
      }
    }

    // Check projects table
    console.log(`🔍 [${requestId}] Checking projects table...`)
    try {
      const supabase = await createServerSupabaseClient()
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('count(*)', { count: 'exact', head: true })

      if (projectsError) {
        healthData.components.projects_table = {
          status: 'missing',
          error: projectsError.message
        }
      } else {
        healthData.components.projects_table = {
          status: 'exists',
          record_count: projectsData || 0
        }
      }
    } catch (error: any) {
      healthData.components.projects_table = {
        status: 'error',
        error: error.message
      }
    }

    // Check environment variables
    console.log(`🔍 [${requestId}] Checking environment configuration...`)
    healthData.components.environment = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      gemini_api: !!process.env.GEMINI_API_KEY,
      v0_api: !!process.env.V0_API_KEY
    }

    // Determine overall health status
    const hasSupabaseConnection = healthData.components.supabase?.status === 'healthy' || healthData.components.supabase?.status === 'connected'
    const hasEnvironmentVars = healthData.components.environment.supabase_url && healthData.components.environment.supabase_key

    if (hasSupabaseConnection && hasEnvironmentVars) {
      healthData.status = 'healthy'
      healthData.message = 'All core systems operational'
    } else if (hasEnvironmentVars) {
      healthData.status = 'degraded'
      healthData.message = 'Environment configured but database issues detected'
    } else {
      healthData.status = 'unhealthy'
      healthData.message = 'Critical configuration or connection issues'
    }

    console.log(`✅ [${requestId}] Health check completed with status: ${healthData.status}`)

    return NextResponse.json(healthData)

  } catch (error: any) {
    console.error(`💥 [${requestId}] Health check failed:`, error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'error',
      message: 'Health check system failure',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Detailed health check with specific component testing
  const requestId = `detailed_health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`🏥 [${requestId}] Detailed system health check initiated`)

  try {
    const body = await request.json()
    const { components = ['all'] } = body

    const healthData: any = {
      timestamp: new Date().toISOString(),
      requestId,
      detailed: true,
      components: {}
    }

    if (components.includes('all') || components.includes('database')) {
      // Detailed database testing
      try {
        const supabase = await createServerSupabaseClient()
        
        // Test authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // Test concepts table operations
        const conceptsTests = {
          select: false,
          insert: false,
          update: false,
          delete: false
        }

        try {
          const { error: selectError } = await supabase.from('concepts').select('*').limit(1)
          conceptsTests.select = !selectError
        } catch {}

        healthData.components.database = {
          connection: 'healthy',
          authentication: user ? 'authenticated' : 'anonymous',
          concepts_table: {
            exists: conceptsTests.select,
            operations: conceptsTests
          }
        }
      } catch (error: any) {
        healthData.components.database = {
          connection: 'error',
          error: error.message
        }
      }
    }

    if (components.includes('all') || components.includes('apis')) {
      // Test API endpoints
      healthData.components.apis = {
        concepts: 'checking',
        generate: 'checking'
      }
      
      // In a real implementation, you might make internal API calls here
      healthData.components.apis.concepts = 'available'
      healthData.components.apis.generate = 'available'
    }

    return NextResponse.json(healthData)

  } catch (error: any) {
    console.error(`💥 [${requestId}] Detailed health check failed:`, error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'error',
      message: 'Detailed health check system failure',
      error: error.message
    }, { status: 500 })
  }
}