'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Wand2, 
  Eye, 
  Save,
  Download,
  Sparkles,
  MessageCircle,
  Layout,
  Palette,
  Code,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface V0Section {
  type: string
  id: string
  content: Record<string, any>
  styles?: Record<string, string>
}

interface V0LandingPage {
  sections: V0Section[]
  config: any
  explanation?: string
  changes?: string[]
}

export default function V0ChatPage() {
  const { user, loading } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentLP, setCurrentLP] = useState<V0LandingPage | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mode, setMode] = useState<'create' | 'modify'>('create')
  const [previewMode, setPreviewMode] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading && user) {
      // 初期化メッセージ
      setMessages([{
        role: 'assistant',
        content: 'こんにちは！V0風LP生成AIです。どのようなランディングページを作成しますか？\n\n例：\n• "SaaS製品の無料トライアル獲得LP"\n• "Eコマース商品販売ページ"\n• "コンサルティングサービス紹介LP"',
        timestamp: new Date().toISOString()
      }])
    }
  }, [user, loading])

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/v0-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          sessionId,
          currentLP,
          mode
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.explanation || 'LP生成が完了しました！',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      setCurrentLP(data.generatedLP)
      setSessionId(data.sessionId)
      
      // 初回生成後は修正モードに切り替え
      if (mode === 'create') {
        setMode('modify')
      }

      if (data.changes && data.changes.length > 0) {
        toast.success(`変更完了: ${data.changes.join(', ')}`)
      }

    } catch (error) {
      console.error('Generation error:', error)
      toast.error('生成に失敗しました')
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '申し訳ございません。生成に失敗しました。もう一度お試しください。',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSaveLP = async () => {
    if (!currentLP) return

    try {
      // LP保存API呼び出し（既存のlanding-pages APIを活用）
      const response = await fetch('/api/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `V0生成LP_${new Date().toLocaleDateString()}`,
          layout_config: currentLP,
          template_id: null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('LPが保存されました！')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast.error('保存に失敗しました')
    }
  }

  const renderPreview = () => {
    if (!currentLP) return null

    return (
      <div className="space-y-4">
        {currentLP.sections.map((section) => (
          <div 
            key={section.id} 
            className={`${section.styles?.background || 'bg-white'} ${section.styles?.text || 'text-gray-900'} ${section.styles?.layout || 'p-6'} rounded-lg border`}
          >
            {/* Hero Section */}
            {section.type === 'hero' && (
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">
                  {section.content.title}
                </h1>
                <p className="text-xl mb-6">
                  {section.content.subtitle}
                </p>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  {section.content.cta}
                </Button>
              </div>
            )}

            {/* Problem Section */}
            {section.type === 'problem' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 text-center">
                  {section.content.title}
                </h2>
                <div className="grid gap-4">
                  {section.content.items?.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feature Section */}
            {section.type === 'feature' && (
              <div>
                <h2 className="text-3xl font-bold mb-6 text-center">
                  {section.content.title}
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {section.content.features?.map((feature: any, idx: number) => (
                    <div key={idx} className="text-center p-4 bg-white rounded-lg shadow-sm">
                      <div className="text-2xl mb-3">{feature.icon}</div>
                      <h3 className="font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section */}
            {section.type === 'cta' && (
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">
                  {section.content.title}
                </h2>
                <p className="text-xl mb-6">
                  {section.content.subtitle}
                </p>
                <Button size="lg">
                  {section.content.cta}
                </Button>
              </div>
            )}

            {/* Generic Section */}
            {!['hero', 'problem', 'feature', 'cta'].includes(section.type) && (
              <div>
                <h2 className="text-2xl font-bold mb-4">{section.type}</h2>
                <pre className="text-sm bg-gray-100 p-4 rounded">
                  {JSON.stringify(section.content, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
          </CardHeader>
          <CardContent>
            <p>V0チャットLPエディターを使用するにはログインしてください。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold">V0 Chat LP Editor</h1>
              <p className="text-gray-600">AI駆動ランディングページ生成</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={mode === 'create' ? 'default' : 'secondary'}>
              {mode === 'create' ? '新規作成' : '修正中'}
            </Badge>
            {currentLP && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewMode(!previewMode)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {previewMode ? 'チャット' : 'プレビュー'}
                </Button>
                <Button onClick={handleSaveLP} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Chat Panel */}
        <div className={`${previewMode ? 'w-1/2' : 'w-full'} flex flex-col border-r bg-white`}>
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>AI生成中...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-6 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  mode === 'create' 
                    ? "どのようなLPを作成しますか？" 
                    : "どこを修正しますか？"
                }
                disabled={isGenerating}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isGenerating || !currentMessage.trim()}
                size="lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {mode === 'modify' && (
              <div className="flex gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMessage("色を変更して")}
                >
                  <Palette className="w-3 h-3 mr-1" />
                  色変更
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMessage("レイアウトを改善して")}
                >
                  <Layout className="w-3 h-3 mr-1" />
                  レイアウト
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMessage("セクションを追加して")}
                >
                  <Code className="w-3 h-3 mr-1" />
                  セクション追加
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {previewMode && currentLP && (
          <div className="w-1/2 bg-white">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                ライブプレビュー
              </h2>
            </div>
            <ScrollArea className="h-[calc(100vh-160px)] p-6">
              {renderPreview()}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}