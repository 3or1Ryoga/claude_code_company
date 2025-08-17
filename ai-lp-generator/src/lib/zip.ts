/**
 * ZIP Utility Functions for Project Archiving
 */

import archiver from 'archiver'
import { createHash } from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export interface ZipResult {
  buffer: Buffer
  size: number
  checksum: string
}

/**
 * Creates a ZIP archive from a directory, excluding unnecessary files
 */
export async function zipDirectoryToBuffer(directoryPath: string): Promise<ZipResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const buffers: Buffer[] = []

      archive.on('data', (chunk) => {
        buffers.push(chunk)
      })

      archive.on('end', () => {
        const buffer = Buffer.concat(buffers)
        const size = buffer.length
        const checksum = createHash('sha256').update(buffer).digest('hex')
        
        console.log('🔍 ZIP DEBUG: Final archive size:', size, 'bytes')
        resolve({ buffer, size, checksum })
      })

      archive.on('error', reject)

      // Add directory contents to archive, excluding heavy files
      archive.directory(directoryPath, false, (data) => {
        const fileName = data.name
        const filePath = data.prefix ? `${data.prefix}/${fileName}` : fileName
        
        // Exclude heavy/unnecessary files and directories
        const excludePatterns = [
          'node_modules',
          '.next',
          '.git', 
          '.DS_Store',
          '*.log',
          '*.tmp',
          'coverage',
          'dist',
          'build',
          '.cache',
          '.turbo',
          '.vercel',
          'package-lock.json', // This file can be very large
          'yarn.lock',
          'pnpm-lock.yaml'
        ]
        
        // Check if file should be excluded
        for (const pattern of excludePatterns) {
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace('*', '.*'))
            if (regex.test(fileName) || regex.test(filePath)) {
              console.log('🚫 Excluding from ZIP:', filePath)
              return false
            }
          } else {
            if (fileName === pattern || filePath.includes(pattern)) {
              console.log('🚫 Excluding from ZIP:', filePath)
              return false
            }
          }
        }
        
        console.log('✅ Including in ZIP:', filePath)
        return data
      })
      
      await archive.finalize()
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Validates if directory exists and is readable
 */
export async function validateDirectory(directoryPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(directoryPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

/**
 * Gets directory size recursively
 */
export async function getDirectorySize(directoryPath: string): Promise<number> {
  let totalSize = 0
  
  const items = await fs.readdir(directoryPath, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(directoryPath, item.name)
    
    if (item.isDirectory()) {
      totalSize += await getDirectorySize(fullPath)
    } else {
      const stats = await fs.stat(fullPath)
      totalSize += stats.size
    }
  }
  
  return totalSize
}
