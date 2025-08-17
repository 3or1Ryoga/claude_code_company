'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Send,
  User,
  Bot,
  Sparkles,
  Wand2,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal
} from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isGenerating?: boolean
  type?: 'text' | 'lp_generation' | 'element_update'
  metadata?: {
    elementId?: string
    action?: string
    generated?: boolean
  }
}

interface V0ChatInterfaceProps {
  onLPGenerate: (prompt: string, conversationHistory?: ChatMessage[], isNewSession?: boolean) => Promise<any>
  onElementUpdate: (elementId: string, updates: any) => Promise<void>
  isGenerating?: boolean
  className?: string
}

const EXAMPLE_PROMPTS = [
  "AIプロダクトのランディングページを作って",
  "コンサルティング会社向けのプロフェッショナルなLP",
  "EC サイトのコンバージョン重視デザイン",
  "SaaS ツールの無料トライアル誘導LP",
  "ヘルスケアアプリの信頼性重視LP"
]

const QUICK_ACTIONS = [
  { label: "ヒーローセクション追加", prompt: "魅力的なヒーローセクションを追加して" },
  { label: "料金プラン表示", prompt: "3段階の料金プランセクションを作成して" },
  { label: "お客様の声", prompt: "顧客レビューと評価のセクションを追加" },
  { label: "FAQ追加", prompt: "よくある質問セクションを追加して" },
  { label: "CTA強化", prompt: "コンバージョンを高めるCTAボタンに変更" }
]

export default function V0ChatInterface({
  onLPGenerate,
  onElementUpdate,
  isGenerating = false,
  className = ''
}: V0ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `こんにちは！👋 V0風AIランディングページエディターです。

自然言語でLPを作成・編集できます。どのようなランディングページを作りたいですか？

例：
• "フィットネスアプリのLP作って"
• "B2B SaaSの信頼性重視デザイン"
• "ヒーローセクションをもっと魅力的に"`,
      timestamp: new Date()
    }
  ])
  
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 会話セッション管理
  const [conversationState, setConversationState] = useState<{
    isInActiveSession: boolean
    sessionMessages: ChatMessage[]
    waitingForUserInfo: boolean
  }>({
    isInActiveSession: false,
    sessionMessages: [],
    waitingForUserInfo: false
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    // 会話セッション管理: 新しいメッセージをセッションに追加
    const updatedSessionMessages = [...conversationState.sessionMessages, userMessage]

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // AI応答の生成
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isGenerating: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // セッション開始または継続判定
      const isNewSession = !conversationState.isInActiveSession
      
      // LP生成処理（会話履歴も含めて送信）- 安全なエラーハンドリング付き
      const aiResponse = await onLPGenerate(userMessage.content, updatedSessionMessages, isNewSession)
      
      console.log('🔍 Chat Interface: AI Response received:', aiResponse)
      console.log('🔍 Chat Interface: Response type:', aiResponse?.type)
      console.log('🔍 Chat Interface: Response details:', JSON.stringify(aiResponse, null, 2))

      // AI応答の種類に応じてメッセージを更新
      let responseContent = ''
      
      // エラーレスポンスの処理
      if (aiResponse && aiResponse.type === 'error') {
        responseContent = aiResponse.message || '申し訳ございません。技術的な問題が発生しました。'
        
        // セッション状態をリセット（エラー時）
        setConversationState({
          isInActiveSession: false,
          sessionMessages: [],
          waitingForUserInfo: false
        })
      } else if (aiResponse && aiResponse.type === 'question') {
        // AIが質問を返した場合：セッション継続
        responseContent = [
          "🤔 " + (aiResponse.explanation || "ご指示を正確に反映するために、追加でお聞かせください："),
          "",
          ...aiResponse.questions.map((q: string, index: number) => `${index + 1}. ${q}`),
          "",
          "💬 これらの点について教えていただけますか？"
        ].join('\n')

        // セッション状態を更新
        setConversationState({
          isInActiveSession: true,
          sessionMessages: [...updatedSessionMessages, { ...assistantMessage, content: responseContent, isGenerating: false }],
          waitingForUserInfo: true
        })
      } else {
        // 変更が実行された場合：セッション終了
        responseContent = [
          `✨ "${userMessage.content}" に基づいてランディングページを生成しました！`,
          "🎨 デザインは右側のプレビューで確認できます。",
          "📝 さらに調整したい箇所があれば、お気軽にお申し付けください。",
          "",
          "💡 **次にできること：**",
          "• セクションの追加・削除",
          "• デザインの調整", 
          "• コンテンツの変更",
          "• カラースキームの変更"
        ].join('\n')

        // セッション状態をリセット
        setConversationState({
          isInActiveSession: false,
          sessionMessages: [],
          waitingForUserInfo: false
        })
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: responseContent, isGenerating: false }
          : msg
      ))

    } catch (error) {
      console.error('🚨 Chat Interface: Error in handleSend:', error)
      
      // エラーメッセージを安全に取得
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: `🤔 AI解析エラーのため、既存のLPコンテンツを保護しました。\n\n1. 申し訳ございません、技術的な問題が発生しました。\n2. LPへの変更は行われませんでした。\n3. もう一度、具体的にどの部分を変更したいかお聞かせください。\n\n💬 エラー詳細: ${errorMessage}`, 
              isGenerating: false 
            }
          : msg
      ))
      
      // セッション状態をリセット（エラー時）
      setConversationState({
        isInActiveSession: false,
        sessionMessages: [],
        waitingForUserInfo: false
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickAction = async (prompt: string) => {
    setInput(prompt)
    // 自動送信
    setTimeout(() => handleSend(), 100)
  }

  const handleExamplePrompt = (prompt: string) => {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">V0 AI Assistant</h3>
            <p className="text-sm text-gray-600">自然言語でLPを作成・編集</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-500' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Content */}
              <div className={`rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap text-sm">
                  {message.isGenerating ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      生成中...
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                
                {/* Message Actions */}
                {message.role === 'assistant' && !message.isGenerating && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="p-4 border-t border-b bg-gray-50">
          <p className="text-sm font-medium mb-3">✨ 例文から始める</p>
          <div className="space-y-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleExamplePrompt(prompt)}
                className="w-full text-left p-2 text-sm bg-white border rounded hover:bg-gray-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      {messages.length > 2 && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm font-medium mb-3">⚡ クイックアクション</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.slice(0, 4).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.prompt)}
                className="text-xs"
                disabled={isGenerating}
              >
                <Wand2 className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ランディングページについて何でもお聞きください..."
              className="resize-none min-h-[44px] max-h-32 pr-12"
              disabled={isGenerating}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length}/500
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="h-11 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Enter で送信、Shift+Enter で改行</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>AI準備完了</span>
          </div>
        </div>
      </div>
    </div>
  )
}