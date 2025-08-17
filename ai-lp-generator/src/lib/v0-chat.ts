import { createClient } from '@supabase/supabase-js'
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface V0Section {
  type: string
  id: string
  content: Record<string, any>
  styles?: Record<string, string>
  animation?: string
}

export interface V0Config {
  theme: string
  colorScheme: string
  typography: string
  responsive?: boolean
}

export interface V0LandingPage {
  sections: V0Section[]
  config: V0Config
  metadata?: Record<string, any>
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface V0ChatSession {
  id: string
  user_id: string
  chat_history: ChatMessage[]
  current_lp?: V0LandingPage
  compressed_data?: Buffer
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export class V0ChatService {
  
  // セッション作成
  async createSession(userId: string, initialLP?: V0LandingPage): Promise<string> {
    const sessionId = `v0_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const sessionData = {
      id: sessionId,
      user_id: userId,
      chat_history: [],
      current_lp: initialLP || null,
      metadata: {
        created_with: 'v0-chat-api',
        version: '1.0.0'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('v0_chat_sessions')
      .insert(sessionData)

    if (error) {
      throw new Error(`セッション作成に失敗しました: ${error.message}`)
    }

    return sessionId
  }

  // セッション取得
  async getSession(sessionId: string, userId: string): Promise<V0ChatSession | null> {
    const { data, error } = await supabase
      .from('v0_chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    // 圧縮データがある場合は展開
    if (data.compressed_data && !data.current_lp) {
      try {
        const decompressed = await gunzipAsync(data.compressed_data)
        data.current_lp = JSON.parse(decompressed.toString())
      } catch (err) {
        console.error('圧縮データの展開に失敗:', err)
      }
    }

    return data as V0ChatSession
  }

  // セッション更新（大容量データ自動圧縮）
  async updateSession(
    sessionId: string, 
    userId: string, 
    updates: Partial<V0ChatSession>
  ): Promise<void> {
    let updateData: any = { ...updates, updated_at: new Date().toISOString() }

    // LP データサイズチェック（5KB以上で圧縮）
    if (updates.current_lp) {
      const lpDataSize = JSON.stringify(updates.current_lp).length
      
      if (lpDataSize > 5000) {
        // 大容量データは圧縮して保存
        try {
          const compressed = await gzipAsync(JSON.stringify(updates.current_lp))
          updateData.compressed_data = compressed
          updateData.current_lp = null // 圧縮データ使用時はJSONBをクリア
        } catch (err) {
          console.error('データ圧縮に失敗:', err)
          // 圧縮失敗時は通常保存
        }
      }
    }

    const { error } = await supabase
      .from('v0_chat_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`セッション更新に失敗しました: ${error.message}`)
    }
  }

  // ユーザーセッション一覧取得
  async getUserSessions(userId: string, limit = 20): Promise<V0ChatSession[]> {
    const { data, error } = await supabase
      .from('v0_chat_sessions')
      .select('id, created_at, updated_at, metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`セッション一覧取得に失敗しました: ${error.message}`)
    }

    return data as V0ChatSession[]
  }

  // セッション削除
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('v0_chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`セッション削除に失敗しました: ${error.message}`)
    }
  }

  // 生成分析データ保存
  async recordGenerationAnalytics(data: {
    userId: string
    sessionId: string
    generationType: 'create' | 'modify' | 'optimize'
    inputPrompt: string
    outputSections: V0Section[]
    generationTimeMs: number
    tokensUsed?: number
  }): Promise<void> {
    const analyticsData = {
      user_id: data.userId,
      session_id: data.sessionId,
      generation_type: data.generationType,
      input_prompt: data.inputPrompt,
      output_sections: data.outputSections,
      generation_time_ms: data.generationTimeMs,
      tokens_used: data.tokensUsed || 0,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('v0_generation_analytics')
      .insert(analyticsData)

    if (error) {
      console.error('Analytics recording failed:', error)
      // 分析データ保存失敗は非致命的エラーとして処理
    }
  }

  // 人気テンプレート取得
  async getFeaturedTemplates(category?: string): Promise<any[]> {
    let query = supabase
      .from('v0_generated_templates')
      .select('*')
      .eq('is_featured', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.limit(10)

    if (error) {
      throw new Error(`テンプレート取得に失敗しました: ${error.message}`)
    }

    return data || []
  }

  // テンプレート使用回数更新
  async incrementTemplateUsage(templateId: string): Promise<void> {
    // First get current usage count
    const { data: currentTemplate } = await supabase
      .from('v0_generated_templates')
      .select('usage_count')
      .eq('id', templateId)
      .single()

    const newUsageCount = (currentTemplate?.usage_count || 0) + 1

    const { error } = await supabase
      .from('v0_generated_templates')
      .update({ 
        usage_count: newUsageCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)

    if (error) {
      console.error('Template usage increment failed:', error)
    }
  }

  // V0風セクション生成テンプレート
  static generateV0Section(type: string, content: any, styleVariant = 'default'): V0Section {
    const baseStyles = {
      hero: {
        default: {
          background: 'bg-gradient-to-r from-blue-600 to-purple-600',
          text: 'text-white',
          layout: 'text-center py-24 px-4'
        },
        minimal: {
          background: 'bg-white',
          text: 'text-gray-900',
          layout: 'text-center py-16 px-4'
        },
        dark: {
          background: 'bg-gray-900',
          text: 'text-white',
          layout: 'text-center py-24 px-4'
        }
      },
      feature: {
        default: {
          background: 'bg-gray-50',
          text: 'text-gray-900',
          layout: 'py-16 px-4'
        },
        card: {
          background: 'bg-white',
          text: 'text-gray-900',
          layout: 'py-16 px-4 grid gap-8'
        }
      },
      cta: {
        default: {
          background: 'bg-indigo-600',
          text: 'text-white',
          layout: 'text-center py-16 px-4'
        },
        outline: {
          background: 'bg-transparent border-2 border-indigo-600',
          text: 'text-indigo-600',
          layout: 'text-center py-16 px-4'
        }
      }
    }

    const sectionId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const styles = (baseStyles as any)[type]?.[styleVariant] || (baseStyles as any)[type]?.default || {}

    return {
      type,
      id: sectionId,
      content,
      styles,
      animation: 'fade-in'
    }
  }
}

export const v0ChatService = new V0ChatService()