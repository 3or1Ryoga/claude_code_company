import fs from 'fs/promises'
import path from 'path'
import * as babelParser from '@babel/parser'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AiFixOptions {
  path: string
  geminiApiKey?: string
  geminiModel?: string
}

export interface ProcessResult {
  filePath: string
  status: 'ok' | 'fixed' | 'failed'
  action: 'none' | 'local' | 'ai'
}

function isCodeFile(filePath: string): boolean {
  return /\.(tsx|ts|jsx|js)$/i.test(filePath)
}

export async function collectFiles(targetPath: string): Promise<string[]> {
  const abs = path.isAbsolute(targetPath) ? targetPath : path.join(process.cwd(), targetPath)
  const stat = await fs.stat(abs)
  if (stat.isFile()) {
    return [abs]
  }
  const out: string[] = []
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(p)
      } else if (isCodeFile(p)) {
        out.push(p)
      }
    }
  }
  await walk(abs)
  return out
}

export function tryParse(code: string, filename: string = 'file.tsx'): boolean {
  try {
    babelParser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
    return true
  } catch {
    return false
  }
}

export function fixUnterminatedJsxAttrStrings(input: string): string {
  const lines = input.split(/\r?\n/)
  const out: string[] = []
  let buffer = ''
  let merging = false
  const hasUnclosedAttrOnLine = (line: string): boolean => line.search(/\w+\s*=\s*"[^"]*$/) >= 0
  
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!merging) {
      if (hasUnclosedAttrOnLine(line)) {
        buffer = line
        merging = true
      } else {
        out.push(line)
      }
    } else {
      buffer += lines[i].trimStart()
      const hasClosing = /"/.test(buffer.replace(/^.*?=\s*"/, ''))
      if (hasClosing) {
        out.push(buffer)
        buffer = ''
        merging = false
      }
    }
  }
  if (merging && buffer) out.push(buffer + '"')
  let result = out.join('\n')
  result = result.replace(/(<[^>]*\b\w+=\s*"[^"\n]*)$/gm, '$1"')
  return result
}

export async function aiFix(
  code: string,
  filePath: string,
  apiKey: string,
  modelId: string = 'gemini-1.5-flash'
): Promise<string | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId })
    const prompt = `You are a senior TypeScript/React/Next.js engineer.
Given the following file, fix syntax/parse errors (e.g. unterminated string constants, JSX attribute strings split across lines) and return the FULL corrected file content.
Rules:
- Keep the code structure and functionality.
- Do not add markdown fences. Return only the code.
- Ensure it parses with @babel/parser (typescript+jsx) and builds in Next.js.

FILE PATH: ${filePath}
------
${code}
------`
    
    const result = await model.generateContent(prompt)
    let text = result?.response?.text?.() || ''
    text = text.replace(/^```(?:[a-zA-Z]+)?\n?/, '').replace(/\n?```$/, '').trim()
    return text || null
  } catch {
    return null
  }
}

export async function processFile(
  filePath: string,
  geminiApiKey?: string,
  geminiModel?: string
): Promise<ProcessResult> {
  const original = await fs.readFile(filePath, 'utf8')
  if (tryParse(original, filePath)) {
    return { filePath, status: 'ok', action: 'none' }
  }
  
  const locallyFixed = fixUnterminatedJsxAttrStrings(original)
  if (locallyFixed !== original && tryParse(locallyFixed, filePath)) {
    await fs.writeFile(filePath, locallyFixed, 'utf8')
    return { filePath, status: 'fixed', action: 'local' }
  }
  
  if (geminiApiKey) {
    const aiFixed = await aiFix(original, filePath, geminiApiKey, geminiModel)
    if (aiFixed && tryParse(aiFixed, filePath)) {
      await fs.writeFile(filePath, aiFixed, 'utf8')
      return { filePath, status: 'fixed', action: 'ai' }
    }
  }
  
  return { filePath, status: 'failed', action: 'none' }
}

export async function fixCodeFiles(options: AiFixOptions): Promise<ProcessResult[]> {
  const { path: targetPath, geminiApiKey, geminiModel } = options
  
  if (!targetPath) {
    throw new Error('パスを指定してください')
  }
  
  const files = await collectFiles(targetPath)
  if (files.length === 0) {
    throw new Error('対象ファイルが見つかりませんでした (.ts/.tsx/.js/.jsx)')
  }
  
  console.log(`対象ファイル数: ${files.length}`)
  const results: ProcessResult[] = []
  
  for (const file of files) {
    const r = await processFile(file, geminiApiKey, geminiModel)
    console.log(`${r.status === 'fixed' ? '✅' : r.status === 'ok' ? '✔︎' : '❌'} ${r.filePath} (${r.action})`)
    results.push(r)
  }
  
  const failed = results.filter((r) => r.status === 'failed')
  if (failed.length > 0) {
    console.error(`\n修復に失敗したファイル: ${failed.length}`)
    throw new Error('Some files could not be fixed')
  }
  
  return results
}