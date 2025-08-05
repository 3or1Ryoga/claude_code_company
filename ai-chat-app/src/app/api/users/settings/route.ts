import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, extractTokenFromHeader } from '@/lib/auth'
import { userSettingsSchema } from '@/lib/validators'
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

    let settings = await prisma.userSetting.findUnique({
      where: { userId: payload.userId },
      select: {
        theme: true,
        language: true,
        messageFontSize: true,
        autoSave: true,
        soundEnabled: true,
        updatedAt: true
      }
    })

    if (!settings) {
      settings = await prisma.userSetting.create({
        data: { userId: payload.userId },
        select: {
          theme: true,
          language: true,
          messageFontSize: true,
          autoSave: true,
          soundEnabled: true,
          updatedAt: true
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: formatTimestampFields(settings, ['updatedAt'])
    })
  } catch (error) {
    console.error('Get settings error:', error)
    
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
    const validatedData = userSettingsSchema.parse(body)

    const updatedSettings = await prisma.userSetting.upsert({
      where: { userId: payload.userId },
      update: {
        theme: validatedData.theme,
        language: validatedData.language,
        messageFontSize: validatedData.messageFontSize,
        autoSave: validatedData.autoSave,
        soundEnabled: validatedData.soundEnabled,
        updatedAt: getCurrentTimestamp()
      },
      create: {
        userId: payload.userId,
        theme: validatedData.theme,
        language: validatedData.language,
        messageFontSize: validatedData.messageFontSize,
        autoSave: validatedData.autoSave,
        soundEnabled: validatedData.soundEnabled
      },
      select: {
        theme: true,
        language: true,
        messageFontSize: true,
        autoSave: true,
        soundEnabled: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      settings: formatTimestampFields(updatedSettings, ['updatedAt'])
    })
  } catch (error) {
    console.error('Update settings error:', error)
    
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