'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import ProjectDashboard from '@/components/project-dashboard'
import CodePreview from '@/components/code-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function DashboardPage() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [selectedProjectForCode, setSelectedProjectForCode] = useState<any>(null)
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true)
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      } else {
        console.error('Failed to fetch projects:', await response.text())
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleNewProject = () => {
    router.push('/chat-create')
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/edit/${projectId}`)
  }

  const handlePreviewProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project && project.preview_url) {
      window.open(project.preview_url, '_blank')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      try {
        const response = await fetch(`/api/projects?id=${projectId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          await fetchProjects() // Refresh projects list
        } else {
          console.error('Failed to delete project:', await response.text())
        }
      } catch (error) {
        console.error('Error deleting project:', error)
      }
    }
  }

  const handleViewCode = (project: any) => {
    setSelectedProjectForCode(project)
    setIsCodeDialogOpen(true)
  }

  const handleUpdateProject = async (projectId: string, projectData: { name: string, code: string }) => {
    try {
      const response = await fetch(`/api/projects?id=${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectData.name,
          code: projectData.code,
        }),
      })

      if (response.ok) {
        await fetchProjects() // Refresh projects list
        alert('プロジェクトを更新しました')
      } else {
        console.error('Failed to update project:', await response.text())
        alert('プロジェクトの更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('プロジェクトの更新に失敗しました')
    }
  }

  if (loading || projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Transform projects data to match ProjectDashboard interface
  const transformedProjects = projects.map(project => ({
    id: project.id,
    name: project.project_name,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    status: project.status || 'completed',
    pasonaData: {
      problem: project.pasona_problem || '',
      affinity: project.pasona_affinity || '',
      solution: project.pasona_solution || '',
      offer: project.pasona_offer || '',
      narrowingDown: project.pasona_narrowing_down || '',
      action: project.pasona_action || ''
    },
    previewUrl: project.preview_url,
    code: project.generated_code || project.code || '',
    concept: project.concept || ''
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI LP Generator</h1>
            <div className="flex items-center space-x-4">
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
          <ProjectDashboard
            projects={transformedProjects}
            onNewProject={handleNewProject}
            onEditProject={handleEditProject}
            onPreviewProject={handlePreviewProject}
            onDeleteProject={handleDeleteProject}
            onViewCode={handleViewCode}
            onUpdateProject={handleUpdateProject}
          />
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