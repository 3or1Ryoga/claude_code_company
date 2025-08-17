import { spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { generateText } from 'ai'
import { vercel } from '@ai-sdk/vercel'
import 'dotenv/config'
import dotenv from 'dotenv'
import * as babelParser from '@babel/parser'

function generateTimestamp() {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
}

function extractDependencies(code) {
  const dependencyRegex = /from\s+['"]((?![\.\/@])[^'\"]+)['"]/g
  const dependencies = new Set()
  const nodeBuiltins = new Set([
    'assert','async_hooks','buffer','child_process','cluster','console','constants','crypto',
    'dgram','diagnostics_channel','dns','domain','events','fs','fs/promises','http','http2',
    'https','inspector','module','net','os','path','perf_hooks','process','punycode','querystring',
    'readline','repl','stream','stream/promises','string_decoder','sys','timers','timers/promises',
    'tls','trace_events','tty','url','util','v8','vm','worker_threads','zlib'
  ])
  let match
  while ((match = dependencyRegex.exec(code)) !== null) {
    const pkg = match[1]
    if (pkg !== 'react' && !pkg.startsWith('next/') && !nodeBuiltins.has(pkg)) {
      dependencies.add(pkg)
    }
  }
  return Array.from(dependencies)
}

function parseArgs(argv) {
  const args = { start: false, concept: '', name: '', file: '', skipAiFix: false }
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--start') {
      args.start = true
    } else if (token === '--skip-ai-fix') {
      args.skipAiFix = true
    } else if (token === '--name') {
      args.name = argv[i + 1] || ''
      i += 1
    } else if (token === '--file') {
      args.file = argv[i + 1] || ''
      i += 1
    } else if (!token.startsWith('--') && !args.concept) {
      args.concept = token
    }
  }
  return args
}

function sanitizeForFolderName(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project'
}

function extractTitleFromMarkdown(md) {
  const m = md.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : ''
}

function tryParseTsxOrThrow(code) {
  babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    errorRecovery: false,
  })
}

function fixUnterminatedJsxAttrStrings(input) {
  const lines = input.split(/\r?\n/)
  const out = []
  let buffer = ''
  let merging = false
  let openQuoteCount = 0

  const hasUnclosedAttrOnLine = (line) => {
    // Detect attr like name="... (no closing quote on this line)
    const attrStartIndex = line.search(/\w+\s*=\s*"[^"]*$/)
    if (attrStartIndex >= 0) return true
    return false
  }

  for (let i = 0; i < lines.length; i += 1) {
    let line = lines[i]
    if (!merging) {
      if (hasUnclosedAttrOnLine(line)) {
        buffer = line
        merging = true
        continue
      } else {
        out.push(line)
      }
    } else {
      // merge subsequent lines until a closing quote appears
      buffer += lines[i].trimStart()
      // Count quotes after the attr start to see if closed
      // Simple heuristic: check if there is a closing quote now
      const hasClosing = /"/.test(buffer.replace(/^.*?=\s*"/, ''))
      if (hasClosing) {
        out.push(buffer)
        buffer = ''
        merging = false
      }
    }
  }
  if (merging && buffer) {
    // As a last resort, close the quote
    out.push(buffer + '"')
  }
  let result = out.join('\n')
  // Second pass: add a missing closing quote at EOL for attributes
  result = result.replace(/(<[^>]*\b\w+=\s*"[^"\n]*)$/gm, '$1"')
  return result
}

async function runCommand(command, commandArgs, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { shell: true, stdio: 'inherit', ...options })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))))
  })
}

async function main() {
  const { start, concept, name, file, skipAiFix } = parseArgs(process.argv)

  if (!concept && !name && !file) {
    throw new Error('少なくともコンセプト、--name、--file のいずれかを指定してください。例: npm run generate -- "concept"、または --name "サイト名" --file path/to/instructions.md')
  }

  // .env → 未設定なら .env.local をフォールバック読み込み
  if (!process.env.V0_API_KEY) {
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
  }
  if (!process.env.V0_API_KEY) {
    throw new Error('V0_API_KEY が未設定です。.env または .env.local に V0_API_KEY を設定してください。')
  }

  const outputRoot = path.join(process.cwd(), 'generated_projects')
  await fs.mkdir(outputRoot, { recursive: true })

  // フォルダ名は name > concept > 'project' の優先で決定
  const baseName = sanitizeForFolderName(name || concept || 'project')
  const finalDirName = `${baseName}-${generateTimestamp()}`
  const projectPath = path.join(outputRoot, finalDirName)

  console.log(`[1/4] create-next-app を実行します: ${projectPath}`)
  await runCommand('npx', [
    'create-next-app', projectPath,
    '--ts', '--tailwind', '--eslint', '--src-dir', '--app',
    '--use-npm', '--no-git', '--import-alias', '"@/*"', '--no-turbopack',
  ])
  console.log('✅ Next.js プロジェクトを作成しました')

  console.log('\n[2/4] V0 で LP 用の TSX を生成します...')
  const modelName = process.env.V0_MODEL || 'v0-1.5-md'
  const v0 = vercel(modelName)
  // Markdownの取り込み（--file 指定）
  let mdInstructions = ''
  if (file) {
    const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file)
    try {
      mdInstructions = await fs.readFile(filePath, 'utf8')
    } catch (e) {
      console.warn(`⚠️ 指定されたファイルが読み込めませんでした: ${file} (${e?.message || e})`)
    }
  }
  const titleFromMd = extractTitleFromMarkdown(mdInstructions)
  const siteName = name || titleFromMd || concept || 'My Site'

  // プロンプト: サイト名とMarkdownの詳細指示（PASONA構成前提）を統合
  const prompt = `You are an expert web developer and copywriter.
Create a complete Next.js App Router page (single TSX component) for a landing page using TypeScript and Tailwind CSS.
Follow PASONA framework sections and map appropriately to the layout and content (Hero, Problem, Affinity, Solution, Offer, Narrowing Down, Action, Footer).

SITE NAME (use for <title> and hero headline):
${siteName}

ADDITIONAL INSTRUCTIONS (Markdown, may include PASONA items and persistent sections):
${mdInstructions || '(no extra markdown provided)'}

Requirements:
- Return TSX code only (no markdown block fences, no explanations)
- Modern, responsive, accessible design
- Use Tailwind CSS classes
- Include clear CTA buttons based on Action
- Use the site name in title and main headline
`
  const { text: rawCode } = await generateText({ model: v0, prompt })

  let cleanedCode = rawCode
    .replace(/^```tsx\n?/, '')
    .replace(/^```\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  // クライアント/サーバ専用API検出と対処
  const hasUseClient = /^['"`]use client['"`];?/.test(cleanedCode)
  const clientApiRegex = new RegExp([
    // React Hooks
    "\\buse(State|Effect|Ref|LayoutEffect|Context|Reducer|Memo|Callback|Transition|Optimistic|FormState|FormStatus)\\b",
    // ブラウザ環境API
    "\\bwindow\\b","\\bdocument\\b","\\bnavigator\\b",
    "\\blocalStorage\\b","\\bsessionStorage\\b",
    // 代表的イベント・描画API
    "\\baddEventListener\\b","\\brequestAnimationFrame\\b","\\bmatchMedia\\b",
    // オブザーバ
    "\\bIntersectionObserver\\b","\\bResizeObserver\\b",
    // その他代表例
    "\\bFileReader\\b","\\bImage\\b","\\bHTMLElement\\b","querySelector\\("
  ].join('|'))
  const serverApiRegex = new RegExp([
    // Node組み込みimport
    "from\\s+['\"](fs|path|os|child_process|crypto|http|https|stream|buffer|zlib|util|url|worker_threads)['\"]",
    // プロセス関連
    "\\bprocess\\.(cwd|env)\\b",
    // 旧来メタ
    "__dirname|__filename",
    // Next.js サーバ専用
    "\\b(headers|cookies|revalidate(Path|Tag)|unstable_noStore)\\s*\\("
  ].join('|'))

  const usesClientOnlyApis = clientApiRegex.test(cleanedCode)
  const usesServerOnlyApis = serverApiRegex.test(cleanedCode)

  if (!hasUseClient && usesClientOnlyApis) {
    cleanedCode = `'use client'\n\n` + cleanedCode
  }

  if (usesServerOnlyApis) {
    console.warn('\n⚠️ 警告: クライアントコンポーネントでは使用できないサーバ専用APIが検出されました。')
    console.warn('   - 例: fs/path/process/env/headers()/cookies() など')
    console.warn('   - 対策: サーバ側(Route Handlerやサーバコンポーネント)へ移し、クライアントからはfetchで利用してください。')
  }

  // 自動修復: 未終了の属性値（改行で途切れた className 等）を修正
  let fixedCode = cleanedCode
  try {
    tryParseTsxOrThrow(fixedCode)
  } catch {
    const repaired = fixUnterminatedJsxAttrStrings(fixedCode)
    try {
      tryParseTsxOrThrow(repaired)
      fixedCode = repaired
      console.warn('⚠️ 生成コードの未終了属性を自動修復しました')
    } catch {}
  }

  console.log('✅ コードを生成・クリーンアップ（必要に応じて修復）しました')

  console.log('\n[3/4] 追加依存関係を解析・インストールします...')
  const dependencies = extractDependencies(fixedCode)
  if (dependencies.length > 0) {
    console.log(`  検出: ${dependencies.join(', ')}`)
    await runCommand('npm', ['install', ...dependencies], { cwd: projectPath })
    console.log('✅ 追加依存関係のインストールが完了')
  } else {
    console.log('  追加の外部依存はありません')
  }

  console.log('\n[4/4] 生成コードを書き込みます...')
  const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx')
  await fs.writeFile(pagePath, fixedCode)
  console.log(`✅ 書き込み完了: ${pagePath}`)

  // 生成直後に自動 ai-fix 実行（--skip-ai-fix 指定時はスキップ）
  if (!skipAiFix) {
    const targetPathForFix = path.join(projectPath, 'src')
    console.log('\n[5/5] 生成直後の自動コード修復を実行します (ai-fix)...')
    try {
      await runCommand('npm', ['run', 'ai-fix', '--', '--path', targetPathForFix])
      console.log('✅ ai-fix の実行が完了しました')
    } catch (e) {
      console.warn('⚠️ ai-fix の実行に失敗しました:', e?.message || e)
    }
  } else {
    console.log('\n(スキップ) 自動 ai-fix は --skip-ai-fix 指定により実行しませんでした')
  }

  console.log('\n🎉 完了しました')
  console.log(`プロジェクト: ${projectPath}`)
  console.log(`起動コマンド: cd ${projectPath} && npm run dev`)

  // プロジェクト情報を書き出し
  const info = {
    projectName: finalDirName,
    siteName,
    source: {
      concept: concept || null,
      name: name || null,
      file: file || null
    },
    model: modelName,
    createdAt: new Date().toISOString()
  }
  try {
    await fs.writeFile(path.join(projectPath, 'project-info.json'), JSON.stringify(info, null, 2))
  } catch (e) {
    console.warn('⚠️ project-info.json の書き込みに失敗しました:', e?.message || e)
  }

  if (start) {
    console.log('\n開発サーバーを起動します... (停止は Ctrl+C)')
    await runCommand('npm', ['run', 'dev'], { cwd: projectPath })
  }
}

main().catch((err) => {
  console.error('\n❌ 生成中にエラーが発生しました')
  console.error(err?.message || err)
  process.exit(1)
})


