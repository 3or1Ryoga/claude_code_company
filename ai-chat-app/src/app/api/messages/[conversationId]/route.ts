import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { messageSchema } from '@/lib/validators'
import { formatArrayTimestamps, formatTimestampFields, getCurrentTimestamp } from '@/lib/utils/datetime'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
        { status: 401 }
      )
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: payload.userId
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const before = searchParams.get('before')

    const whereClause: any = {
      conversationId
    }

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before)
      }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      select: {
        id: true,
        content: true,
        role: true,
        createdAt: true,
        tokenCount: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    })

    const hasMore = messages.length > limit
    const messageList = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? messageList[messageList.length - 1].createdAt.toISOString() : null

    return NextResponse.json({
      success: true,
      messages: formatArrayTimestamps(messageList.reverse()),
      nextCursor
    })
  } catch (error) {
    console.error('Get messages error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    const token = extractTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
        { status: 401 }
      )
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: payload.userId
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    // ChatServiceを使用してメッセージとAI応答を作成
    const { userMessage, assistantMessage } = await prisma.$transaction(async (tx) => {
      // ユーザーメッセージを保存
      const userMsg = await tx.message.create({
        data: {
          conversationId,
          userId: payload.userId,
          content: validatedData.content,
          role: 'user'
        },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true
        }
      })

      // 会話履歴を取得（AI応答生成のため）
      const conversationHistory = await tx.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        take: 20 // 最新20件まで
      })

      // AI応答を生成
      const aiResponse = await require('@/lib/services/chatService').ChatService.generateAIResponse(
        validatedData.content,
        conversationHistory
      )

      // AI応答を保存
      const assistantMsg = await tx.message.create({
        data: {
          conversationId,
          userId: payload.userId,
          content: aiResponse,
          role: 'assistant',
          tokenCount: Math.floor(aiResponse.length / 4)
        },
        select: {
          id: true,
          content: true,
          role: true,
          createdAt: true,
          tokenCount: true
        }
      })

      return { userMessage: userMsg, assistantMessage: assistantMsg }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: getCurrentTimestamp() }
    })

    return NextResponse.json({
      success: true,
      userMessage: formatTimestampFields(userMessage),
      assistantMessage: formatTimestampFields(assistantMessage)
    }, { status: 201 })
  } catch (error) {
    console.error('Create message error:', error)
    
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}