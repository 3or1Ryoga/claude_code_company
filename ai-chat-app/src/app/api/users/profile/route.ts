import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { userProfileSchema } from '@/lib/validators'
import { formatTimestampFields, getCurrentTimestamp } from '@/lib/utils/datetime'

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: formatTimestampFields(user)
    })
  } catch (error) {
    console.error('Get profile error:', error)
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
    const validatedData = userProfileSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: validatedData.name,
        avatarUrl: validatedData.avatarUrl,
        updatedAt: getCurrentTimestamp()
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      profile: formatTimestampFields(updatedUser)
    })
  } catch (error) {
    console.error('Update profile error:', error)
    
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