'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  PlusIcon, 
  EyeIcon, 
  EditIcon, 
  TrashIcon, 
  CalendarIcon,
  FolderIcon,
  CodeIcon,
  SaveIcon,
  DownloadIcon,
  ArchiveIcon,
  LinkIcon,
  FileIcon,
  ShieldCheckIcon,
  TagIcon
} from 'lucide-react'

interface Project {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  status: 'draft' | 'completed' | 'published'
  pasonaData: {
    problem: string
    affinity: string
    solution: string
    offer: string
    narrowingDown: string
    action: string
  }
  previewUrl?: string
  thumbnailUrl?: string
  code?: string
  concept?: string
  archivePath?: string
  conceptId?: string
  archiveSize?: number
  checksum?: string
  version?: number
}

interface ProjectDashboardProps {
  projects: Project[]
  onNewProject: () => void
  onEditProject: (projectId: string) => void
  onPreviewProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
  onViewCode?: (project: Project) => void
  onUpdateProject?: (projectId: string, projectData: { name: string, code: string }) => void
  onDownload?: (projectId: string) => void
}

const statusConfig = {
  draft: { label: '下書き', color: 'bg-gray-500' },
  completed: { label: '完成', color: 'bg-green-500' },
  published: { label: '公開中', color: 'bg-blue-500' }
}

export default function ProjectDashboard({
  projects,
  onNewProject,
  onEditProject,
  onPreviewProject,
  onDeleteProject,
  onViewCode,
  onUpdateProject,
  onDownload
}: ProjectDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">プロジェクト管理</h1>
          <p className="text-muted-foreground mt-2">
            作成したLPプロジェクトを管理・編集できます
          </p>
        </div>
        <Button onClick={onNewProject} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          新しいプロジェクト
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">総プロジェクト</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
              <FolderIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">下書き</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">完成</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">公開中</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.status === 'published').length}
                </p>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">アーカイブ</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => p.archivePath).length}
                </p>
              </div>
              <ArchiveIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FolderIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">プロジェクトがありません</h3>
            <p className="text-muted-foreground mb-6">
              最初のLPプロジェクトを作成しましょう
            </p>
            <Button onClick={onNewProject}>
              <PlusIcon className="w-4 h-4 mr-2" />
              新しいプロジェクトを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className={`hover:shadow-md transition-all duration-200 ${
                selectedProject === project.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedProject(project.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate flex-1 mr-2">
                    {project.name}
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    className={`${statusConfig[project.status].color} text-white`}
                  >
                    {statusConfig[project.status].label}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                    {project.version && (
                      <div className="flex items-center">
                        <TagIcon className="w-4 h-4 mr-1" />
                        <span className="text-xs">v{project.version}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* メタデータ表示 */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {project.conceptId && (
                      <div className="flex items-center">
                        <LinkIcon className="w-3 h-3 mr-1" />
                        <span>Concept: {project.conceptId.slice(0, 8)}...</span>
                      </div>
                    )}
                    {project.archivePath && project.archiveSize && (
                      <div className="flex items-center">
                        <FileIcon className="w-3 h-3 mr-1" />
                        <span className="text-green-600">{formatFileSize(project.archiveSize)}</span>
                      </div>
                    )}
                  </div>

                  {project.checksum && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      <span className="font-mono">{project.checksum.slice(0, 12)}...</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* サムネイル表示エリア */}
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg mb-4 flex items-center justify-center">
                  {project.thumbnailUrl ? (
                    <img 
                      src={project.thumbnailUrl} 
                      alt={`${project.name} thumbnail`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <FolderIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">プレビューなし</p>
                    </div>
                  )}
                </div>

                {/* プロジェクト概要 */}
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Problem:</p>
                    <p className="text-sm">
                      {truncateText(project.pasonaData.problem, 80)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Offer:</p>
                    <p className="text-sm">
                      {truncateText(project.pasonaData.offer, 60)}
                    </p>
                  </div>
                </div>

                {/* アクションボタン - レスポンシブ対応 */}
                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onPreviewProject(project.id)
                    }}
                    aria-label={`${project.name}をプレビューする`}
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">プレビュー</span>
                    <span className="sm:hidden">表示</span>
                  </Button>
                    {project.archivePath && onDownload && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDownload(project.id)
                        }}
                        className="text-green-600 hover:text-green-700"
                        aria-label={`${project.name}をダウンロードする${project.archiveSize ? ` (${formatFileSize(project.archiveSize)})` : ''}`}
                      >
                        <DownloadIcon className="w-4 h-4 mr-1" />
                        <div className="flex flex-col items-start">
                          <span className="hidden sm:inline">ダウンロード</span>
                          <span className="sm:hidden">DL</span>
                          {project.archiveSize && (
                            <span className="text-xs opacity-75">
                              {formatFileSize(project.archiveSize)}
                            </span>
                          )}
                        </div>
                      </Button>
                    )}
                    {onViewCode && project.code && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewCode(project)
                        }}
                        aria-label={`${project.name}のコードを表示する`}
                      >
                        <CodeIcon className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">コード</span>
                        <span className="sm:hidden">Code</span>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditProject(project.id)
                      }}
                      aria-label={`${project.name}を編集する`}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteProject(project.id)
                      }}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`${project.name}を削除する`}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      削除
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}