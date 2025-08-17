'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Minimize
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

interface RealTimePreviewProps {
  elements: LPElement[]
  className?: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
  onExport?: () => void
  onShare?: () => void
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

const viewportSizes = {
  desktop: { width: '100%', height: '100%', label: 'デスクトップ' },
  tablet: { width: '768px', height: '1024px', label: 'タブレット' },
  mobile: { width: '375px', height: '812px', label: 'モバイル' }
}

export default function RealTimePreview({ 
  elements, 
  className = '',
  isFullscreen = false,
  onToggleFullscreen,
  onExport,
  onShare
}: RealTimePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [showCode, setShowCode] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const previewRef = useRef<HTMLDivElement>(null)
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [generatedCSS, setGeneratedCSS] = useState('')

  // リアルタイムでHTMLとCSSを生成
  useEffect(() => {
    const generateHTML = () => {
      let html = '<!DOCTYPE html>\n<html lang="ja">\n<head>\n'
      html += '  <meta charset="UTF-8">\n'
      html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
      html += '  <title>Generated Landing Page</title>\n'
      html += '  <style>\n'
      html += generateCSS()
      html += '  </style>\n'
      html += '</head>\n<body>\n'
      
      elements.forEach((element) => {
        html += generateElementHTML(element)
      })
      
      html += '</body>\n</html>'
      
      setGeneratedHTML(html)
      setLastUpdate(Date.now())
    }

    const generateCSS = () => {
      let css = `
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
        
        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
        }
      `
      
      elements.forEach((element) => {
        css += generateElementCSS(element)
      })
      
      setGeneratedCSS(css)
      return css
    }

    const generateElementHTML = (element: LPElement) => {
      const classNames = `element-${element.id} element-${element.type}`
      
      switch (element.type) {
        case 'hero':
        case 'section':
          return `  <section class="${classNames}">\n    <div class="container">\n      <h1>${element.content}</h1>\n    </div>\n  </section>\n`
        
        case 'text':
          return `  <div class="${classNames}">\n    <div class="container">\n      <p>${element.content.replace(/\n/g, '<br>')}</p>\n    </div>\n  </div>\n`
        
        case 'image':
          return `  <div class="${classNames}">\n    <div class="container">\n      <img src="${element.content}" alt="${element.settings.alt || ''}" />\n    </div>\n  </div>\n`
        
        case 'button':
          const href = element.settings.link || '#'
          return `  <div class="${classNames}">\n    <div class="container">\n      <a href="${href}" class="btn">${element.content}</a>\n    </div>\n  </div>\n`
        
        case 'card':
          return `  <div class="${classNames}">\n    <div class="container">\n      <div class="card">${element.content.replace(/\n/g, '<br>')}</div>\n    </div>\n  </div>\n`
        
        default:
          return `  <div class="${classNames}">\n    <div class="container">\n      ${element.content}\n    </div>\n  </div>\n`
      }
    }

    const generateElementCSS = (element: LPElement) => {
      const selector = `.element-${element.id}`
      let css = `\n${selector} {\n`
      
      Object.entries(element.styles).forEach(([key, value]) => {
        if (value) {
          const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          css += `  ${cssProperty}: ${value};\n`
        }
      })
      
      if (element.type === 'button') {
        css += `}\n\n${selector} .btn {\n`
        css += `  display: inline-block;\n`
        css += `  text-decoration: none;\n`
        css += `  transition: all 0.3s ease;\n`
        css += `  border: none;\n`
        css += `  cursor: pointer;\n`
        css += `}\n\n${selector} .btn:hover {\n`
        css += `  opacity: 0.9;\n`
        css += `  transform: translateY(-1px);\n`
      } else if (element.type === 'card') {
        css += `}\n\n${selector} .card {\n`
        css += `  box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n`
        css += `  transition: all 0.3s ease;\n`
        css += `}\n\n${selector} .card:hover {\n`
        css += `  box-shadow: 0 4px 16px rgba(0,0,0,0.15);\n`
      } else if (element.type === 'image') {
        css += `}\n\n${selector} img {\n`
        css += `  max-width: 100%;\n`
        css += `  height: auto;\n`
        css += `  display: block;\n`
      }
      
      css += '}\n'
      return css
    }

    generateHTML()
  }, [elements])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastUpdate(Date.now())
    }, 500)
  }, [])

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport()
    } else {
      // デフォルトのエクスポート処理
      const blob = new Blob([generatedHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'landing-page.html'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [generatedHTML, onExport])

  const handleShare = useCallback(() => {
    if (onShare) {
      onShare()
    } else {
      // デフォルトの共有処理
      if (navigator.share) {
        navigator.share({
          title: 'Generated Landing Page',
          text: 'Check out this landing page I created!',
          url: window.location.href
        })
      } else {
        // フォールバック: URLをクリップボードにコピー
        navigator.clipboard.writeText(window.location.href)
        alert('URLがクリップボードにコピーされました')
      }
    }
  }, [onShare])

  const renderPreview = () => {
    const currentViewport = viewportSizes[viewport]
    
    return (
      <div 
        className="preview-container transition-all duration-300 mx-auto border rounded-lg overflow-hidden bg-white"
        style={{ 
          width: currentViewport.width,
          height: viewport === 'desktop' ? 'auto' : currentViewport.height,
          maxWidth: '100%',
          minHeight: viewport === 'desktop' ? '600px' : currentViewport.height
        }}
      >
        <div className="preview-content h-full overflow-auto">
          {elements.map((element) => (
            <div
              key={element.id}
              className="preview-element"
              style={{
                ...element.styles,
                position: 'relative'
              }}
            >
              {renderElement(element)}
            </div>
          ))}
          
          {elements.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">プレビューエリア</p>
                <p className="text-sm">要素を追加するとここにプレビューが表示されます</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderElement = (element: LPElement) => {
    const commonStyle = {
      display: 'block',
      width: '100%'
    }

    switch (element.type) {
      case 'hero':
      case 'section':
        return (
          <h1 style={{ ...commonStyle, margin: 0, fontSize: element.styles.fontSize, color: element.styles.textColor }}>
            {element.content}
          </h1>
        )
      
      case 'text':
        return (
          <p style={{ ...commonStyle, margin: 0, whiteSpace: 'pre-wrap' }}>
            {element.content}
          </p>
        )
      
      case 'image':
        return (
          <img
            src={element.content}
            alt={element.settings.alt || ''}
            style={{
              ...commonStyle,
              height: element.styles.height || 'auto',
              objectFit: 'cover',
              borderRadius: element.styles.borderRadius
            }}
          />
        )
      
      case 'button':
        return (
          <div style={{ 
            display: 'flex', 
            justifyContent: element.styles.textAlign === 'center' ? 'center' : 
                           element.styles.textAlign === 'right' ? 'flex-end' : 'flex-start'
          }}>
            <button
              style={{
                backgroundColor: element.styles.backgroundColor,
                color: element.styles.textColor,
                fontSize: element.styles.fontSize,
                padding: element.styles.padding,
                borderRadius: element.styles.borderRadius,
                border: element.styles.border || 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {element.content}
            </button>
          </div>
        )
      
      case 'card':
        return (
          <div 
            style={{
              ...commonStyle,
              backgroundColor: element.styles.backgroundColor,
              padding: element.styles.padding,
              borderRadius: element.styles.borderRadius,
              border: element.styles.border,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              whiteSpace: 'pre-wrap'
            }}
          >
            {element.content}
          </div>
        )
      
      default:
        return <div style={commonStyle}>{element.content}</div>
    }
  }

  return (
    <div className={className}>
      <Card className={isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5" />
                リアルタイムプレビュー
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                最終更新: {new Date(lastUpdate).toLocaleTimeString()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Viewport Size Controls */}
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-2 ${viewport === 'desktop' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                  title="デスクトップビュー"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-2 ${viewport === 'tablet' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                  title="タブレットビュー"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-2 ${viewport === 'mobile' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                  title="モバイルビュー"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                onClick={() => setShowCode(!showCode)}
                variant="outline"
                size="sm"
              >
                <Code className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
              >
                <Share className="w-4 h-4" />
              </Button>
              
              {onToggleFullscreen && (
                <Button
                  onClick={onToggleFullscreen}
                  variant="outline"
                  size="sm"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>
          
          {/* Viewport Size Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
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
        </CardHeader>
        
        <CardContent className="p-0">
          {showCode ? (
            <Tabs defaultValue="html" className="w-full">
              <div className="px-6 py-3 border-b">
                <TabsList>
                  <TabsTrigger value="html">HTML</TabsTrigger>
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="preview">プレビュー</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="html" className="m-0">
                <div className="p-6">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
                    <code>{generatedHTML}</code>
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="css" className="m-0">
                <div className="p-6">
                  <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-auto text-sm">
                    <code>{generatedCSS}</code>
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="m-0">
                <div className="p-6">
                  {renderPreview()}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-6">
              {renderPreview()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}