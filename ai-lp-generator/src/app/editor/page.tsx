'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import DragDropEditor from '@/components/drag-drop-editor'
import RealTimePreview from '@/components/real-time-preview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  Eye, 
  EyeOff, 
  Settings, 
  Maximize, 
  Minimize,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

interface LPElement {
  id: string
  type: 'hero' | 'text' | 'image' | 'button' | 'section' | 'card'
  content: string
  styles: {
    backgroundColor?: string
    textColor?: string
    fontSize?: string
    padding?: string
    margin?: string
    textAlign?: 'left' | 'center' | 'right'
    borderRadius?: string
    border?: string
    width?: string
    height?: string
  }
  settings: {
    link?: string
    alt?: string
    placeholder?: string
  }
}

const initialElements: LPElement[] = [
  {
    id: 'hero-1',
    type: 'hero',
    content: 'AI-Powered ランディングページエディタ',
    styles: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      fontSize: '48px',
      padding: '80px 20px',
      textAlign: 'center',
      borderRadius: '0px'
    },
    settings: {}
  },
  {
    id: 'text-1',
    type: 'text',
    content: 'ドラッグ&ドロップで簡単にプロフェッショナルなランディングページを作成できます。リアルタイムプレビューでデザインを確認しながら、効果的なLPを構築しましょう。',
    styles: {
      fontSize: '18px',
      padding: '40px 20px',
      textAlign: 'center',
      textColor: '#6b7280'
    },
    settings: {}
  },
  {
    id: 'button-1',
    type: 'button',
    content: '無料で始める',
    styles: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      fontSize: '20px',
      padding: '16px 40px',
      borderRadius: '8px',
      textAlign: 'center',
      margin: '40px auto'
    },
    settings: {
      link: '#'
    }
  }
]

export default function EditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [elements, setElements] = useState<LPElement[]>(initialElements)
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [projectName, setProjectName] = useState('My Landing Page')
  const [isResponsiveMode, setIsResponsiveMode] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (elements.length > 0) {
        handleAutoSave()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [elements])

  const handleAutoSave = useCallback(async () => {
    try {
      // Here you would implement the actual save logic
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [])

  const handleSave = useCallback(async (elementsToSave: LPElement[]) => {
    setIsSaving(true)
    try {
      // Implement actual save logic here
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastSaved(new Date())
      console.log('Project saved:', { projectName, elements: elementsToSave })
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [projectName])

  const handlePreview = useCallback((previewElements: LPElement[]) => {
    // Real-time preview updates
    // This is called whenever elements change in the editor
  }, [])

  const handleExport = useCallback(() => {
    // Generate and download HTML file
    const html = generateFullHTML(elements)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [elements, projectName])

  const generateFullHTML = (elementsToExport: LPElement[]) => {
    let html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    .responsive-container {
      width: 100%;
      margin: 0 auto;
    }
    
    @media (max-width: 1200px) {
      .container {
        max-width: 100%;
        padding: 0 24px;
      }
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 0 16px;
      }
      
      .mobile-text-center {
        text-align: center !important;
      }
      
      .mobile-full-width {
        width: 100% !important;
      }
      
      .mobile-stack {
        display: block !important;
      }
    }
    
    @media (max-width: 480px) {
      .mobile-small-text {
        font-size: 0.9em !important;
      }
      
      .mobile-small-padding {
        padding: 16px !important;
      }
    }
  </style>
</head>
<body>
`

    elementsToExport.forEach((element) => {
      html += generateElementHTML(element)
    })

    html += `
</body>
</html>`

    return html
  }

  const generateElementHTML = (element: LPElement) => {
    const mobileClasses = isResponsiveMode ? 'mobile-text-center mobile-full-width' : ''
    
    const style = Object.entries(element.styles)
      .filter(([_, value]) => value)
      .map(([key, value]) => {
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${cssProperty}: ${value}`
      })
      .join('; ')

    switch (element.type) {
      case 'hero':
      case 'section':
        return `
  <section style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      <h1>${element.content}</h1>
    </div>
  </section>
`
      
      case 'text':
        return `
  <div style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      <p>${element.content.replace(/\n/g, '<br>')}</p>
    </div>
  </div>
`
      
      case 'image':
        return `
  <div style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      <img src="${element.content}" alt="${element.settings.alt || ''}" style="max-width: 100%; height: auto;" />
    </div>
  </div>
`
      
      case 'button':
        const href = element.settings.link || '#'
        return `
  <div style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      <a href="${href}" style="display: inline-block; text-decoration: none; transition: all 0.3s ease; border: none; cursor: pointer;">${element.content}</a>
    </div>
  </div>
`
      
      case 'card':
        return `
  <div style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      <div style="box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.3s ease;">${element.content.replace(/\n/g, '<br>')}</div>
    </div>
  </div>
`
      
      default:
        return `
  <div style="${style}" class="responsive-container ${mobileClasses}">
    <div class="container">
      ${element.content}
    </div>
  </div>
`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'editor':
        return (
          <div className="h-full">
            <DragDropEditor
              initialElements={elements}
              onPreview={setElements}
              onSave={handleSave}
              className="h-full"
            />
          </div>
        )
      
      case 'preview':
        return (
          <div className="h-full">
            <RealTimePreview
              elements={elements}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              onExport={handleExport}
              className="h-full"
            />
          </div>
        )
      
      default: // split
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
            <div className="h-full">
              <DragDropEditor
                initialElements={elements}
                onPreview={setElements}
                onSave={handleSave}
                className="h-full"
              />
            </div>
            <div className="h-full">
              <RealTimePreview
                elements={elements}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onExport={handleExport}
                className="h-full"
              />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
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
              
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
              />
              
              {lastSaved && (
                <Badge variant="outline" className="text-xs">
                  保存済み: {lastSaved.toLocaleTimeString()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggles */}
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setViewMode('editor')}
                  className={`px-3 py-1 text-sm ${viewMode === 'editor' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                >
                  エディタ
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 text-sm ${viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                >
                  分割
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 text-sm ${viewMode === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                >
                  プレビュー
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResponsiveMode(!isResponsiveMode)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {isResponsiveMode ? 'レスポンシブ: ON' : 'レスポンシブ: OFF'}
              </Button>

              <Button
                onClick={() => handleSave(elements)}
                disabled={isSaving}
                size="sm"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? '保存中...' : '保存'}
              </Button>

              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                エクスポート
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-8rem)]">
          {renderContent()}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>{elements.length} 要素</span>
              <span>|</span>
              <span>表示モード: {viewMode === 'split' ? '分割' : viewMode === 'editor' ? 'エディタ' : 'プレビュー'}</span>
              {isResponsiveMode && (
                <>
                  <span>|</span>
                  <span>レスポンシブ対応</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {lastSaved ? (
                <span>最終保存: {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span>未保存</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}