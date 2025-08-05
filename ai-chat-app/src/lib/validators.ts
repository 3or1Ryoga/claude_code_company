import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export const conversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long')
})

export const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  role: z.enum(['user', 'assistant', 'system']).default('user')
})

export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.string().max(10, 'Language code is too long').default('ja'),
  messageFontSize: z.number().min(10).max(20).default(14),
  autoSave: z.boolean().default(true),
  soundEnabled: z.boolean().default(true)
})

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  avatarUrl: z.string().url('Invalid URL format').optional()
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ConversationInput = z.infer<typeof conversationSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>
export type UserProfileInput = z.infer<typeof userProfileSchema>