'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Code,
  RefreshCw,
  Download,
  Share,
  Settings,
  Maximize,
  Minimize,
  ExternalLink,
  Zap,
  Palette,
  Layout
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

interface V0PreviewPanelProps {
  elements: LPElement[]
  isGenerating?: boolean
  className?: string
  onExport?: () => void
  onShare?: () => void
  onElementSelect?: (elementId: string) => void
  selectedElementId?: string
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

const viewportSizes = {
  desktop: { width: '100%', height: '100%', label: 'デスクトップ', icon: Monitor },
  tablet: { width: '768px', height: '1024px', label: 'タブレット', icon: Tablet },
  mobile: { width: '375px', height: '812px', label: 'モバイル', icon: Smartphone }
}

const GENERATION_STEPS = [
  { id: 1, label: 'コンセプト分析', status: 'completed' },
  { id: 2, label: 'レイアウト設計', status: 'in_progress' },
  { id: 3, label: 'コンテンツ生成', status: 'pending' },
  { id: 4, label: 'スタイル適用', status: 'pending' },
  { id: 5, label: '最適化', status: 'pending' }
]

export default function V0PreviewPanel({
  elements,
  isGenerating = false,
  className = '',
  onExport,
  onShare,
  onElementSelect,
  selectedElementId
}: V0PreviewPanelProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [generationStep, setGenerationStep] = useState(1)
  const previewRef = useRef<HTMLDivElement>(null)

  // Generation animation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setGenerationStep(prev => prev < 5 ? prev + 1 : prev)
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setGenerationStep(5)
    }
  }, [isGenerating])

  const renderElement = (element: LPElement) => {
    const isSelected = selectedElementId === element.id
    const elementStyle = {
      ...element.styles,
      cursor: 'pointer',
      position: 'relative' as const,
      border: isSelected ? '2px solid #3b82f6' : element.styles.border || 'none',
      boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
    }

    const handleElementClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      onElementSelect?.(element.id)
    }

    switch (element.type) {
      case 'hero':
      case 'section':
        return (
          <div 
            key={element.id}
            style={elementStyle} 
            onClick={handleElementClick}
            className="group transition-all duration-200"
          >
            <h1 style={{ 
              margin: 0, 
              fontSize: element.styles.fontSize, 
              color: element.styles.textColor 
            }}>
              {element.content}
            </h1>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                {element.type}
              </div>
            )}
          </div>
        )
      
      case 'text':
        return (
          <div 
            key={element.id}
            style={elementStyle} 
            onClick={handleElementClick}
            className="group transition-all duration-200"
          >
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {element.content}
            </p>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                text
              </div>
            )}
          </div>
        )
      
      case 'image':
        return (
          <div 
            key={element.id}
            style={elementStyle} 
            onClick={handleElementClick}
            className="group transition-all duration-200 overflow-hidden"
          >
            <img
              src={element.content}
              alt={element.settings.alt || ''}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: element.styles.borderRadius
              }}
            />
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                image
              </div>
            )}
          </div>
        )
      
      case 'button':
        return (
          <div 
            key={element.id}
            style={{ 
              display: 'flex', 
              justifyContent: element.styles.textAlign === 'center' ? 'center' : 
                             element.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
              margin: element.styles.margin 
            }}
            onClick={handleElementClick}
            className="group transition-all duration-200"
          >
            <button
              style={{
                ...elementStyle,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.opacity = '0.9'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(0)'
                }
              }}
            >
              {element.content}
              {isSelected && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                  button
                </div>
              )}
            </button>
          </div>
        )
      
      case 'card':
        return (
          <div 
            key={element.id}
            style={{
              ...elementStyle,
              boxShadow: isSelected ? '0 4px 16px rgba(59, 130, 246, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onClick={handleElementClick}
            className="group transition-all duration-200"
          >
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {element.content}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                card
              </div>
            )}
          </div>
        )
      
      default:
        return (
          <div key={element.id} style={elementStyle} onClick={handleElementClick}>
            {element.content}
          </div>
        )
    }
  }

  const renderPreview = () => {
    const currentViewport = viewportSizes[viewport]
    
    return (
      <div 
        className="preview-container transition-all duration-300 mx-auto border rounded-lg overflow-hidden bg-white relative"
        style={{ 
          width: currentViewport.width,
          height: viewport === 'desktop' ? 'auto' : currentViewport.height,
          maxWidth: '100%',
          minHeight: viewport === 'desktop' ? '600px' : currentViewport.height
        }}
        onClick={() => onElementSelect?.('')}
      >
        {/* Generation Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">✨ AI生成中...</h3>
              <p className="text-gray-600 text-sm mb-6">
                あなたの要求に基づいて最適なLPを作成しています
              </p>
              
              {/* Generation Steps */}
              <div className="space-y-2 text-left max-w-xs">
                {GENERATION_STEPS.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      generationStep > step.id ? 'bg-green-500 text-white' :
                      generationStep === step.id ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {generationStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={`text-sm ${
                      generationStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="preview-content h-full overflow-auto">
          {elements.map(renderElement)}
          
          {elements.length === 0 && !isGenerating && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">プレビューエリア</p>
                <p className="text-sm">左側のチャットでLPを作成してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">リアルタイムプレビュー</span>
            </div>
            {elements.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {elements.length} 要素
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Viewport Controls */}
            <div className="flex items-center border rounded-md">
              {Object.entries(viewportSizes).map(([key, config]) => {
                const IconComponent = config.icon
                return (
                  <button
                    key={key}
                    onClick={() => setViewport(key as ViewportSize)}
                    className={`p-2 ${viewport === key ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                    title={config.label}
                  >
                    <IconComponent className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
            
            <Button
              onClick={() => setShowCode(!showCode)}
              variant="outline"
              size="sm"
            >
              <Code className="w-4 h-4" />
            </Button>
            
            {onExport && (
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            
            {onShare && (
              <Button
                onClick={onShare}
                variant="outline"
                size="sm"
              >
                <Share className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Viewport Info */}
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
          <span>表示サイズ:</span>
          <Badge variant="secondary">
            {viewportSizes[viewport].label}
          </Badge>
          {viewport !== 'desktop' && (
            <span className="text-xs">
              {viewportSizes[viewport].width} × {viewportSizes[viewport].height}
            </span>
          )}
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 p-6 overflow-auto bg-gray-50">
        {showCode ? (
          <Tabs defaultValue="preview" className="w-full h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">プレビュー</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="h-full">
              {renderPreview()}
            </TabsContent>
            
            <TabsContent value="html" className="h-full">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm h-full">
                <code>{`<!-- Generated HTML will appear here -->`}</code>
              </pre>
            </TabsContent>
            
            <TabsContent value="css" className="h-full">
              <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto text-sm h-full">
                <code>{`/* Generated CSS will appear here */`}</code>
              </pre>
            </TabsContent>
          </Tabs>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  )
}