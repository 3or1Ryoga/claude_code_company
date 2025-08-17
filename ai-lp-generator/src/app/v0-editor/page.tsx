'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import V0ChatInterface from '@/components/v0-chat-interface'
import V0PreviewPanel from '@/components/v0-preview-panel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Save,
  Share,
  Download,
  Settings,
  Zap,
  Sparkles
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

export default function V0EditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [elements, setElements] = useState<LPElement[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [projectName, setProjectName] = useState('V0 AI LP Project')
  const [archiveProject, setArchiveProject] = useState<any>(null)
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(1)
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('')
  const [isStartingLivePreview, setIsStartingLivePreview] = useState(false)
  const [isUpdatingProject, setIsUpdatingProject] = useState(false)
  const [latestPageContent, setLatestPageContent] = useState<string>('')

  // アーカイブプロジェクト読み込み
  useEffect(() => {
    const archiveId = searchParams.get('archive')
    if (archiveId && user) {
      loadArchiveProject(archiveId)
    }
  }, [searchParams, user])

  // アーカイブプロジェクト読み込み処理
  const loadArchiveProject = async (projectId: string) => {
    setIsLoadingArchive(true)
    console.log(`🔍 Archive Loading: Starting load for projectId="${projectId}"`)
    
    try {
      const apiUrl = `/api/storage/preview/${projectId}`
      console.log(`🔗 API URL: ${apiUrl}`)
      
      const response = await fetch(apiUrl)
      console.log(`📡 Response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Archive loading failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        })
        throw new Error(`Failed to load archive project: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📦 Archive API result:', {
        hasPreview: !!result.preview,
        hasPageContent: !!result.preview?.pageContent,
        projectInfoKeys: result.preview?.projectInfo ? Object.keys(result.preview.projectInfo) : [],
        pageContentLength: result.preview?.pageContent?.length || 0
      })
      
      if (result.preview && result.preview.hasPreview) {
        console.log('✅ Archive project loaded successfully')
        setArchiveProject(result.preview)
        setProjectName(result.preview.projectInfo.siteName || result.preview.projectInfo.projectName)
        
        // LP要素の抽出（編集のため）
        if (result.preview.pageContent) {
          const extractedElements = extractElementsFromPageContent(result.preview.pageContent)
          setElements(extractedElements)
          // 初期のpage.tsxコンテンツを保存
          setLatestPageContent(result.preview.pageContent)
        }
        
        // Next.jsライブプレビューを開始（オプション）
        try {
          await startLivePreview(projectId)
        } catch (previewError) {
          console.warn('⚠️ Live preview failed, but archive editing will continue:', previewError)
          // ライブプレビューの失敗はアーカイブ編集をブロックしない
        }
      } else {
        console.warn('⚠️ Archive result does not have valid preview data')
        throw new Error('No valid preview data found in archive')
      }
    } catch (error) {
      console.error('❌ Error loading archive project:', error)
      
      // ユーザーフレンドリーなエラーメッセージ
      let errorMessage = 'アーカイブプロジェクトの読み込みに失敗しました'
      if (error.message.includes('404')) {
        errorMessage = 'プロジェクトが見つかりません。削除されている可能性があります。'
      } else if (error.message.includes('500')) {
        errorMessage = 'サーバーエラーが発生しました。少し時間をおいてからお試しください。'
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'このプロジェクトにアクセスする権限がありません。'
      }
      
      alert(errorMessage)
    } finally {
      setIsLoadingArchive(false)
    }
  }

  // Next.jsライブプレビューを開始
  const startLivePreview = async (projectId: string) => {
    setIsStartingLivePreview(true)
    try {
      console.log(`🚀 Starting live preview for project: ${projectId}`)
      const response = await fetch(`/api/projects/${projectId}/preview`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Live preview failed:`, {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500)
        })
        throw new Error(`Failed to start live preview: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setLivePreviewUrl(data.previewUrl)
      
      // プロジェクトが完全に起動するまで定期的にチェック
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/projects/${projectId}/preview`)
          const statusData = await statusResponse.json()
          
          if (statusData.status === 'running') {
            setLivePreviewUrl(statusData.previewUrl)
            clearInterval(checkInterval)
            setIsStartingLivePreview(false)
          }
        } catch (err) {
          console.error('Error checking startup status:', err)
        }
      }, 2000)

      // 30秒後にチェックを停止
      setTimeout(() => {
        clearInterval(checkInterval)
        setIsStartingLivePreview(false)
      }, 30000)
      
    } catch (error) {
      console.error('Error starting live preview:', error)
      
      // ライブプレビューが失敗してもアーカイブ編集は継続可能
      console.warn('⚠️ Live preview unavailable, but archive editing will continue')
      setIsStartingLivePreview(false)
    }
  }

  // ライブプロジェクトのファイルを更新
  const updateLiveProject = async (newElements: LPElement[], updatedReactCode?: string) => {
    if (!archiveProject) return

    try {
      setIsUpdatingProject(true)
      
      const archiveId = searchParams.get('archive')
      if (!archiveId) {
        console.error('❌ No archive ID found in URL params')
        return
      }

      console.log('🔍 Updating project with ID:', archiveId)
      console.log('🔍 Archive project info:', archiveProject)

      // 🚨 重要な修正: AIが編集したコードがある場合は必ずそれを優先使用
      // AIコードがない場合のみ、元のzip内容を保持して要素ベース更新を行う
      let updatedPageContent: string
      
      if (updatedReactCode) {
        // AIから完全な編集済みコードが返された場合：そのまま使用
        updatedPageContent = updatedReactCode
        console.log('📝 Using AI-provided React code (preserves original structure)')
      } else {
        // AIコードがない場合：元のzipコンテンツを保持（アーカイブプロジェクト必須）
        if (!archiveProject?.pageContent) {
          console.error('❌ No archive content available to update')
          throw new Error('アーカイブコンテンツが存在しません')
        }
        updatedPageContent = archiveProject.pageContent
        console.log('📝 Using original zip content to preserve structure')
      }
      
      console.log('📝 Page content length:', updatedPageContent.length)
      
      const apiUrl = `/api/projects/${archiveId}/update`
      console.log('🔗 API URL:', apiUrl)
      
      // プロジェクトファイルを更新
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageContent: updatedPageContent,
          projectInfo: {
            ...archiveProject.projectInfo,
            siteName: projectName,
            updatedAt: new Date().toISOString()
          }
        })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', response.headers)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          archiveId,
          apiUrl
        })
        throw new Error(`Failed to update project files: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ Project files updated successfully:', result)
      
      // Next.jsのホットリロードで自動更新されるまで少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('❌ Error updating live project:', error)
    } finally {
      setIsUpdatingProject(false)
    }
  }

  // page.tsxの内容からLP要素を抽出する簡易関数
  const extractElementsFromPageContent = (pageContent: string): LPElement[] => {
    const elements: LPElement[] = []
    let idCounter = Date.now()

    // 簡易的なパターンマッチングでReactコンポーネントから要素を抽出
    // ヒーローセクション
    if (pageContent.includes('hero') || pageContent.includes('Hero')) {
      elements.push({
        id: `hero-${idCounter++}`,
        type: 'hero',
        content: extractTextBetweenTags(pageContent, 'h1') || 'ヒーローセクション',
        styles: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          fontSize: '48px',
          padding: '80px 20px',
          textAlign: 'center'
        },
        settings: {}
      })
    }

    // テキストコンテンツ
    const paragraphs = pageContent.match(/<p[^>]*>(.*?)<\/p>/gs)
    if (paragraphs) {
      paragraphs.slice(0, 2).forEach((paragraph) => {
        const content = paragraph.replace(/<[^>]*>/g, '').trim()
        if (content && content.length > 10) {
          elements.push({
            id: `text-${idCounter++}`,
            type: 'text',
            content,
            styles: {
              fontSize: '18px',
              padding: '40px 20px',
              textAlign: 'center',
              textColor: '#6b7280'
            },
            settings: {}
          })
        }
      })
    }

    // ボタン要素
    const buttons = pageContent.match(/<button[^>]*>(.*?)<\/button>/gs) || 
                   pageContent.match(/<Link[^>]*>(.*?)<\/Link>/gs)
    if (buttons) {
      buttons.slice(0, 1).forEach((button) => {
        const content = button.replace(/<[^>]*>/g, '').trim()
        if (content) {
          elements.push({
            id: `button-${idCounter++}`,
            type: 'button',
            content,
            styles: {
              backgroundColor: '#ef4444',
              textColor: '#ffffff',
              fontSize: '20px',
              padding: '16px 40px',
              borderRadius: '8px',
              textAlign: 'center',
              margin: '40px auto'
            },
            settings: { link: '#contact' }
          })
        }
      })
    }

    return elements
  }

  // HTMLタグ間のテキストを抽出するヘルパー関数
  const extractTextBetweenTags = (content: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'i')
    const match = content.match(regex)
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : null
  }

  // チャット駆動LP生成ロジック（Gemini API使用）
  const handleLPGenerate = useCallback(async (prompt: string, conversationHistory?: any[], isNewSession?: boolean): Promise<any> => {
    setIsGenerating(true)
    
    let controller: AbortController | null = null
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      // より安全なPromise実装でタイムアウト付きでGemini APIを使用
      const fetchPromise = new Promise<Response>((resolve, reject) => {
        // Promiseを同期的に開始
        controller = new AbortController()
        
        // タイムアウト設定
        timeoutId = setTimeout(() => {
          console.warn('⏰ AI API timeout after 60 seconds')
          if (controller) {
            controller.abort()
          }
          reject(new Error('Request timeout after 60 seconds'))
        }, 60000) // 60秒に戻して安定化を図る
        
        // fetchを非同期で実行
        fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: prompt,
            currentElements: elements,
            conversationHistory: conversationHistory || [],
            isNewSession: isNewSession !== false,  // デフォルトはtrue
            // アーカイブプロジェクトの場合は実際のpage.tsxコードも送信
            existingPageContent: archiveProject?.pageContent || null,
            projectInfo: archiveProject?.projectInfo || null
          }),
          signal: controller.signal
        })
        .then(response => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          resolve(response)
        })
        .catch(fetchError => {
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
          reject(fetchError)
        })
      })
      
      const response = await fetchPromise

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }))
        console.error('AI chat error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: AI chat request failed`)
      }

      const data = await response.json()
      
      // AI応答の種類に基づいて処理を分岐
      let newElements = [...elements]
      
      if (data.type === 'question') {
        // AIが質問を返した場合：チャットコンポーネントに応答を返す
        console.log('AI returned questions:', data.questions)
        console.log('🔍 v0-editor: Returning question response:', JSON.stringify(data, null, 2))
        // 現在の要素はそのまま維持（質問に答えるまで変更しない）
        return data
      } else if (data.type === 'suggestion') {
        // AIが新しい形式で変更案を提案した場合
        let updatedReactCode = null
        
        // AIから完全なReactコードが返された場合
        if (data.updatedPageContent) {
          console.log('🎯 AI provided complete updated page content')
          
          // 🚨 安全性チェック: 元のzipコンテンツが大幅に変更されていないか確認
          if (archiveProject?.pageContent) {
            const originalLength = archiveProject.pageContent.length
            const newLength = data.updatedPageContent.length
            const lengthDifference = Math.abs(newLength - originalLength)
            const percentageChange = (lengthDifference / originalLength) * 100
            
            console.log(`📊 コンテンツ変更率: ${percentageChange.toFixed(1)}%`)
            
            // 変更が50%を超える場合は警告（ただし、ユーザーが明示的に大きな変更を求めた場合は除く）
            if (percentageChange > 50) {
              console.warn('⚠️ 大幅なコンテンツ変更が検出されました')
            }
          }
          
          updatedReactCode = data.updatedPageContent
          
          // 新しいpage.tsxコードから要素を再抽出
          const newExtractedElements = extractElementsFromPageContent(data.updatedPageContent)
          newElements = newExtractedElements
        }
        
        // リアルタイムでプレビューに反映
        setElements(newElements)
        
        // アーカイブプロジェクトの場合は実際のNext.jsファイルを更新
        if (archiveProject) {
          await updateLiveProject(newElements, updatedReactCode)
          // 最新のpage.tsxコンテンツを保存
          if (updatedReactCode) {
            setLatestPageContent(updatedReactCode)
          }
        }
      } else {
        // フォールバック：アーカイブプロジェクトが必須
        if (!archiveProject) {
          console.error('❌ No archive project loaded - cannot generate content')
          return { 
            type: 'error', 
            message: 'アーカイブプロジェクトが読み込まれていません',
            success: false
          }
        }
        // 元のコンテンツを維持
        console.log('⚠️ AI response type not recognized, maintaining original content')
        return { 
          type: 'error', 
          message: 'AI応答を認識できませんでした。もう一度お試しください。',
          success: false
        }
      }
      
      // 生成完了まで待機
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 通常の生成成功時の応答を返す
      console.log('🔍 v0-editor: Returning success response')
      return { type: 'suggestion', success: true }
      
    } catch (error) {
      console.error('LP generation failed:', error)
      
      // エラーメッセージを安全に取得
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // 通信切断エラー（message port closed、AbortError）の特別処理
      if (error instanceof Error && (
        error.name === 'AbortError' || 
        error.message.includes('message port closed') ||
        error.message.includes('signal is aborted') ||
        error.message.includes('aborted without reason')
      )) {
        console.warn('🔌 Communication was interrupted or timed out - protecting existing content')
        
        // タイムアウトかその他の通信エラーかを判定
        const isTimeout = error.name === 'AbortError' && error.message.includes('aborted')
        const messageType = isTimeout ? 'タイムアウト' : '通信中断'
        
        return { 
          type: 'error', 
          message: `🤔 AI解析${messageType}のため、既存のLPコンテンツを保護しました。\n\n1. AI処理が${isTimeout ? '時間切れになりました' : '中断されました'}が、技術的な問題です。\n2. LPへの変更は行われませんでした。\n3. もう少し簡潔な指示で、もう一度お試しください。\n\n💬 ${isTimeout ? 'より具体的で短い指示' : '再度'}をお聞かせください。`,
          error: errorMessage,
          success: false,
          isContentProtected: true,
          isConnectionError: true,
          isTimeout: isTimeout
        }
      }
      
      // 🚨 重要: アーカイブプロジェクトのコンテンツを保護
      if (!archiveProject) {
        return { 
          type: 'error', 
          message: '🤔 AI解析エラーのため、既存のLPコンテンツを保護しました。\n\n1. 申し訳ございません、技術的な問題が発生しました。\n2. LPへの変更は行われませんでした。\n3. もう一度、具体的にどの部分を変更したいかお聞かせください。',
          error: errorMessage,
          isContentProtected: true
        }
      }
      
      // アーカイブプロジェクトがある場合：コンテンツを保護したまま編集可能状態を維持
      return { 
        type: 'error', 
        message: '🤔 AI解析エラーのため、既存のLPコンテンツを保護しました。\n\n1. 申し訳ございません、技術的な問題が発生しました。\n2. LPへの変更は行われませんでした。\n3. もう一度、具体的にどの部分を変更したいかお聞かせください。\n\n💬 これらの点について教えていただけますか？',
        error: errorMessage,
        success: false,
        isContentProtected: true,
        // アーカイブコンテンツは変更せず維持
        preserveExistingContent: true
      }
    } finally {
      // クリーンアップを確実に実行
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (controller && !controller.signal.aborted) {
        controller.abort()
      }
      setIsGenerating(false)
    }
  }, [elements, archiveProject])

  // 要素タイプに応じたデフォルトスタイルを取得
  const getDefaultStylesForType = (type: string) => {
    switch (type) {
      case 'hero':
        return {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          fontSize: '48px',
          padding: '80px 20px',
          textAlign: 'center' as const
        }
      case 'text':
        return {
          fontSize: '18px',
          padding: '40px 20px',
          textAlign: 'center' as const,
          textColor: '#6b7280'
        }
      case 'button':
        return {
          backgroundColor: '#ef4444',
          textColor: '#ffffff',
          fontSize: '20px',
          padding: '16px 40px',
          borderRadius: '8px',
          textAlign: 'center' as const,
          margin: '40px auto'
        }
      case 'section':
        return {
          backgroundColor: '#f9fafb',
          padding: '60px 20px',
          textAlign: 'center' as const,
          fontSize: '32px',
          textColor: '#1f2937'
        }
      default:
        return {
          padding: '20px',
          textAlign: 'center' as const
        }
    }
  }

  // AI提案から要素を生成
  const generateElementFromSuggestion = async (suggestion: any, prompt: string): Promise<LPElement | null> => {
    const promptLower = prompt.toLowerCase()
    
    // 新しいAPI形式では、AIが具体的な要素情報を提供
    if (suggestion.newElement) {
      return {
        id: suggestion.newElement.id || `${suggestion.newElement.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: suggestion.newElement.type,
        content: suggestion.newElement.content?.title || suggestion.newElement.content || '新しい要素',
        styles: suggestion.newElement.styles || getDefaultStylesForType(suggestion.newElement.type),
        settings: suggestion.newElement.settings || {}
      }
    }
    
    // フォールバック: 古い形式の場合
    const elementType = suggestion.elementType || suggestion.newElement?.type
    const id = `${elementType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    switch (elementType) {
      case 'hero':
        return {
          id,
          type: 'hero',
          content: promptLower.includes('ai') ? 'AI-Powered ソリューション' : 
                  promptLower.includes('saas') ? 'SaaS プラットフォーム' :
                  promptLower.includes('コンサル') ? 'プロフェッショナル コンサルティング' :
                  promptLower.includes('ec') ? 'ECサイト構築サービス' :
                  '革新的なデジタルソリューション',
          styles: {
            backgroundColor: promptLower.includes('ai') ? '#3b82f6' : 
                            promptLower.includes('saas') ? '#8b5cf6' :
                            promptLower.includes('コンサル') ? '#1f2937' :
                            '#10b981',
            textColor: '#ffffff',
            fontSize: '48px',
            padding: '80px 20px',
            textAlign: 'center'
          },
          settings: {}
        }

      case 'text':
        return {
          id,
          type: 'text',
          content: promptLower.includes('ai') ? 
            'AIの力であなたのビジネスを次のレベルへ。最先端の技術で効率化と成長を実現します。' :
            promptLower.includes('saas') ? 
            'クラウドベースのSaaSソリューションで、どこからでもアクセス可能な業務環境を提供します。' :
            promptLower.includes('コンサル') ? 
            '経験豊富な専門家チームが、お客様のビジネス課題を解決し、持続的な成長をサポートします。' :
            '革新的なアプローチで、お客様のニーズに最適化されたソリューションを提供します。',
          styles: {
            fontSize: '18px',
            padding: '40px 20px',
            textAlign: 'center',
            textColor: '#6b7280'
          },
          settings: {}
        }

      case 'button':
        return {
          id,
          type: 'button',
          content: promptLower.includes('無料') ? '無料で始める' :
                  promptLower.includes('トライアル') ? '無料トライアル開始' :
                  promptLower.includes('相談') ? '無料相談予約' :
                  promptLower.includes('資料') ? '資料ダウンロード' :
                  '今すぐ始める',
          styles: {
            backgroundColor: '#ef4444',
            textColor: '#ffffff',
            fontSize: '20px',
            padding: '16px 40px',
            borderRadius: '8px',
            textAlign: 'center',
            margin: '40px auto'
          },
          settings: { link: '#contact' }
        }

      case 'section':
        let sectionTitle = 'セクション'
        if (promptLower.includes('料金') || promptLower.includes('価格') || promptLower.includes('プラン')) {
          sectionTitle = '料金プラン'
        } else if (promptLower.includes('faq') || promptLower.includes('質問')) {
          sectionTitle = 'よくある質問'
        } else if (promptLower.includes('お客様') || promptLower.includes('レビュー')) {
          sectionTitle = 'お客様の声'
        }

        return {
          id,
          type: 'section',
          content: sectionTitle,
          styles: {
            backgroundColor: '#f9fafb',
            padding: '60px 20px',
            textAlign: 'center',
            fontSize: '32px',
            textColor: '#1f2937'
          },
          settings: {}
        }

      default:
        return null
    }
  }

  // 🚨 削除: 仮置きコード生成機能（Supabaseのコンテンツのみ使用）
  // generateElementsFromPrompt 関数は完全に削除されました

  // 要素の更新処理
  const handleElementUpdate = useCallback(async (elementId: string, updates: any) => {
    const updatedElements = elements.map(element => 
      element.id === elementId 
        ? { ...element, ...updates }
        : element
    )
    
    setElements(updatedElements)
    
    // アーカイブプロジェクトの場合は実際のNext.jsファイルを更新
    if (archiveProject) {
      await updateLiveProject(updatedElements)
    }
  }, [elements, archiveProject])

  // アーカイブプロジェクトとして保存する処理
  const handleSaveAsArchive = useCallback(async () => {
    if (!archiveProject || !user) return

    try {
      setIsGenerating(true)
      
      // 編集されたプロジェクトを新しいバージョンとして保存
      const nextVersion = currentVersion + 1
      // 🚨 重要な修正: AIが編集した実際のpage.tsxコンテンツがある場合はそれを使用、
      // なければ元のzipコンテンツを保持（アーカイブプロジェクト必須）
      if (!archiveProject?.pageContent && !latestPageContent) {
        throw new Error('保存するコンテンツがありません')
      }
      const updatedPageContent = latestPageContent || archiveProject.pageContent
      
      const response = await fetch('/api/archive/save-version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalProjectId: archiveProject.projectInfo.projectName,
          version: nextVersion,
          pageContent: updatedPageContent,
          projectInfo: {
            ...archiveProject.projectInfo,
            siteName: projectName,
            updatedAt: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save new version')
      }

      const result = await response.json()
      setCurrentVersion(nextVersion)
      alert(`v${nextVersion}.zip として保存されました！`)
      
    } catch (error) {
      console.error('Error saving archive version:', error)
      alert('保存に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }, [archiveProject, elements, projectName, currentVersion, user])

  // 🚨 削除: 仮置きコンテンツ生成機能（Supabaseのコンテンツのみ使用）
  // generateReactPageContent 関数は完全に削除されました

  // 🚨 修正: エクスポートはアーカイブコンテンツがある場合のみ実行
  const handleExport = useCallback(() => {
    if (!archiveProject?.pageContent) {
      alert('エクスポートするコンテンツがありません。まずアーカイブプロジェクトを読み込んでください。')
      return
    }
    
    // アーカイブの実際のpage.tsxコンテンツをエクスポート
    const content = latestPageContent || archiveProject.pageContent
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-page.tsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [archiveProject, latestPageContent, projectName])

  // 🚨 修正: シェアはアーカイブコンテンツがある場合のみ実行
  const handleShare = useCallback(() => {
    if (!archiveProject?.pageContent) {
      alert('シェアするコンテンツがありません。まずアーカイブプロジェクトを読み込んでください。')
      return
    }
    
    if (navigator.share) {
      navigator.share({
        title: projectName,
        text: 'V0 AI Editorで編集したアーカイブプロジェクト',
        url: window.location.href
      })
    } else {
      // フォールバック: URLをクリップボードにコピー
      navigator.clipboard.writeText(window.location.href)
      alert('URLをクリップボードにコピーしました')
    }
  }, [archiveProject, projectName])

  // 要素選択処理
  const handleElementSelect = useCallback((elementId: string) => {
    setSelectedElementId(elementId)
  }, [])

  if (loading || isLoadingArchive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">
            {isLoadingArchive ? 'アーカイブプロジェクトを読み込み・Next.js起動中...' : '読み込み中...'}
          </div>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
                />
              </div>
              
              {elements.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {elements.length} 要素
                </Badge>
              )}
              
              {archiveProject && (
                <Badge variant="secondary" className="text-xs">
                  アーカイブ編集中 v{currentVersion}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {archiveProject && (
                <Button
                  onClick={handleSaveAsArchive}
                  variant="default"
                  size="sm"
                  disabled={elements.length === 0 || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-1" />
                  v{currentVersion + 1} 保存
                </Button>
              )}
              
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={!archiveProject?.pageContent}
                title={!archiveProject?.pageContent ? 'アーカイブコンテンツが必要です' : 'アーカイブのpage.tsxをエクスポート'}
              >
                <Download className="w-4 h-4 mr-1" />
                エクスポート
              </Button>
              
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                disabled={!archiveProject?.pageContent}
                title={!archiveProject?.pageContent ? 'アーカイブコンテンツが必要です' : 'アーカイブプロジェクトをシェア'}
              >
                <Share className="w-4 h-4 mr-1" />
                シェア
              </Button>
              
              <Button
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-1" />
                設定
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Left: Chat Interface */}
          <Card className="h-full">
            <V0ChatInterface
              onLPGenerate={handleLPGenerate}
              onElementUpdate={handleElementUpdate}
              isGenerating={isGenerating}
              className="h-full"
            />
          </Card>

          {/* Right: Preview Panel */}
          <Card className="h-full">
            {livePreviewUrl ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">ライブプレビュー</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={isStartingLivePreview ? "secondary" : isUpdatingProject ? "outline" : "default"}>
                        {isStartingLivePreview ? 'Next.js起動中...' : 
                         isUpdatingProject ? 'プロジェクト更新中...' : 
                         'Next.js実行中'}
                      </Badge>
                      {isUpdatingProject && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          <span>ファイル更新中</span>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(livePreviewUrl, '_blank')}
                        disabled={isStartingLivePreview || isUpdatingProject}
                      >
                        新しいタブで開く
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {isStartingLivePreview ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                        <div className="text-gray-600">Next.jsサーバーを起動中...</div>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src={livePreviewUrl}
                      className="w-full h-full border-none"
                      title="Live Next.js Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  )}
                </div>
              </div>
            ) : (
              <V0PreviewPanel
                elements={elements}
                isGenerating={isGenerating}
                onExport={handleExport}
                onShare={handleShare}
                onElementSelect={handleElementSelect}
                selectedElementId={selectedElementId}
                className="h-full"
              />
            )}
          </Card>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isGenerating ? 'bg-yellow-500 animate-pulse' : 
                  isUpdatingProject ? 'bg-blue-500 animate-pulse' : 
                  'bg-green-500'
                }`} />
                <span>
                  {isGenerating ? 'AI生成中...' : 
                   isUpdatingProject ? 'プロジェクト更新中...' : 
                   'AI準備完了'}
                </span>
              </div>
              <span>|</span>
              <span>{elements.length} 要素</span>
              {selectedElementId && (
                <>
                  <span>|</span>
                  <span>選択中: {elements.find(e => e.id === selectedElementId)?.type}</span>
                </>
              )}
              {livePreviewUrl && (
                <>
                  <span>|</span>
                  <span className="text-green-600">Next.js実行中</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span>V0 AI Editor</span>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-500" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🚨 削除: 仮置きHTML生成機能（Supabaseのコンテンツのみ使用）
// generateFullHTML 関数は完全に削除されました