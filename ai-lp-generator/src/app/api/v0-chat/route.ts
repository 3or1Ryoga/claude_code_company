import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface V0ChatRequest {
  message: string
  sessionId?: string
  currentLP?: {
    sections: any[]
    config: any
  }
  mode: 'create' | 'modify'
}

// V0風チャット駆動LP生成・修正API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { message, sessionId, currentLP, mode }: V0ChatRequest = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'メッセージが必要です' }, { status: 400 })
    }

    // Geminiモデル初期化
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // チャット履歴取得（セッションベース）
    let chatHistory: ChatMessage[] = []
    if (sessionId) {
      const { data: session } = await supabase
        .from('v0_chat_sessions')
        .select('chat_history')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single()
      
      if (session) {
        chatHistory = session.chat_history || []
      }
    }

    // プロンプト生成
    let systemPrompt = ""
    let userPrompt = message

    if (mode === 'create') {
      // 初期生成モード（PASONA+V0スタイル）
      systemPrompt = `
あなたはV0風LP生成AIです。ユーザーの要求から効果的なランディングページを生成します。

**生成ルール:**
1. PASONA法則に基づいた構造化
2. V0.appスタイルの洗練されたデザイン
3. レスポンシブ対応
4. 実装可能なTailwind CSSクラス使用

**出力形式（JSON）:**
{
  "sections": [
    {
      "type": "hero",
      "id": "hero-1",
      "content": {
        "title": "メインタイトル",
        "subtitle": "サブタイトル", 
        "cta": "アクションボタンテキスト"
      },
      "styles": {
        "background": "bg-gradient-to-r from-blue-600 to-blue-800",
        "text": "text-white",
        "layout": "text-center py-20"
      }
    }
  ],
  "config": {
    "theme": "modern",
    "colorScheme": "blue",
    "typography": "clean"
  },
  "explanation": "生成理由と特徴の説明"
}

PASONAフレームワークを活用し、Problem→Affinity→Solution→Offer→NarrowingDown→Actionの順序で構成してください。
`
    } else {
      // 修正モード
      systemPrompt = `
あなたはV0風LP修正AIです。既存のLPに対してユーザーの要求を反映した修正を行います。

**現在のLP構造:**
${JSON.stringify(currentLP, null, 2)}

**修正ルール:**
1. 既存構造を維持しつつ要求を反映
2. デザイン一貫性の保持
3. UX改善の提案

**出力形式（JSON）:**
{
  "sections": [...修正後のセクション配列],
  "config": {...修正後の設定},
  "changes": ["変更点1", "変更点2"],
  "explanation": "修正内容の説明"
}
`
    }

    // 履歴を含むプロンプト構築
    const conversationHistory = chatHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')

    const fullPrompt = `
${systemPrompt}

**会話履歴:**
${conversationHistory}

**現在のユーザー要求:**
${userPrompt}

上記形式のJSONで回答してください。
`

    // Gemini AI生成
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    let aiResponse = response.text()

    // JSON抽出
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI応答からJSONを抽出できませんでした')
    }

    const generatedLP = JSON.parse(jsonMatch[0])

    // チャット履歴更新
    const newChatHistory: ChatMessage[] = [
      ...chatHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant', 
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    ]

    // セッション保存・更新
    const sessionData = {
      user_id: user.id,
      chat_history: newChatHistory,
      current_lp: generatedLP,
      updated_at: new Date().toISOString()
    }

    if (sessionId) {
      // 既存セッション更新
      await supabase
        .from('v0_chat_sessions')
        .update(sessionData)
        .eq('id', sessionId)
        .eq('user_id', user.id)
    } else {
      // 新規セッション作成
      const { data: newSession } = await supabase
        .from('v0_chat_sessions')
        .insert({
          ...sessionData,
          id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (newSession?.id) {
        Object.assign(sessionData, { id: newSession.id })
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: (sessionData as any).id || sessionId,
      generatedLP,
      explanation: generatedLP.explanation || '',
      changes: generatedLP.changes || [],
      chatHistory: newChatHistory,
      mode
    })

  } catch (error) {
    console.error('V0 Chat API Error:', error)
    return NextResponse.json(
      { error: 'LP生成・修正に失敗しました' },
      { status: 500 }
    )
  }
}

// チャット履歴取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      // ユーザーの全セッション取得
      const { data: sessions } = await supabase
        .from('v0_chat_sessions')
        .select('id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10)

      return NextResponse.json({
        success: true,
        sessions: sessions || []
      })
    }

    // 特定セッション取得
    const { data: session } = await supabase
      .from('v0_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'セッションが見つかりません' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      session
    })

  } catch (error) {
    console.error('V0 Chat GET Error:', error)
    return NextResponse.json(
      { error: 'セッション取得に失敗しました' },
      { status: 500 }
    )
  }
}