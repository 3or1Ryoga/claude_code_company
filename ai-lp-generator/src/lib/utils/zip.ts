import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { Readable } from 'stream'

export interface ZipProjectOptions {
  projectPath: string
  projectName: string
}

export async function zipProject(options: ZipProjectOptions): Promise<Buffer> {
  const { projectPath, projectName } = options

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const archive = archiver('zip', {
      zlib: { level: 9 }
    })

    archive.on('error', (err) => {
      reject(err)
    })

    archive.on('data', (chunk) => {
      chunks.push(chunk)
    })

    archive.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })

    archive.directory(projectPath, projectName)

    archive.finalize()
  })
}

export async function zipProjectToStream(options: ZipProjectOptions): Promise<Readable> {
  const { projectPath, projectName } = options

  const archive = archiver('zip', {
    zlib: { level: 9 }
  })

  archive.on('error', (err) => {
    console.error('Archive error:', err)
    throw err
  })

  archive.directory(projectPath, projectName)

  archive.finalize()

  return archive
}

export async function createProjectZip(projectPath: string): Promise<Buffer> {
  if (!fs.existsSync(projectPath)) {
    throw new Error(`Project path does not exist: ${projectPath}`)
  }

  const stats = fs.statSync(projectPath)
  if (!stats.isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectPath}`)
  }

  const projectName = path.basename(projectPath)
  
  return zipProject({
    projectPath,
    projectName
  })
}

export function getZipFileName(projectName: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const sanitizedName = projectName.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
  return `${sanitizedName}-${timestamp}.zip`
}