'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import CodePreview from '@/components/code-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [concepts, setConcepts] = useState<any[]>([])
  const [storageProjects, setStorageProjects] = useState<any[]>([])
  const [conceptsLoading, setConceptsLoading] = useState(true)
  const [storageLoading, setStorageLoading] = useState(true)
  const [selectedProjectForCode, setSelectedProjectForCode] = useState<any>(null)
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'projects' | 'concepts' | 'all'>('all')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchConcepts()
      fetchStorageProjects()
    }
  }, [user])


  const fetchConcepts = async () => {
    try {
      setConceptsLoading(true)
      const response = await fetch('/api/concepts')
      if (response.ok) {
        const data = await response.json()
        setConcepts(data.concepts || [])
      } else {
        console.error('Failed to fetch concepts:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching concepts:', error)
    } finally {
      setConceptsLoading(false)
    }
  }

  const fetchStorageProjects = async () => {
    try {
      setStorageLoading(true)
      const response = await fetch('/api/storage/projects')
      if (response.ok) {
        const data = await response.json()
        setStorageProjects(data.projects || [])
      } else {
        console.error('Failed to fetch storage projects:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching storage projects:', error)
    } finally {
      setStorageLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleNewProject = () => {
    router.push('/concept')
  }


  // Storage project handlers
  const handleStorageDownload = async (projectPath: string, projectName: string) => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const encodedPath = encodeURIComponent(projectPath)
      const response = await fetch(`/api/storage/download/${encodedPath}`)
      
      if (!response.ok) {
        throw new Error('ダウンロードURLの取得に失敗しました')
      }

      const result = await response.json()
      
      // 署名URLでファイルをダウンロード
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = `${projectName}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error: any) {
      setDownloadError(error.message || 'ダウンロード中にエラーが発生しました')
      alert(`ダウンロードエラー: ${error.message}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleStoragePreview = async (projectId: string) => {
    try {
      const response = await fetch(`/api/storage/preview/${projectId}`)
      
      if (!response.ok) {
        throw new Error('プレビューの生成に失敗しました')
      }

      const result = await response.json()
      
      if (result.preview && result.preview.hasPreview) {
        // プレビューページにリダイレクト
        router.push(`/preview/${projectId}`)
      } else {
        alert('このプロジェクトにはプレビューできるコンテンツがありません')
      }
    } catch (error: any) {
      alert(`プレビューエラー: ${error.message}`)
    }
  }


  if (loading || conceptsLoading || storageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI LP Generator</h1>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleNewProject}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                新規作成
              </Button>
              <Button
                onClick={() => router.push('/v0-editor')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                V0 AI Editor
              </Button>
              <span className="text-sm text-gray-600">
                ようこそ、{user.email} さん
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* View Mode Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setViewMode('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  すべて ({concepts.length + storageProjects.length})
                </button>
                <button
                  onClick={() => setViewMode('projects')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'projects'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  プロジェクト ({storageProjects.length})
                </button>
                <button
                  onClick={() => setViewMode('concepts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    viewMode === 'concepts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  コンセプト ({concepts.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Concepts Display */}
          {(viewMode === 'concepts' || viewMode === 'all') && concepts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">コンセプト</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {concepts.map((concept) => (
                  <Card key={concept.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{concept.site_name || concept.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        作成日: {new Date(concept.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 mb-4">
                        {concept.brief || '概要なし'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/concept?id=${concept.id}`)}
                        >
                          編集
                        </Button>
                        {concept.archive_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(concept.archive_url, '_blank')}
                          >
                            ダウンロード
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Projects Display */}
          {(viewMode === 'projects' || viewMode === 'all') && storageProjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">プロジェクト</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {storageProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg truncate" title={project.name}>
                        {project.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>ファイルサイズ:</span>
                          <span>{Math.round(project.size / 1024)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>作成日時:</span>
                          <span>{new Date(project.createdAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ダウンロード回数:</span>
                          <span>{project.downloadCount || 0}回</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStoragePreview(project.id)}
                          className="flex-1"
                        >
                          プレビュー
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/v0-editor?archive=${project.id}`)}
                          className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStorageDownload(project.fullPath, project.name)}
                          disabled={isDownloading}
                          className="flex-1"
                        >
                          {isDownloading ? 'DL中...' : 'ダウンロード'}
                        </Button>
                      </div>
                      {downloadError && (
                        <p className="text-xs text-red-600 mt-2">{downloadError}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Code Preview Dialog */}
      <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProjectForCode?.name} - コードプレビュー
            </DialogTitle>
          </DialogHeader>
          {selectedProjectForCode && (
            <CodePreview
              code={selectedProjectForCode.code || ''}
              projectName={selectedProjectForCode.name}
              onUpdate={(projectData) => handleUpdateProject(selectedProjectForCode.id, projectData)}
              isEditing={true}
              className="mt-4"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}