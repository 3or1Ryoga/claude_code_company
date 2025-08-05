import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { User, UserSetting } from '@prisma/client'
import { getCurrentTimestamp } from '@/lib/utils/datetime'

export class UserService {
  static async createUser(name: string, email: string, password: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('Email already registered')
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        lastLoginAt: getCurrentTimestamp()
      }
    })

    await prisma.userSetting.create({
      data: {
        userId: user.id
      }
    })

    return user
  }

  static async authenticateUser(email: string, password: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.isActive) {
      return null
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return null
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: getCurrentTimestamp() }
    })

    return user
  }

  static async getUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId }
    })
  }

  static async updateUserProfile(userId: string, data: { name?: string, avatarUrl?: string }): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: getCurrentTimestamp()
      }
    })
  }

  static async getUserSettings(userId: string): Promise<UserSetting> {
    let settings = await prisma.userSetting.findUnique({
      where: { userId }
    })

    if (!settings) {
      settings = await prisma.userSetting.create({
        data: { userId }
      })
    }

    return settings
  }

  static async updateUserSettings(
    userId: string, 
    data: {
      theme?: 'light' | 'dark' | 'auto'
      language?: string
      messageFontSize?: number
      autoSave?: boolean
      soundEnabled?: boolean
    }
  ): Promise<UserSetting> {
    return prisma.userSetting.upsert({
      where: { userId },
      update: {
        ...data,
        updatedAt: getCurrentTimestamp()
      },
      create: {
        userId,
        ...data
      }
    })
  }

  static async deactivateUser(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        updatedAt: getCurrentTimestamp()
      }
    })
  }

  static async getUserStats(userId: string): Promise<{
    conversationCount: number
    messageCount: number
    joinDate: Date
    lastActive: Date | null
  }> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const [conversationCount, messageCount] = await Promise.all([
      prisma.conversation.count({
        where: { userId }
      }),
      prisma.message.count({
        where: { userId }
      })
    ])

    return {
      conversationCount,
      messageCount,
      joinDate: user.createdAt,
      lastActive: user.lastLoginAt
    }
  }
}