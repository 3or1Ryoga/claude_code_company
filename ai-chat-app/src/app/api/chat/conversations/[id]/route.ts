import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { formatTimestampFields } from '@/lib/utils/datetime'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
        id,
        userId: payload.userId
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        isArchived: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation: formatTimestampFields({
        ...conversation,
        messageCount: conversation._count.messages
      })
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
        id,
        userId: payload.userId
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } },
        { status: 404 }
      )
    }

    await prisma.conversation.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    console.error('Delete conversation error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}