import { prisma } from '@/lib/db'
import { Conversation, Message, User } from '@prisma/client'
import { getCurrentTimestamp } from '@/lib/utils/datetime'
import { OpenAIService } from '@/lib/openai'

export class ChatService {
  static async createConversation(userId: string, title: string): Promise<Conversation> {
    return prisma.conversation.create({
      data: {
        userId,
        title
      }
    })
  }

  static async getUserConversations(
    userId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<{ conversations: any[], total: number }> {
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          userId,
          isArchived: false
        },
        include: {
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
          userId,
          isArchived: false
        }
      })
    ])

    return { conversations, total }
  }

  static async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId
      }
    })
  }

  static async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await this.getConversationById(conversationId, userId)
    if (!conversation) {
      return false
    }

    await prisma.conversation.delete({
      where: { id: conversationId }
    })

    return true
  }

  static async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    before?: string
  ): Promise<{ messages: Message[], nextCursor: string | null }> {
    const conversation = await this.getConversationById(conversationId, userId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const whereClause: any = { conversationId }
    if (before) {
      whereClause.createdAt = { lt: new Date(before) }
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    })

    const hasMore = messages.length > limit
    const messageList = hasMore ? messages.slice(0, limit) : messages
    const nextCursor = hasMore ? messageList[messageList.length - 1].createdAt.toISOString() : null

    return {
      messages: messageList.reverse(),
      nextCursor
    }
  }

  static async createMessage(
    conversationId: string,
    userId: string,
    content: string,
    role: 'user' | 'assistant' | 'system' = 'user'
  ): Promise<Message> {
    const conversation = await this.getConversationById(conversationId, userId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        userId,
        content,
        role,
        tokenCount: role === 'assistant' ? Math.floor(content.length / 4) : undefined
      }
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: getCurrentTimestamp() }
    })

    return message
  }

  static async generateAIResponse(userMessage: string, conversationHistory?: Message[]): Promise<string> {
    try {
      // システムプロンプトの設定
      const systemMessage = {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Respond naturally and helpfully to user questions. Keep responses concise but informative.'
      }

      // 会話履歴を構築（最新10件まで）
      const messages = [systemMessage]
      
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10)
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
      }

      // 新しいユーザーメッセージを追加
      messages.push({
        role: 'user' as const,
        content: userMessage
      })

      // OpenAI APIを呼び出し
      const response = await OpenAIService.createChatCompletion({
        messages,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      })

      return response
    } catch (error) {
      console.error('AI Response Generation Error:', error)
      
      // フォールバック応答
      if (error instanceof Error) {
        if (error.message.includes('Rate limit exceeded')) {
          return 'I apologize, but I am currently experiencing high demand. Please try again in a moment.'
        }
        if (error.message.includes('Invalid OpenAI API key')) {
          return 'I apologize, but there is a configuration issue. Please contact support.'
        }
        if (error.message.includes('timeout')) {
          return 'I apologize for the delay. Please try asking your question again.'
        }
      }
      
      return 'I apologize, but I am unable to process your request at the moment. Please try again later.'
    }
  }

  static async* generateAIResponseStream(userMessage: string, conversationHistory?: Message[]): AsyncGenerator<string, void, unknown> {
    try {
      // システムプロンプトの設定
      const systemMessage = {
        role: 'system' as const,
        content: 'You are a helpful AI assistant. Respond naturally and helpfully to user questions. Keep responses concise but informative.'
      }

      // 会話履歴を構築（最新10件まで）
      const messages = [systemMessage]
      
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-10)
        for (const msg of recentHistory) {
          messages.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
      }

      // 新しいユーザーメッセージを追加
      messages.push({
        role: 'user' as const,
        content: userMessage
      })

      // OpenAI APIからストリーミングレスポンスを取得
      const openaiService = new OpenAIService()
      const stream = await openaiService.createChatCompletionStream({
        messages,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.7
      })

      for await (const chunk of stream) {
        yield chunk
      }
    } catch (error) {
      console.error('AI Response Stream Generation Error:', error)
      
      // フォールバック応答
      if (error instanceof Error) {
        if (error.message.includes('Rate limit exceeded')) {
          yield 'I apologize, but I am currently experiencing high demand. Please try again in a moment.'
        } else if (error.message.includes('Invalid OpenAI API key')) {
          yield 'I apologize, but there is a configuration issue. Please contact support.'
        } else if (error.message.includes('timeout')) {
          yield 'I apologize for the delay. Please try asking your question again.'
        } else {
          yield 'I apologize, but I am unable to process your request at the moment. Please try again later.'
        }
      } else {
        yield 'I apologize, but I am unable to process your request at the moment. Please try again later.'
      }
    }
  }

  static async createConversationWithMessage(
    userId: string,
    title: string,
    initialMessage: string
  ): Promise<{ conversation: Conversation, userMessage: Message, assistantMessage: Message }> {
    const conversation = await this.createConversation(userId, title)
    
    const userMessage = await this.createMessage(conversation.id, userId, initialMessage, 'user')
    
    // 新しい会話なので履歴は空
    const aiResponse = await this.generateAIResponse(initialMessage, [])
    const assistantMessage = await this.createMessage(conversation.id, userId, aiResponse, 'assistant')

    return {
      conversation,
      userMessage,
      assistantMessage
    }
  }

  static async createMessageWithAIResponse(
    conversationId: string,
    userId: string,
    userMessageContent: string
  ): Promise<{ userMessage: Message, assistantMessage: Message }> {
    // まずユーザーメッセージを保存
    const userMessage = await this.createMessage(conversationId, userId, userMessageContent, 'user')
    
    // 会話履歴を取得（AI応答生成のため）
    const conversationHistory = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20 // 最新20件まで
    })
    
    // AI応答を生成（履歴を含む）
    const aiResponse = await this.generateAIResponse(userMessageContent, conversationHistory)
    const assistantMessage = await this.createMessage(conversationId, userId, aiResponse, 'assistant')

    return {
      userMessage,
      assistantMessage
    }
  }
}