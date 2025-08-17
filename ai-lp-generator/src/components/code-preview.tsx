'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'
import { Highlight, themes } from 'prism-react-renderer'
import { 
  CodeIcon, 
  EyeIcon, 
  CopyIcon, 
  SaveIcon, 
  EditIcon,
  ExternalLinkIcon 
} from 'lucide-react'

interface CodePreviewProps {
  code: string
  projectName?: string
  onSave?: (projectData: { name: string, code: string }) => void
  onUpdate?: (projectData: { name: string, code: string }) => void
  isEditing?: boolean
  className?: string
}

export default function CodePreview({
  code,
  projectName = 'Untitled Project',
  onSave,
  onUpdate,
  isEditing = false,
  className = ''
}: CodePreviewProps) {
  const [currentProjectName, setCurrentProjectName] = useState(projectName)
  const [currentCode, setCurrentCode] = useState(code)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSave = async () => {
    if (!onSave && !onUpdate) return
    
    setIsSaving(true)
    try {
      const projectData = {
        name: currentProjectName,
        code: currentCode
      }
      
      if (isEditing && onUpdate) {
        await onUpdate(projectData)
      } else if (onSave) {
        await onSave(projectData)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const handleExport = () => {
    const blob = new Blob([currentCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentProjectName.toLowerCase().replace(/\s+/g, '-')}.tsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={currentProjectName}
                  onChange={(e) => setCurrentProjectName(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-primary outline-none"
                />
              ) : (
                <CardTitle className="text-2xl">{currentProjectName}</CardTitle>
              )}
              <CardDescription className="mt-2">
                生成されたTSXコードのプレビューと管理
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                <CodeIcon className="w-3 h-3 mr-1" />
                TSX
              </Badge>
              {code && (
                <Badge variant="outline">
                  {code.split('\n').length} 行
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm">
              <CopyIcon className="w-4 h-4 mr-1" />
              {copied ? 'コピー済み' : 'コード'}
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <ExternalLinkIcon className="w-4 h-4 mr-1" />
              エクスポート
            </Button>
            {(onSave || onUpdate) && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                size="sm"
              >
                <SaveIcon className="w-4 h-4 mr-1" />
                {isSaving ? '保存中...' : isEditing ? '更新' : '保存'}
              </Button>
            )}
            {isEditing && (
              <Button variant="outline" size="sm">
                <EditIcon className="w-4 h-4 mr-1" />
                編集モード
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Tabs */}
      <Card>
        <Tabs defaultValue="preview" className="w-full">
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">
                <EyeIcon className="w-4 h-4 mr-1" />
                プレビュー
              </TabsTrigger>
              <TabsTrigger value="code">
                <CodeIcon className="w-4 h-4 mr-1" />
                コードエディタ
              </TabsTrigger>
              <TabsTrigger value="syntax">
                <CodeIcon className="w-4 h-4 mr-1" />
                構文ハイライト
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                {currentCode ? (
                  <LiveProvider 
                    code={currentCode}
                    scope={{ Button, Card, CardContent, CardHeader, CardTitle }}
                  >
                    <LivePreview />
                    <LiveError className="text-red-500 text-sm bg-red-50 p-2 rounded mt-4" />
                  </LiveProvider>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    プレビューするコードがありません
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="space-y-4">
              <LiveProvider 
                code={currentCode}
              >
                <div className="border rounded-lg overflow-hidden">
                  <LiveEditor 
                    onChange={setCurrentCode}
                    className="text-sm font-mono"
                    style={{ minHeight: '400px' }}
                  />
                </div>
                <LiveError className="text-red-500 text-sm bg-red-50 p-2 rounded" />
              </LiveProvider>
            </TabsContent>
            
            <TabsContent value="syntax" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Highlight
                  theme={themes.github}
                  code={currentCode}
                  language="tsx"
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre 
                      className={`${className} p-4 text-sm overflow-auto`} 
                      style={{ ...style, minHeight: '400px' }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          <span className="mr-4 text-gray-500 select-none">
                            {i + 1}
                          </span>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}