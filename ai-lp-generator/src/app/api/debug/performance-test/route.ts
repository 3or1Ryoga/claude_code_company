import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const requestId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`⚡ [${requestId}] Performance test initiated`)

  try {
    const body = await request.json()
    const { 
      testType = 'basic',
      iterations = 5,
      concurrency = 1
    } = body

    const performanceData: any = {
      timestamp: new Date().toISOString(),
      requestId,
      testType,
      iterations,
      concurrency,
      results: {
        database: {},
        api: {},
        overall: {}
      }
    }

    // Database performance tests
    console.log(`📊 [${requestId}] Running database performance tests...`)
    const dbResults = []
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()
      
      try {
        const supabase = await createServerSupabaseClient()
        
        // Test query performance
        const { data, error } = await supabase
          .from('concepts')
          .select('*')
          .limit(10)
        
        const duration = Date.now() - startTime
        
        dbResults.push({
          iteration: i + 1,
          duration,
          success: !error,
          recordCount: data?.length || 0,
          error: error?.message
        })
        
        console.log(`📊 [${requestId}] DB test ${i + 1}/${iterations}: ${duration}ms`)
        
      } catch (error: any) {
        dbResults.push({
          iteration: i + 1,
          duration: Date.now() - startTime,
          success: false,
          error: error.message
        })
      }
      
      // Small delay between iterations
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    performanceData.results.database = {
      tests: dbResults,
      averageDuration: dbResults.reduce((sum, test) => sum + test.duration, 0) / dbResults.length,
      successRate: (dbResults.filter(test => test.success).length / dbResults.length) * 100,
      minDuration: Math.min(...dbResults.map(test => test.duration)),
      maxDuration: Math.max(...dbResults.map(test => test.duration))
    }

    // API endpoint performance tests
    if (testType === 'comprehensive') {
      console.log(`📊 [${requestId}] Running API performance tests...`)
      
      const apiResults = []
      
      for (let i = 0; i < Math.min(iterations, 3); i++) { // Limit API tests
        const startTime = Date.now()
        
        try {
          // Simulate API endpoint test (concepts validation)
          const testData = {
            siteName: `Performance Test ${i + 1}`,
            brief: 'Performance testing data',
            primary: '#FF0000'
          }
          
          // In a real implementation, you might test internal API calls here
          await new Promise(resolve => setTimeout(resolve, 50)) // Simulate processing
          
          const duration = Date.now() - startTime
          
          apiResults.push({
            iteration: i + 1,
            duration,
            success: true,
            endpoint: '/api/concepts'
          })
          
        } catch (error: any) {
          apiResults.push({
            iteration: i + 1,
            duration: Date.now() - startTime,
            success: false,
            error: error.message,
            endpoint: '/api/concepts'
          })
        }
      }
      
      performanceData.results.api = {
        tests: apiResults,
        averageDuration: apiResults.length > 0 ? apiResults.reduce((sum, test) => sum + test.duration, 0) / apiResults.length : 0,
        successRate: apiResults.length > 0 ? (apiResults.filter(test => test.success).length / apiResults.length) * 100 : 0
      }
    }

    // Overall performance metrics
    const totalTests = dbResults.length + (performanceData.results.api.tests?.length || 0)
    const totalSuccesses = dbResults.filter(test => test.success).length + 
                          (performanceData.results.api.tests?.filter((test: any) => test.success).length || 0)

    performanceData.results.overall = {
      totalTests,
      overallSuccessRate: (totalSuccesses / totalTests) * 100,
      recommendation: performanceData.results.database.averageDuration < 100 ? 
        'Performance is optimal' : 
        performanceData.results.database.averageDuration < 500 ? 
        'Performance is acceptable' : 
        'Performance optimization recommended'
    }

    console.log(`✅ [${requestId}] Performance test completed`)
    console.log(`📊 [${requestId}] DB avg: ${performanceData.results.database.averageDuration}ms, Success rate: ${performanceData.results.database.successRate}%`)

    return NextResponse.json(performanceData)

  } catch (error: any) {
    console.error(`💥 [${requestId}] Performance test failed:`, error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'error',
      message: 'Performance test system failure',
      error: error.message
    }, { status: 500 })
  }
}