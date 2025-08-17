'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TestResult {
  id: string
  name: string
  status: 'success' | 'error' | 'pending' | 'running'
  message: string
  timestamp: string
  duration?: number
  details?: any
}

interface SystemStatus {
  supabase: 'connected' | 'disconnected' | 'checking'
  concepts_table: 'exists' | 'missing' | 'checking'
  projects_table: 'exists' | 'missing' | 'checking'
  api_endpoints: { [key: string]: 'healthy' | 'error' | 'checking' }
}

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    supabase: 'checking',
    concepts_table: 'checking',
    projects_table: 'checking',
    api_endpoints: {}
  })
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [realTimeErrors, setRealTimeErrors] = useState<any[]>([])
  const [pasonaTestResults, setPasonaTestResults] = useState<TestResult[]>([])

  const updateTest = (id: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.id === id 
        ? { ...test, ...updates, timestamp: new Date().toISOString() }
        : test
    ))
  }

  const runSupabaseTest = async () => {
    updateTest('supabase', { status: 'running', message: 'Supabase接続中...' })
    
    try {
      const response = await fetch('/api/debug/supabase-test', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (response.ok) {
        updateTest('supabase', { 
          status: 'success', 
          message: 'Supabase接続成功',
          details: result
        })
      } else {
        updateTest('supabase', { 
          status: 'error', 
          message: `接続失敗: ${result.error}`,
          details: result
        })
      }
    } catch (error: any) {
      updateTest('supabase', { 
        status: 'error', 
        message: `エラー: ${error.message}`,
        details: error
      })
    }
  }

  const runConceptsApiTest = async () => {
    updateTest('concepts-api', { status: 'running', message: 'Concepts API呼び出し中...' })
    
    const dummyData = {
      siteName: 'DEBUG TEST SITE',
      brief: 'デバッグテスト用サイト',
      problem: 'テスト問題',
      affinity: 'テスト親近感',
      solution: 'テスト解決策',
      offer: 'テスト提案',
      narrowingDown: 'テスト絞り込み',
      action: 'テストアクション',
      primary: '#0EA5E9',
      accent: '#9333EA',
      background: '#0B1221',
      nav: 'Home,About,Contact',
      logoText: 'DEBUG',
      x: '',
      linkedin: '',
      github: '',
      email: 'debug@test.com',
      url: 'https://debug.test'
    }

    try {
      console.log('🔥 DEBUG: Sending test data to /api/concepts:', dummyData)
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dummyData)
      })
      
      console.log('🔥 DEBUG: Response status:', response.status)
      const result = await response.json()
      console.log('🔥 DEBUG: Response data:', result)
      
      if (response.ok) {
        updateTest('concepts-api', { 
          status: 'success', 
          message: 'Concepts API呼び出し成功',
          details: result
        })
      } else {
        updateTest('concepts-api', { 
          status: 'error', 
          message: `API失敗 (${response.status}): ${result.error}`,
          details: result
        })
      }
    } catch (error: any) {
      updateTest('concepts-api', { 
        status: 'error', 
        message: `エラー: ${error.message}`,
        details: error
      })
    }
  }

  const runDummyInsertTest = async () => {
    updateTest('dummy-insert', { status: 'running', message: 'ダミーデータInsert中...' })
    
    try {
      const response = await fetch('/api/debug/dummy-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'dummy-concept' })
      })
      const result = await response.json()
      
      if (response.ok) {
        updateTest('dummy-insert', { 
          status: 'success', 
          message: 'ダミーデータInsert成功',
          details: result
        })
      } else {
        updateTest('dummy-insert', { 
          status: 'error', 
          message: `Insert失敗: ${result.error}`,
          details: result
        })
      }
    } catch (error: any) {
      updateTest('dummy-insert', { 
        status: 'error', 
        message: `エラー: ${error.message}`,
        details: error
      })
    }
  }

  const runAuthTest = async () => {
    updateTest('auth-test', { status: 'running', message: '認証テスト中...' })
    
    if (!user) {
      updateTest('auth-test', { 
        status: 'error', 
        message: 'ユーザーが認証されていません'
      })
      return
    }

    updateTest('auth-test', { 
      status: 'success', 
      message: '認証済み',
      details: { userId: user.id, email: user.email }
    })
  }

  const runMarkdownTest = async () => {
    updateTest('markdown-test', { status: 'running', message: 'マークダウン生成テスト中...' })
    
    try {
      const response = await fetch('/api/debug/markdown-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          siteName: 'Test Site',
          brief: 'Test description'
        })
      })
      const result = await response.json()
      
      if (response.ok) {
        updateTest('markdown-test', { 
          status: 'success', 
          message: 'マークダウン生成成功',
          details: result
        })
      } else {
        updateTest('markdown-test', { 
          status: 'error', 
          message: `生成失敗: ${result.error}`,
          details: result
        })
      }
    } catch (error: any) {
      updateTest('markdown-test', { 
        status: 'error', 
        message: `エラー: ${error.message}`,
        details: error
      })
    }
  }

  const runAllTests = async () => {
    await runAuthTest()
    await runSupabaseTest()
    await runMarkdownTest()
    await runDummyInsertTest()
    await runConceptsApiTest()
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">待機中</Badge>
      case 'running':
        return <Badge className="bg-blue-500 text-white">実行中</Badge>
      case 'success':
        return <Badge className="bg-green-500 text-white">成功</Badge>
      case 'error':
        return <Badge variant="destructive">エラー</Badge>
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-600 mb-2">🚨 緊急デバッグツール</h1>
          <p className="text-gray-600">システムの各機能をテストして問題を特定します</p>
          {user && (
            <p className="text-sm text-green-600 mt-2">
              ログイン済み: {user.email}
            </p>
          )}
        </div>

        <div className="mb-6">
          <Button 
            onClick={runAllTests}
            className="bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            🚨 全テスト実行
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testResults.map((test) => (
            <Card key={test.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                  {getStatusBadge(test.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {test.message && (
                    <p className="text-sm text-gray-700">{test.message}</p>
                  )}
                  
                  {test.timestamp && (
                    <p className="text-xs text-gray-500">
                      実行時刻: {new Date(test.timestamp).toLocaleTimeString()}
                    </p>
                  )}

                  {test.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">詳細表示</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-2">
                    {test.id === 'supabase' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={runSupabaseTest}
                        disabled={test.status === 'running'}
                      >
                        テスト実行
                      </Button>
                    )}
                    {test.id === 'concepts-api' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={runConceptsApiTest}
                        disabled={test.status === 'running'}
                      >
                        テスト実行
                      </Button>
                    )}
                    {test.id === 'dummy-insert' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={runDummyInsertTest}
                        disabled={test.status === 'running'}
                      >
                        テスト実行
                      </Button>
                    )}
                    {test.id === 'auth-test' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={runAuthTest}
                        disabled={test.status === 'running'}
                      >
                        テスト実行
                      </Button>
                    )}
                    {test.id === 'markdown-test' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={runMarkdownTest}
                        disabled={test.status === 'running'}
                      >
                        テスト実行
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🔧 手動テストエリア</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <p className="text-sm">
                  上記のテストで問題が見つからない場合は、ブラウザの開発者ツールでコンソールログとネットワークタブを確認してください。
                </p>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/concept'}
                >
                  Conceptページへ
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Dashboardページへ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}