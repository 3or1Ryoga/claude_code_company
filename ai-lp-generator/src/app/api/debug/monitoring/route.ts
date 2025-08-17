import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// In-memory storage for demo purposes (in production, use Redis or database)
let monitoringData = {
  apiCalls: {
    total: 0,
    success: 0,
    errors: 0,
    lastHour: [] as any[]
  },
  errors: [] as any[],
  performance: {
    averageResponseTime: 0,
    slowQueries: [] as any[]
  },
  systemHealth: {
    lastCheck: null as string | null,
    status: 'unknown'
  }
}

export async function GET(request: NextRequest) {
  const requestId = `monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    // Get real-time system metrics
    const supabase = await createServerSupabaseClient()
    
    // Check current system status
    const healthCheck = {
      timestamp: new Date().toISOString(),
      database: 'checking',
      concepts_table: 'checking',
      api_health: 'checking'
    }

    try {
      const { data, error } = await supabase.from('concepts').select('count(*)', { count: 'exact', head: true })
      
      if (error) {
        if (error.code === '42P01') {
          healthCheck.database = 'connected'
          healthCheck.concepts_table = 'missing'
        } else {
          healthCheck.database = 'error'
          healthCheck.concepts_table = 'error'
        }
      } else {
        healthCheck.database = 'healthy'
        healthCheck.concepts_table = 'healthy'
      }
    } catch {
      healthCheck.database = 'error'
      healthCheck.concepts_table = 'error'
    }

    healthCheck.api_health = 'healthy' // Assume healthy if we can respond

    // Update monitoring data
    monitoringData.systemHealth = {
      lastCheck: healthCheck.timestamp,
      status: healthCheck.database === 'healthy' ? 'healthy' : 'degraded'
    }

    // Generate some sample metrics for demonstration
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Simulate API call tracking
    if (monitoringData.apiCalls.lastHour.length === 0) {
      // Initialize with some sample data
      for (let i = 0; i < 60; i++) {
        const timestamp = oneHourAgo + (i * 60 * 1000)
        monitoringData.apiCalls.lastHour.push({
          timestamp,
          calls: Math.floor(Math.random() * 10) + 1,
          errors: Math.floor(Math.random() * 2)
        })
      }
    }

    // Clean old data (keep only last hour)
    monitoringData.apiCalls.lastHour = monitoringData.apiCalls.lastHour.filter(
      entry => entry.timestamp > oneHourAgo
    )

    const response = {
      timestamp: new Date().toISOString(),
      requestId,
      systemHealth: healthCheck,
      metrics: {
        apiCalls: {
          totalToday: monitoringData.apiCalls.total,
          successRate: monitoringData.apiCalls.total > 0 
            ? ((monitoringData.apiCalls.success / monitoringData.apiCalls.total) * 100).toFixed(2)
            : 100,
          lastHour: monitoringData.apiCalls.lastHour.slice(-12), // Last 12 data points (12 minutes)
          errorsLastHour: monitoringData.apiCalls.lastHour.reduce((sum, entry) => sum + entry.errors, 0)
        },
        performance: {
          averageResponseTime: monitoringData.performance.averageResponseTime || 150,
          slowQueriesCount: monitoringData.performance.slowQueries.length,
          recommendation: monitoringData.performance.averageResponseTime < 200 
            ? 'Excellent performance' 
            : 'Consider optimization'
        },
        database: {
          connectionStatus: healthCheck.database,
          conceptsTableStatus: healthCheck.concepts_table,
          lastSuccessfulQuery: new Date().toISOString()
        }
      },
      alerts: [
        ...(healthCheck.concepts_table === 'missing' 
          ? [{
              type: 'critical',
              message: 'Concepts table is missing - execute create-concepts-table.sql',
              timestamp: new Date().toISOString()
            }] 
          : []
        ),
        ...(healthCheck.database === 'error' 
          ? [{
              type: 'critical',
              message: 'Database connection error detected',
              timestamp: new Date().toISOString()
            }] 
          : []
        )
      ]
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error(`💥 [${requestId}] Monitoring data fetch failed:`, error)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      requestId,
      status: 'error',
      message: 'Monitoring system failure',
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const requestId = `monitor_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await request.json()
    const { type, data } = body

    console.log(`📊 [${requestId}] Monitoring update: ${type}`)

    switch (type) {
      case 'api_call':
        monitoringData.apiCalls.total += 1
        if (data.success) {
          monitoringData.apiCalls.success += 1
        } else {
          monitoringData.apiCalls.errors += 1
        }
        
        // Add to hourly tracking
        const now = Date.now()
        const currentMinute = Math.floor(now / (60 * 1000)) * 60 * 1000
        
        let currentEntry = monitoringData.apiCalls.lastHour.find(
          entry => entry.timestamp === currentMinute
        )
        
        if (!currentEntry) {
          currentEntry = { timestamp: currentMinute, calls: 0, errors: 0 }
          monitoringData.apiCalls.lastHour.push(currentEntry)
        }
        
        currentEntry.calls += 1
        if (!data.success) {
          currentEntry.errors += 1
        }
        break

      case 'performance':
        if (data.responseTime) {
          const current = monitoringData.performance.averageResponseTime || 0
          monitoringData.performance.averageResponseTime = 
            (current + data.responseTime) / 2 // Simple moving average
        }
        
        if (data.responseTime > 1000) {
          monitoringData.performance.slowQueries.push({
            timestamp: new Date().toISOString(),
            responseTime: data.responseTime,
            endpoint: data.endpoint || 'unknown'
          })
          
          // Keep only last 10 slow queries
          monitoringData.performance.slowQueries = 
            monitoringData.performance.slowQueries.slice(-10)
        }
        break

      case 'error':
        monitoringData.errors.push({
          timestamp: new Date().toISOString(),
          message: data.message,
          endpoint: data.endpoint,
          stack: data.stack
        })
        
        // Keep only last 50 errors
        monitoringData.errors = monitoringData.errors.slice(-50)
        break
    }

    return NextResponse.json({
      success: true,
      message: 'Monitoring data updated',
      requestId
    })

  } catch (error: any) {
    console.error(`💥 [${requestId}] Monitoring update failed:`, error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      requestId
    }, { status: 500 })
  }
}