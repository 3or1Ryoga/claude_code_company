import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { formatTimestampFields } from '@/lib/utils/datetime'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('auth-token')?.value
    
    const token = extractTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_TOKEN', message: 'No authentication token provided' } },
        { status: 401 }
      )
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user: formatTimestampFields(user)
    })
  } catch (error) {
    console.error('Get user error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}