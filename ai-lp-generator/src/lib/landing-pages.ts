import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export interface LandingPageData {
  id?: string
  user_id: string
  name: string
  slug?: string
  description?: string
  template_id?: string
  layout_config: Record<string, any>
  is_published?: boolean
  custom_domain?: string
  seo_meta?: Record<string, any>
  analytics_config?: Record<string, any>
  published_at?: string | null
}

export interface LandingPageCreateInput {
  name: string
  description?: string
  template_id?: string
  layout_config: Record<string, any>
  seo_meta?: Record<string, any>
}

export interface LandingPageUpdateInput {
  name?: string
  description?: string
  template_id?: string
  layout_config?: Record<string, any>
  is_published?: boolean
  custom_domain?: string
  seo_meta?: Record<string, any>
  analytics_config?: Record<string, any>
}

export class LandingPageService {
  private supabase: any

  constructor(useAdmin: boolean = false) {
    if (useAdmin) {
      this.supabase = createAdminSupabaseClient()
    } else {
      // Will be initialized with user context in methods
      this.supabase = null
    }
  }

  private async getSupabaseClient() {
    if (this.supabase) {
      return this.supabase
    }
    return await createServerSupabaseClient()
  }

  async createLandingPage(userId: string, data: LandingPageCreateInput): Promise<LandingPageData> {
    const supabase = await this.getSupabaseClient()
    
    const { data: landingPage, error } = await supabase
      .from('landing_pages')
      .insert({
        user_id: userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        template_id: data.template_id || null,
        layout_config: data.layout_config || {},
        seo_meta: data.seo_meta || {},
        is_published: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create landing page: ${error.message}`)
    }

    return landingPage
  }

  async getLandingPage(id: string, userId?: string): Promise<LandingPageData | null> {
    const supabase = await this.getSupabaseClient()
    
    let query = supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)

    // Add user filter if provided (for security)
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get landing page: ${error.message}`)
    }

    return data
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPageData | null> {
    const supabase = await this.getSupabaseClient()
    
    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to get landing page by slug: ${error.message}`)
    }

    return data
  }

  async getUserLandingPages(
    userId: string, 
    options: {
      limit?: number
      offset?: number
      search?: string
      published_only?: boolean
    } = {}
  ): Promise<{ data: LandingPageData[], total: number }> {
    const supabase = await this.getSupabaseClient()
    
    const { limit = 10, offset = 0, search, published_only } = options

    let query = supabase
      .from('landing_pages')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (published_only) {
      query = query.eq('is_published', true)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to get user landing pages: ${error.message}`)
    }

    return {
      data: data || [],
      total: count || 0
    }
  }

  async updateLandingPage(
    id: string, 
    userId: string, 
    updates: LandingPageUpdateInput
  ): Promise<LandingPageData> {
    const supabase = await this.getSupabaseClient()
    
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.description !== undefined) updateData.description = updates.description?.trim() || null
    if (updates.template_id !== undefined) updateData.template_id = updates.template_id
    if (updates.layout_config !== undefined) updateData.layout_config = updates.layout_config
    if (updates.is_published !== undefined) {
      updateData.is_published = updates.is_published
      if (updates.is_published) {
        updateData.published_at = new Date().toISOString()
      }
    }
    if (updates.custom_domain !== undefined) updateData.custom_domain = updates.custom_domain
    if (updates.seo_meta !== undefined) updateData.seo_meta = updates.seo_meta
    if (updates.analytics_config !== undefined) updateData.analytics_config = updates.analytics_config

    const { data, error } = await supabase
      .from('landing_pages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update landing page: ${error.message}`)
    }

    if (!data) {
      throw new Error('Landing page not found or access denied')
    }

    return data
  }

  async deleteLandingPage(id: string, userId: string): Promise<void> {
    const supabase = await this.getSupabaseClient()
    
    const { error } = await supabase
      .from('landing_pages')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete landing page: ${error.message}`)
    }
  }

  async publishLandingPage(id: string, userId: string): Promise<LandingPageData> {
    return this.updateLandingPage(id, userId, { 
      is_published: true 
    })
  }

  async unpublishLandingPage(id: string, userId: string): Promise<LandingPageData> {
    return this.updateLandingPage(id, userId, { 
      is_published: false 
    })
  }

  async duplicateLandingPage(id: string, userId: string, newName?: string): Promise<LandingPageData> {
    const original = await this.getLandingPage(id, userId)
    
    if (!original) {
      throw new Error('Original landing page not found')
    }

    const duplicateData: LandingPageCreateInput = {
      name: newName || `${original.name} (Copy)`,
      description: original.description || undefined,
      template_id: original.template_id || undefined,
      layout_config: original.layout_config,
      seo_meta: original.seo_meta || undefined
    }

    return this.createLandingPage(userId, duplicateData)
  }

  async exportLandingPage(id: string, userId: string): Promise<{
    metadata: Omit<LandingPageData, 'user_id'>
    config: Record<string, any>
  }> {
    const landingPage = await this.getLandingPage(id, userId)
    
    if (!landingPage) {
      throw new Error('Landing page not found')
    }

    return {
      metadata: {
        id: landingPage.id,
        name: landingPage.name,
        slug: landingPage.slug,
        description: landingPage.description,
        template_id: landingPage.template_id,
        is_published: landingPage.is_published,
        custom_domain: landingPage.custom_domain,
        seo_meta: landingPage.seo_meta,
        analytics_config: landingPage.analytics_config,
        published_at: landingPage.published_at,
        layout_config: landingPage.layout_config
      },
      config: landingPage.layout_config
    }
  }

  async importLandingPage(
    userId: string, 
    exportData: {
      metadata: Partial<LandingPageData>
      config: Record<string, any>
    }
  ): Promise<LandingPageData> {
    const createData: LandingPageCreateInput = {
      name: exportData.metadata.name || 'Imported Landing Page',
      description: exportData.metadata.description,
      template_id: exportData.metadata.template_id,
      layout_config: exportData.config,
      seo_meta: exportData.metadata.seo_meta
    }

    return this.createLandingPage(userId, createData)
  }
}

// Utility functions for working with landing page data
export const landingPageUtils = {
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .replace(/^-|-$/g, '')
  },

  validateLayoutConfig(config: any): boolean {
    try {
      return typeof config === 'object' && config !== null
    } catch {
      return false
    }
  },

  extractSeoMeta(config: Record<string, any>): Record<string, any> {
    const seo: Record<string, any> = {}
    
    // Extract common SEO fields from layout config
    if (config.hero?.title) {
      seo.title = config.hero.title
    }
    
    if (config.hero?.subtitle) {
      seo.description = config.hero.subtitle
    }

    return seo
  },

  getPreviewUrl(slug: string, customDomain?: string): string {
    if (customDomain) {
      return `https://${customDomain}`
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return `${baseUrl}/preview/${slug}`
  }
}