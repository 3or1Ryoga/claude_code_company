import { NextRequest, NextResponse } from 'next/server'
import { ChatService } from '@/lib/services/chatService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, stream = false } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'メッセージが必要です' },
        { status: 400 }
      )
    }

    if (stream) {
      // ストリーミングレスポンス
      const encoder = new TextEncoder()
      
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // OpenAI APIからストリーミングでレスポンスを取得
            const response = await ChatService.generateAIResponseStream(message)
            
            for await (const chunk of response) {
              const data = `data: ${JSON.stringify({ content: chunk, done: false })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
            
            // 完了を送信
            const doneData = `data: ${JSON.stringify({ content: '', done: true })}\n\n`
            controller.enqueue(encoder.encode(doneData))
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            const errorData = `data: ${JSON.stringify({ 
              content: 'エラーが発生しました。もう一度お試しください。', 
              done: true,
              error: true 
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // 通常のレスポンス
      const aiResponse = await ChatService.generateAIResponse(message)
      
      return NextResponse.json({
        success: true,
        message: aiResponse
      })
    }
  } catch (error) {
    console.error('API Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました'
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}