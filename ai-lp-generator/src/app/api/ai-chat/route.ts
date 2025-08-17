import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, currentElements = [], conversationHistory = [], isNewSession = true, existingPageContent = null, projectInfo = null } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get Gemini API key from environment
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    console.log('Using Gemini API key:', GEMINI_API_KEY.substring(0, 20) + '...')

    // Prepare detailed context about current elements for Gemini
    const elementsContext = currentElements.length > 0 
      ? `\n\n現在のLP構成（詳細）:\n${currentElements.map((el: any, index: number) => {
          return `${index + 1}. 要素ID: ${el.id}
   - タイプ: ${el.type}
   - コンテンツ: ${el.content}
   - スタイル: ${JSON.stringify(el.styles, null, 2)}
   - 設定: ${JSON.stringify(el.settings, null, 2)}`
        }).join('\n\n')}`
      : '\n\n現在のLP構成: まだ要素が作成されていません'

    // 実際のpage.tsxコードがある場合は、それも追加
    const existingCodeContext = existingPageContent 
      ? `\n\n🚨 重要: 現在のpage.tsx実際のコード（これが編集対象です）:\n\`\`\`tsx\n${existingPageContent}\n\`\`\`\n\n**このコードの特定の部分のみを変更してください。全体を再構築してはいけません。**`
      : ''

    // 会話履歴を構築
    const conversationContext = conversationHistory.length > 0 
      ? `\n\n会話履歴:\n${conversationHistory.map((msg: any) => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`).join('\n')}`
      : ''

    const questionInstruction = isNewSession ? 
      "ただし、最高の回答を行うために必要な情報があれば、回答を生成する前にどんな些細なことでも必ず質問してください。" :
      "前回の質問への回答を踏まえて、まだ必要な情報があれば追加で質問し、十分に情報が揃った場合は具体的な変更案を生成してください。"

    const systemPrompt = `あなたは、既存のランディングページ（LP）をユーザーの希望に応じて編集する専門アシスタントです。

🎯 **最優先事項**:
- ユーザーの希望を正確に満たすことが最も重要です
- 必要に応じて大規模な変更も行ってください
- ユーザーが求める機能や見た目を実現してください

${existingPageContent ? `
🔧 **Reactコード編集モード**:
- 提供された実際のpage.tsxコードが編集対象です
- このコードを元に、ユーザーの希望を満たす変更を行ってください
- 色、レイアウト、テキスト、セクション追加・削除、機能追加など、あらゆる変更が可能です
- 🚨 **重要**: 必ず完全なpage.tsxファイル全体（import文からexport default まで）を返してください
- 元のコードの良い部分は保持し、必要な部分は大胆に変更してください` : ''}

会話状況: ${isNewSession ? '新しい会話セッションの開始' : '既存の会話セッションの継続'}

あなたの行動原則:

1. **現状の完全な把握** (最重要):
   提供された「現在のLP構成（詳細）」を細かく分析し、既存の要素のID、タイプ、コンテンツ、スタイル、設定をすべて正確に把握してください。

2. **最小限の変更の特定**:
   ユーザーの要求を満たすために、どの既存要素のどの部分のみを変更すれば良いかを特定してください。

3. **質問による意図の深掘り**:
   ${questionInstruction}

4. **保守的な実行**:
   変更は指定された要素の指定された部分のみに限定し、他の要素やスタイルは現状維持してください。

利用可能なアクション:
- "update": 既存要素の部分的な更新（推奨）
- "add": 新要素の追加（ユーザーが明確に追加を指示した場合のみ）
- "delete": 要素の削除（ユーザーが明確に削除を指示した場合のみ）

出力形式:
あなたの応答は、必ず以下のいずれかのJSONオブジェクト形式にしてください。

A. ユーザーに質問を返す場合:
{
  "type": "question",
  "questions": [
    "現在のLP構成を確認したところ、[既存要素の説明]があります。この部分を変更すれば良いでしょうか？",
    "具体的にどの部分を変更したいか明確にしていただけますか？"
  ],
  "explanation": "既存のLPを保護しつつ、正確な変更を行うために確認が必要です"
}

B. LPの変更案を提案する場合:
{
  "type": "suggestion",
  "explanation": "ユーザーの希望に応じて[具体的な変更内容]を行いました",
  "updatedPageContent": "完全なpage.tsxファイルの内容（import文からexport default function まで全体）"
}

重要: ユーザーの希望を正確に理解し、それを満たす完全なpage.tsxコードを生成してください。

${elementsContext}${existingCodeContext}${conversationContext}`

    const userPrompt = `ユーザーの要求: ${message}

この要求を分析し、必要な情報がすべて揃っているかを判断してください。情報が不足している場合は質問を、十分な場合は具体的な変更案を、指定されたJSON形式で返してください。`

    const requestPayload = {
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,  // 大幅に増加してコード全体を返せるように
      }
    }

    console.log('Sending request to Gemini API:', JSON.stringify(requestPayload, null, 2))

    // Call Gemini API with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Gemini API timeout after 80 seconds')
      controller.abort()
    }, 80000) // 80秒タイムアウト（フロントエンドより短く設定）

    try {
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        errorData
      })
      return NextResponse.json(
        { 
          error: `Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}`,
          details: errorData 
        },
        { status: 500 }
      )
    }

      const geminiData = await geminiResponse.json()
    
    console.log('Gemini API response:', JSON.stringify(geminiData, null, 2))
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No response candidates from Gemini API', geminiData },
        { status: 500 }
      )
    }

    const candidate = geminiData.candidates[0]
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid response structure from Gemini API', candidate },
        { status: 500 }
      )
    }

    const aiResponseText = candidate.content.parts[0].text

    // Try to parse the AI response as JSON with multiple fallbacks
    let parsedAiResponse
    try {
      // AIの応答がJSONコードブロックで囲まれている場合があるので、それを取り除く
      let jsonString = aiResponseText.trim()
      
      console.log('🔍 Raw AI response (first 500 chars):', jsonString.substring(0, 500))
      
      // 複数の方法でJSONを抽出を試行
      let extractedJson = null
      
      // 方法1: ```json...``` ブロックから抽出
      const jsonBlockMatch = jsonString.match(/```json\s*\n?([\s\S]*?)\n?\s*```/)
      if (jsonBlockMatch) {
        extractedJson = jsonBlockMatch[1].trim()
        console.log('✅ Found JSON in code block')
      }
      
      // 方法2: ```...``` ブロックから抽出（json指定なし）
      if (!extractedJson) {
        const codeBlockMatch = jsonString.match(/```\s*\n?([\s\S]*?)\n?\s*```/)
        if (codeBlockMatch) {
          extractedJson = codeBlockMatch[1].trim()
          console.log('✅ Found content in code block')
        }
      }
      
      // 方法3: 直接JSONオブジェクトを探す
      if (!extractedJson) {
        const jsonStart = jsonString.indexOf('{')
        const jsonEnd = jsonString.lastIndexOf('}')
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          extractedJson = jsonString.substring(jsonStart, jsonEnd + 1)
          console.log('✅ Found JSON directly')
        }
      }
      
      // 方法4: 行ごとに分析してJSONを再構築
      if (!extractedJson) {
        const lines = jsonString.split('\n')
        let jsonLines = []
        let inJson = false
        
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            inJson = true
          }
          if (inJson) {
            jsonLines.push(line)
          }
          if (line.trim().endsWith('}') && inJson) {
            break
          }
        }
        
        if (jsonLines.length > 0) {
          extractedJson = jsonLines.join('\n')
          console.log('✅ Reconstructed JSON from lines')
        }
      }
      
      if (!extractedJson) {
        throw new Error('Could not extract JSON from AI response')
      }
      
      console.log('🔍 Extracted JSON (first 300 chars):', extractedJson.substring(0, 300) + '...')
      parsedAiResponse = JSON.parse(extractedJson)
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
      console.log('Raw AI response:', aiResponseText)
      
      // パースに失敗した場合は、安全なエラー質問を返す（LP破壊を防ぐ）
      console.error('🚨 AI応答のパースに失敗しました。LPを保護します。')
      parsedAiResponse = {
        type: 'question',
        questions: [
          '申し訳ございません、技術的な問題が発生しました。',
          'LPへの変更は行われませんでした。',
          'もう一度、具体的にどの部分を変更したいかお聞かせください。'
        ],
        explanation: 'AI解析エラーのため、既存のLPコンテンツを保護しました。'
      }
    }

    return NextResponse.json({
      success: true,
      ...parsedAiResponse,
      timestamp: new Date().toISOString()
    })

    } catch (geminiError) {
      clearTimeout(timeoutId)
      console.error('Gemini API call failed:', geminiError)
      
      // タイムアウトエラーの特別処理
      if (geminiError instanceof Error && geminiError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'AI processing timeout',
            message: 'AI解析がタイムアウトしました。より簡潔な指示で再度お試しください。'
          },
          { status: 408 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Gemini API call failed',
          details: geminiError instanceof Error ? geminiError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in POST /api/ai-chat:', error)
    return NextResponse.json(
      { error: 'Failed to process AI chat request' },
      { status: 500 }
    )
  }
}

// AIの応答がJSON形式で返ってくるため、parseGeminiResponse関数は不要になりました