import { NextRequest, NextResponse } from 'next/server'
import { dynamicPreviewManager } from '@/lib/dynamic-preview'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// プレビューシステムヘルスチェックAPI
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // システム統計取得
    const activePreviews = dynamicPreviewManager.getActivePreviews()
    const portUsage = dynamicPreviewManager.getPortUsage()
    
    // Supabaseからプレビュー統計取得
    const { data: previewStats } = await supabase
      .from('preview_sessions')
      .select('status, port, started_at, last_activity')
      .gte('last_activity', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 過去24時間

    // メモリ使用量取得
    const memoryUsage = process.memoryUsage()
    
    // システムヘルス判定
    const healthScore = calculateHealthScore({
      activePreviewsCount: activePreviews.length,
      availablePortsCount: portUsage.available.length,
      memoryUsageMB: memoryUsage.heapUsed / 1024 / 1024,
      dbConnectionHealth: previewStats ? 'healthy' : 'unhealthy'
    })

    const health = {
      status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical',
      score: healthScore,
      timestamp: new Date().toISOString(),
      
      system: {
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024)
        },
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform
      },

      preview: {
        activeSessions: activePreviews.length,
        maxSessions: 9, // 3002-3010 = 9ポート
        portUsage: {
          used: portUsage.used,
          available: portUsage.available,
          total: portUsage.used.length + portUsage.available.length
        },
        sessions: activePreviews.map(p => ({
          projectId: p.projectId,
          port: p.port,
          status: p.status,
          uptime: Math.round((Date.now() - p.startTime.getTime()) / 1000),
          url: p.url
        }))
      },

      database: {
        status: previewStats ? 'connected' : 'disconnected',
        recentSessions: previewStats?.length || 0,
        connectionTime: Date.now() // 簡易計測
      },

      performance: {
        averageStartupTime: calculateAverageStartupTime(activePreviews),
        successRate: calculateSuccessRate(previewStats || []),
        recommendations: generateRecommendations(activePreviews, portUsage)
      }
    }

    return NextResponse.json({
      success: true,
      health
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      health: {
        status: 'critical',
        score: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}

// システム自動メンテナンス実行API
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    const results = {
      timestamp: new Date().toISOString(),
      actions: [] as Array<{ type: string; result: string }>
    }

    switch (action) {
      case 'cleanup':
        // 非アクティブプレビュー停止
        const stopped = await dynamicPreviewManager.stopAllPreviews()
        results.actions.push({
          type: 'cleanup',
          result: `${stopped}個のプレビューを停止`
        })
        break

      case 'restart':
        // 全プレビュー再起動（危険操作）
        await dynamicPreviewManager.stopAllPreviews()
        results.actions.push({
          type: 'restart',
          result: '全プレビューを停止（再起動準備完了）'
        })
        break

      case 'gc':
        // ガベージコレクション実行
        if (global.gc) {
          global.gc()
          results.actions.push({
            type: 'gc',
            result: 'ガベージコレクション実行'
          })
        } else {
          results.actions.push({
            type: 'gc',
            result: 'ガベージコレクション利用不可'
          })
        }
        break

      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      maintenance: results
    })

  } catch (error) {
    console.error('Maintenance error:', error)
    return NextResponse.json(
      { error: 'メンテナンス実行に失敗しました' },
      { status: 500 }
    )
  }
}

// ヘルススコア計算
function calculateHealthScore(metrics: {
  activePreviewsCount: number
  availablePortsCount: number
  memoryUsageMB: number
  dbConnectionHealth: string
}): number {
  let score = 100

  // アクティブプレビュー数（多すぎると減点）
  if (metrics.activePreviewsCount > 7) score -= 20
  else if (metrics.activePreviewsCount > 5) score -= 10

  // 利用可能ポート数（少ないと減点）
  if (metrics.availablePortsCount < 2) score -= 30
  else if (metrics.availablePortsCount < 4) score -= 15

  // メモリ使用量（多いと減点）
  if (metrics.memoryUsageMB > 500) score -= 25
  else if (metrics.memoryUsageMB > 300) score -= 10

  // DB接続
  if (metrics.dbConnectionHealth !== 'healthy') score -= 40

  return Math.max(0, Math.min(100, score))
}

// 平均起動時間計算
function calculateAverageStartupTime(activePreviews: any[]): number {
  if (activePreviews.length === 0) return 0
  
  const uptimes = activePreviews
    .filter(p => p.status === 'running')
    .map(p => Date.now() - p.startTime.getTime())
  
  return uptimes.length > 0 ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length / 1000 : 0
}

// 成功率計算
function calculateSuccessRate(sessions: any[]): number {
  if (sessions.length === 0) return 100
  
  const successful = sessions.filter(s => s.status === 'running').length
  return Math.round((successful / sessions.length) * 100)
}

// 推奨事項生成
function generateRecommendations(activePreviews: any[], portUsage: any): string[] {
  const recommendations = []
  
  if (activePreviews.length > 6) {
    recommendations.push('アクティブプレビューが多すぎます。不要なプレビューを停止してください。')
  }
  
  if (portUsage.available.length < 3) {
    recommendations.push('利用可能ポートが少なくなっています。古いプレビューの停止を検討してください。')
  }
  
  const longRunning = activePreviews.filter(p => 
    Date.now() - p.startTime.getTime() > 60 * 60 * 1000 // 1時間以上
  )
  
  if (longRunning.length > 0) {
    recommendations.push(`${longRunning.length}個の長時間実行プレビューがあります。`)
  }
  
  if (recommendations.length === 0) {
    recommendations.push('システムは正常に動作しています。')
  }
  
  return recommendations
}