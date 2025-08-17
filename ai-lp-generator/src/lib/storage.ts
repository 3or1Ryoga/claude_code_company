/**
 * Supabase Storage Operations for Project Archives
 */

import { getAdminStorage, createAdminSignedUrl, ensureBucketExists } from './supabase-admin'
import { zipDirectoryToBuffer, type ZipResult } from './zip'

const BUCKET_NAME = 'project-archives'

export interface UploadResult {
  path: string
  size: number
  checksum: string
  signedUrl: string
}

/**
 * Uploads project archive to Supabase Storage
 */
export async function uploadProjectArchive({
  userId,
  projectId,
  version = 1,
  directoryPath
}: {
  userId: string
  projectId: string
  version?: number
  directoryPath: string
}): Promise<UploadResult> {
  
  console.log('🔍 STORAGE DEBUG: Starting upload process...', {
    userId,
    projectId,
    version,
    directoryPath,
    bucketName: BUCKET_NAME
  })
  
  // Ensure bucket exists
  console.log('🔍 STORAGE DEBUG: Ensuring bucket exists...')
  await ensureBucketExists(BUCKET_NAME, false)
  
  // Create ZIP
  console.log('🔍 STORAGE DEBUG: Creating ZIP from directory...')
  const { buffer, size, checksum } = await zipDirectoryToBuffer(directoryPath)
  console.log('🔍 STORAGE DEBUG: ZIP created successfully:', {
    size,
    checksum: checksum.substring(0, 16) + '...'
  })
  
  // Generate storage path
  const storagePath = `${userId}/${projectId}/v${version}.zip`
  console.log('🔍 STORAGE DEBUG: Generated storage path:', storagePath)
  
  // Upload to storage
  console.log('🔍 STORAGE DEBUG: Starting upload to bucket...')
  const storage = getAdminStorage()
  const { data: uploadData, error } = await storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: 'application/zip',
      cacheControl: '3600',
      upsert: true
    })
  
  if (error) {
    console.error('🔍 STORAGE DEBUG: Upload failed:', error)
    throw error
  }
  
  console.log('🔍 STORAGE DEBUG: Upload successful:', uploadData)
  
  // Create signed URL
  const { signedUrl } = await createAdminSignedUrl(BUCKET_NAME, storagePath, 600)
  
  return {
    path: storagePath,
    size,
    checksum,
    signedUrl
  }
}

/**
 * Creates a new signed URL for existing archive
 */
export async function createArchiveDownloadUrl(
  storagePath: string, 
  expiresIn = 600
): Promise<string> {
  const { signedUrl } = await createAdminSignedUrl(BUCKET_NAME, storagePath, expiresIn)
  return signedUrl
}

/**
 * Deletes an archive from storage
 */
export async function deleteProjectArchive(storagePath: string): Promise<void> {
  const storage = getAdminStorage()
  const { error } = await storage.from(BUCKET_NAME).remove([storagePath])
  if (error) throw error
}
