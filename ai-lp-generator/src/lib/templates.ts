import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export interface TemplateData {
  id: string
  user_id?: string | null
  name: string
  description?: string
  category: string
  thumbnail?: string
  sections: string[]
  config: Record<string, any>
  is_public: boolean
  usage_count: number
  created_at?: string
  updated_at?: string
}

export interface TemplateCreateInput {
  name: string
  description?: string
  category?: string
  thumbnail?: string
  sections: string[]
  config: Record<string, any>
  is_public?: boolean
}

export interface TemplateUpdateInput {
  name?: string
  description?: string
  category?: string
  thumbnail?: string
  sections?: string[]
  config?: Record<string, any>
  is_public?: boolean
}

export class TemplateService {
  private supabase: any

  constructor(useAdmin: boolean = false) {
    if (useAdmin) {
      this.supabase = createAdminSupabaseClient()
    } else {
      this.supabase = null
    }
  }

  private async getSupabaseClient() {
    if (this.supabase) {
      return this.supabase
    }
    return await createServerSupabaseClient()
  }

  async createTemplate(userId: string, data: TemplateCreateInput): Promise<TemplateData> {
    const supabase = await this.getSupabaseClient()
    
    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        user_id: userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        category: data.category || 'custom',
        thumbnail: data.thumbnail || null,
        sections: data.sections,
        config: data.config,
        is_public: data.is_public || false,
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create template: ${error.message}`)
    }

    return template
  }

  async getTemplate(id: string): Promise<TemplateData | null> {
    const supabase = await this.getSupabaseClient()
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get template: ${error.message}`)
    }

    return data
  }

  async getPublicTemplates(options: {
    category?: string
    limit?: number
    offset?: number
    search?: string
  } = {}): Promise<{ data: TemplateData[], total: number }> {
    const supabase = await this.getSupabaseClient()
    
    const { category, limit = 20, offset = 0, search } = options

    let query = supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('usage_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to get public templates: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0
    }
  }

  async getUserTemplates(
    userId: string,
    options: {
      limit?: number
      offset?: number
      search?: string
      include_public?: boolean
    } = {}
  ): Promise<{ data: TemplateData[], total: number }> {
    const supabase = await this.getSupabaseClient()
    
    const { limit = 20, offset = 0, search, include_public = true } = options

    let query = supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (include_public) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq('user_id', userId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to get user templates: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0
    }
  }

  async updateTemplate(
    id: string,
    userId: string,
    updates: TemplateUpdateInput
  ): Promise<TemplateData> {
    const supabase = await this.getSupabaseClient()
    
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail
    if (updates.sections !== undefined) updateData.sections = updates.sections
    if (updates.config !== undefined) updateData.config = updates.config
    if (updates.is_public !== undefined) updateData.is_public = updates.is_public

    const { data, error } = await supabase
      .from('templates')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`)
    }

    if (!data) {
      throw new Error('Template not found or access denied')
    }

    return data
  }

  async deleteTemplate(id: string, userId: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`)
    }
  }

  async incrementUsageCount(id: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    
    const { error } = await supabase.rpc('increment_template_usage', {
      template_id: id
    })

    if (error) {
      console.error('Failed to increment template usage:', error)
      // Don't throw error as this is not critical
    }
  }

  async duplicateTemplate(
    id: string,
    userId: string,
    newName?: string
  ): Promise<TemplateData> {
    const original = await this.getTemplate(id)
    
    if (!original) {
      throw new Error('Original template not found')
    }

    // Check if user can access this template
    if (!original.is_public && original.user_id !== userId) {
      throw new Error('Access denied to template')
    }

    const duplicateData: TemplateCreateInput = {
      name: newName || `${original.name} (Copy)`,
      description: original.description || undefined,
      category: original.category,
      thumbnail: original.thumbnail || undefined,
      sections: original.sections,
      config: original.config,
      is_public: false // Always create private copies
    }

    return this.createTemplate(userId, duplicateData)
  }

  async getTemplatesByCategory(): Promise<Record<string, TemplateData[]>> {
    const { data: templates } = await this.getPublicTemplates({ limit: 100 })
    
    const grouped: Record<string, TemplateData[]> = {}
    
    templates.forEach(template => {
      const category = template.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(template)
    })

    return grouped
  }

  async searchTemplates(
    query: string,
    options: {
      category?: string
      limit?: number
      userId?: string
    } = {}
  ): Promise<TemplateData[]> {
    const { category, limit = 10, userId } = options
    
    if (userId) {
      const { data } = await this.getUserTemplates(userId, {
        search: query,
        limit,
        include_public: true
      })
      return data
    } else {
      const { data } = await this.getPublicTemplates({
        search: query,
        category,
        limit
      })
      return data
    }
  }
}

// Template validation utilities
export const templateUtils = {
  validateConfig(config: any): boolean {
    try {
      return typeof config === 'object' && config !== null
    } catch {
      return false
    }
  },

  validateSections(sections: any): boolean {
    return Array.isArray(sections) && sections.every(s => typeof s === 'string')
  },

  getDefaultSections(): string[] {
    return ['hero', 'features', 'cta']
  },

  getAvailableCategories(): string[] {
    return [
      'business',
      'saas',
      'portfolio',
      'ecommerce',
      'blog',
      'agency',
      'startup',
      'nonprofit',
      'education',
      'custom'
    ]
  },

  createBasicTemplate(name: string, category: string = 'custom'): TemplateCreateInput {
    return {
      name,
      category,
      sections: this.getDefaultSections(),
      config: {
        hero: {
          title: '見出しを入力',
          subtitle: 'サブタイトルを入力',
          ctaText: 'アクション',
          backgroundType: 'gradient'
        },
        features: {
          title: '特徴',
          items: []
        },
        cta: {
          title: 'お問い合わせ',
          buttonText: 'お問い合わせ',
          description: 'お気軽にご連絡ください'
        }
      },
      is_public: false
    }
  },

  mergeConfigs(baseConfig: Record<string, any>, overrides: Record<string, any>): Record<string, any> {
    const merged = { ...baseConfig }
    
    Object.keys(overrides).forEach(key => {
      if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        merged[key] = { ...merged[key], ...overrides[key] }
      } else {
        merged[key] = overrides[key]
      }
    })
    
    return merged
  }
}

// Create RPC function for incrementing usage count
export const createTemplateRPCFunctions = `
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;
`