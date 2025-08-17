'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Monitor,
  Smartphone,
  Tablet,
  Settings
} from 'lucide-react'

interface PreviewProject {
  previewUrl: string
  port: number
  status: 'starting' | 'running' | 'stopped' | 'error'
  startTime?: Date
}

export default function ProjectPreviewPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [project, setProject] = useState<PreviewProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  useEffect(() => {
    if (user) {
      checkProjectStatus()
    }
  }, [user, params.id])

  const checkProjectStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${params.id}/preview`)
      
      if (!response.ok) {
        throw new Error('Failed to check project status')
      }

      const data = await response.json()
      setProject(data)
      setError(null)
    } catch (err) {
      console.error('Error checking project status:', err)
      setError('プロジェクトの状態確認に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const startProject = async () => {
    try {
      setIsStarting(true)
      setError(null)
      
      const response = await fetch(`/api/projects/${params.id}/preview`)
      
      if (!response.ok) {
        throw new Error('Failed to start project')
      }

      const data = await response.json()
      setProject(data)
      
      // プロジェクトが完全に起動するまで定期的にチェック
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/projects/${params.id}/preview`)
          const statusData = await statusResponse.json()
          
          if (statusData.status === 'running') {
            setProject(statusData)
            clearInterval(checkInterval)
          }
        } catch (err) {
          console.error('Error checking startup status:', err)
        }
      }, 2000)

      // 30秒後にチェックを停止
      setTimeout(() => clearInterval(checkInterval), 30000)
      
    } catch (err) {
      console.error('Error starting project:', err)
      setError('プロジェクトの開始に失敗しました')
    } finally {
      setIsStarting(false)
    }
  }

  const stopProject = async () => {
    try {
      setIsStopping(true)
      const response = await fetch(`/api/projects/${params.id}/preview`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to stop project')
      }

      setProject(null)
    } catch (err) {
      console.error('Error stopping project:', err)
      setError('プロジェクトの停止に失敗しました')
    } finally {
      setIsStopping(false)
    }
  }

  const getViewportDimensions = () => {
    switch (viewportMode) {
      case 'mobile':
        return { width: '375px', height: '667px' }
      case 'tablet':
        return { width: '768px', height: '1024px' }
      default:
        return { width: '100%', height: '100%' }
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">ログインが必要です</h2>
            <Button onClick={() => router.push('/login')}>
              ログインページへ
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">
                  プロジェクトプレビュー
                </h1>
                <Badge variant="outline">
                  {params.id}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* プロジェクト制御ボタン */}
              {project ? (
                <>
                  <Button
                    onClick={stopProject}
                    variant="outline"
                    size="sm"
                    disabled={isStopping}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    停止
                  </Button>
                  
                  <Button
                    onClick={checkProjectStatus}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    更新
                  </Button>
                  
                  <Button
                    onClick={() => window.open(project.previewUrl, '_blank')}
                    variant="outline"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    新しいタブで開く
                  </Button>
                </>
              ) : (
                <Button
                  onClick={startProject}
                  variant="default"
                  size="sm"
                  disabled={isStarting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isStarting ? '開始中...' : 'プロジェクト開始'}
                </Button>
              )}

              {/* ビューポート切り替え */}
              {project && (
                <div className="flex items-center gap-1 ml-4">
                  <Button
                    variant={viewportMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewportMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewportMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewportMode('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewportMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewportMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {project ? (
          <Card className="h-[calc(100vh-12rem)]">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">ライブプレビュー</h3>
                <Badge 
                  variant={project.status === 'running' ? 'default' : 'secondary'}
                  className={project.status === 'running' ? 'bg-green-600' : ''}
                >
                  {project.status === 'starting' && '開始中...'}
                  {project.status === 'running' && '実行中'}
                  {project.status === 'stopped' && '停止中'}
                  {project.status === 'error' && 'エラー'}
                </Badge>
                <span className="text-sm text-gray-500">
                  ポート: {project.port}
                </span>
              </div>
              
              <div className="text-sm text-gray-500">
                {viewportMode} ビュー
              </div>
            </div>
            
            <div className="flex-1 p-4 bg-gray-100">
              <div 
                className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
                style={getViewportDimensions()}
              >
                {project.status === 'running' ? (
                  <iframe
                    src={project.previewUrl}
                    className="w-full h-full border-none"
                    title="Project Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                      <div className="text-gray-600">
                        {project.status === 'starting' && 'Next.jsサーバーを起動中...'}
                        {project.status === 'stopped' && 'プロジェクトが停止されています'}
                        {project.status === 'error' && 'エラーが発生しました'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="h-[calc(100vh-12rem)]">
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  プロジェクトプレビューを開始
                </h3>
                <p className="text-gray-500 mb-6">
                  Next.jsプロジェクトを動的にビルドして表示します
                </p>
                <Button
                  onClick={startProject}
                  disabled={isStarting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isStarting ? '開始中...' : 'プレビュー開始'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  project?.status === 'running' ? 'bg-green-500' :
                  project?.status === 'starting' ? 'bg-yellow-500 animate-pulse' :
                  'bg-gray-400'
                }`} />
                <span>
                  {project?.status === 'running' && 'プロジェクト実行中'}
                  {project?.status === 'starting' && 'プロジェクト開始中'}
                  {!project && 'プロジェクト未開始'}
                </span>
              </div>
              
              {project && (
                <>
                  <span>|</span>
                  <span>localhost:{project.port}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span>Next.js Live Preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}