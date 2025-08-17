import { SupabaseClient } from '@supabase/supabase-js'

export interface UploadOptions {
  bucket: string
  path: string
  file: Buffer | Blob
  contentType?: string
}

export interface StorageResult {
  url: string
  path: string
  bucket: string
}

export class StorageService {
  private supabase: SupabaseClient
  private defaultBucket = 'project-archives'

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  async uploadFile(options: UploadOptions): Promise<StorageResult> {
    const { bucket, path, file, contentType = 'application/zip' } = options

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
      bucket
    }
  }

  async uploadProjectZip(
    userId: string,
    projectName: string,
    zipBuffer: Buffer
  ): Promise<StorageResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
    const fileName = `${sanitizedName}-${timestamp}.zip`
    const path = `${userId}/${fileName}`

    return this.uploadFile({
      bucket: this.defaultBucket,
      path,
      file: zipBuffer,
      contentType: 'application/zip'
    })
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  async listFiles(bucket: string, prefix?: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(prefix)

    if (error) {
      console.error('Storage list error:', error)
      throw new Error(`Failed to list files: ${error.message}`)
    }

    return data
  }

  async createBucketIfNotExists(bucketName: string): Promise<void> {
    const { data: buckets } = await this.supabase.storage.listBuckets()
    
    const bucketExists = buckets?.some(b => b.name === bucketName)
    
    if (!bucketExists) {
      const { error } = await this.supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800
      })

      if (error && !error.message.includes('already exists')) {
        console.error('Bucket creation error:', error)
        throw new Error(`Failed to create bucket: ${error.message}`)
      }
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}