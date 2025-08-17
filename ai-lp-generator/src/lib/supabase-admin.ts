/**
 * Supabase Admin Client for Server-Side Operations
 * Uses SERVICE_ROLE_KEY for full database and storage access
 * ⚠️ WARNING: Only use on server-side (API routes)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Cache admin client to avoid recreating
let adminClient: SupabaseClient | null = null

/**
 * Creates a Supabase admin client with service role privileges
 * This client bypasses RLS and has full access to all data
 */
export function createAdminSupabaseClient(): SupabaseClient {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('🔍 Supabase Admin Client Setup:')
  console.log('   URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING')
  console.log('   Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'MISSING')

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase SERVICE_ROLE_KEY configuration')
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  return adminClient
}

export function getAdminStorage() {
  return createAdminSupabaseClient().storage
}

export async function createAdminSignedUrl(bucket: string, path: string, expiresIn = 600) {
  const { data, error } = await getAdminStorage().from(bucket).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data
}

export async function ensureBucketExists(bucketName: string, isPublic = false) {
  const storage = getAdminStorage()
  const { data: buckets } = await storage.listBuckets()
  
  if (!buckets?.some(bucket => bucket.name === bucketName)) {
    await storage.createBucket(bucketName, { public: isPublic })
  }
}
