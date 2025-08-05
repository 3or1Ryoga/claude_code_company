import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { conversationSchema } from '@/lib/validators'
import { formatArrayTimestamps, formatTimestampFields } from '@/lib/utils/datetime'

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          userId: payload.userId,
          isArchived: false
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.conversation.count({
        where: {
          userId: payload.userId,
          isArchived: false
        }
      })
    ])

    const formattedConversations = formatArrayTimestamps(
      conversations.map((conv: {
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        _count: { messages: number };
      }) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv._count.messages
      }))
    )

    return NextResponse.json({
      success: true,
      conversations: formattedConversations,
      total,
      hasMore: offset + limit < total
    })
  } catch (error) {
    console.error('Get conversations error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const validatedData = conversationSchema.parse(body)

    const conversation = await prisma.conversation.create({
      data: {
        title: validatedData.title,
        userId: payload.userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      conversation: formatTimestampFields(conversation)
    }, { status: 201 })
  } catch (error) {
    console.error('Create conversation error:', error)
    
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