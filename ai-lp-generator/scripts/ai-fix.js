import fs from 'fs/promises'
import path from 'path'
import 'dotenv/config'
import dotenv from 'dotenv'
import * as babelParser from '@babel/parser'

let GoogleGenerativeAI
try {
  ;({ GoogleGenerativeAI } = await import('@google/generative-ai'))
} catch {}

function parseArgs(argv) {
  const args = { path: '' }
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--path' || token === '-p') {
      args.path = argv[i + 1] || ''
      i += 1
    } else if (!token.startsWith('--') && !args.path) {
      args.path = token
    }
  }
  return args
}

function isCodeFile(filePath) {
  return /\.(tsx|ts|jsx|js)$/i.test(filePath)
}

async function collectFiles(targetPath) {
  const abs = path.isAbsolute(targetPath) ? targetPath : path.join(process.cwd(), targetPath)
  const stat = await fs.stat(abs)
  if (stat.isFile()) {
    return [abs]
  }
  const out = []
  async function walk(dir) {
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

function tryParse(code, filename = 'file.tsx') {
  try {
    babelParser.parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] })
    return true
  } catch {
    return false
  }
}

function fixUnterminatedJsxAttrStrings(input) {
  const lines = input.split(/\r?\n/)
  const out = []
  let buffer = ''
  let merging = false
  const hasUnclosedAttrOnLine = (line) => line.search(/\w+\s*=\s*"[^"]*$/) >= 0
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

async function aiFix(code, filePath) {
  if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !GoogleGenerativeAI) return null

  const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
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
  try {
    const result = await model.generateContent(prompt)
    let text = result?.response?.text?.() || ''
    text = text.replace(/^```(?:[a-zA-Z]+)?\n?/, '').replace(/\n?```$/, '').trim()
    return text || null
  } catch {
    return null
  }
}

async function processFile(filePath) {
  const original = await fs.readFile(filePath, 'utf8')
  if (tryParse(original, filePath)) {
    return { filePath, status: 'ok', action: 'none' }
  }
  // Heuristic local fix first
  const locallyFixed = fixUnterminatedJsxAttrStrings(original)
  if (locallyFixed !== original && tryParse(locallyFixed, filePath)) {
    await fs.writeFile(filePath, locallyFixed, 'utf8')
    return { filePath, status: 'fixed', action: 'local' }
  }
  // AI fix fallback
  const aiFixed = await aiFix(original, filePath)
  if (aiFixed && tryParse(aiFixed, filePath)) {
    await fs.writeFile(filePath, aiFixed, 'utf8')
    return { filePath, status: 'fixed', action: 'ai' }
  }
  return { filePath, status: 'failed', action: 'none' }
}

async function main() {
  const { path: target } = parseArgs(process.argv)
  if (!target) {
    throw new Error('Usage: npm run ai-fix -- --path <file-or-directory>')
  }
  const files = await collectFiles(target)
  if (files.length === 0) {
    throw new Error('No target files found (.ts/.tsx/.js/.jsx)')
  }
  console.log(`対象ファイル数: ${files.length}`)
  const results = []
  for (const file of files) {
    const r = await processFile(file)
    console.log(`${r.status === 'fixed' ? '✅' : r.status === 'ok' ? '✔︎' : '❌'} ${r.filePath} (${r.action})`)
    results.push(r)
  }
  const failed = results.filter((r) => r.status === 'failed')
  if (failed.length > 0) {
    console.error(`\n修復に失敗したファイル: ${failed.length}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('\n❌ ai-fix 実行中にエラーが発生しました')
  console.error(err?.message || err)
  process.exit(1)
})


