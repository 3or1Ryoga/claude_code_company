import prompts from 'prompts'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import 'dotenv/config'
import dotenv from 'dotenv'

let GoogleGenerativeAI
try {
  // Lazy import to avoid failure if not installed yet
  ;({ GoogleGenerativeAI } = await import('@google/generative-ai'))
} catch {}

function sanitizeForFolderName(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project'
}

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

async function runCommand(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: true, stdio: 'inherit', ...options })
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`))))
  })
}

function buildMarkdown({
  siteName,
  problem,
  affinity,
  solution,
  offer,
  narrowingDown,
  action,
  colors,
  nav,
  logoText,
  socials,
  contact,
}) {
  return `# ${siteName}

## Problem
${problem || ''}

## Affinity
${affinity || ''}

## Solution
${solution || ''}

## Offer
${offer || ''}

## Narrowing Down
${narrowingDown || ''}

## Action
${action || ''}

## Persistent: BrandColors
- Primary: ${colors.primary}
- Accent: ${colors.accent}
- Background: ${colors.background}

## Persistent: Navigation
${nav.map((item) => `- ${item}`).join('\n')}

## Persistent: LogoText
${logoText}

## Persistent: SocialLinks
- X: ${socials.x}
- LinkedIn: ${socials.linkedin}
- GitHub: ${socials.github}

## Persistent: Contact
- Email: ${contact.email}
- URL: ${contact.url}
`.trim() + '\n'
}

async function generateMarkdownWithGemini(params, brief) {
  // Load GEMINI_API_KEY from .env.local if not present
  if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || !GoogleGenerativeAI) {
    // Fallback to manual markdown
    return buildMarkdown(params)
  }

  const modelId = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelId })

  const prompt = `You are an expert conversion copywriter and web UX writer.
Create a Japanese Markdown for a landing page plan following the PASONA framework and including persistent sections.
Use the following inputs to craft concise, high-quality content. Keep headings exactly as specified.

SITE NAME:
${params.siteName}

BRIEF (optional):
${brief || '(none)'}

PASONA INPUT (optional):
Problem: ${params.problem || ''}
Affinity: ${params.affinity || ''}
Solution: ${params.solution || ''}
Offer: ${params.offer || ''}
Narrowing Down: ${params.narrowingDown || ''}
Action: ${params.action || ''}

PERSISTENT SETTINGS:
BrandColors: Primary=${params.colors.primary}, Accent=${params.colors.accent}, Background=${params.colors.background}
Navigation: ${params.nav.join(', ')}
LogoText: ${params.logoText}
SocialLinks: X=${params.socials.x}, LinkedIn=${params.socials.linkedin}, GitHub=${params.socials.github}
Contact: Email=${params.contact.email}, URL=${params.contact.url}

Output strictly in this markdown structure:
# {SITE NAME}
## Problem
...
## Affinity
...
## Solution
...
## Offer
...
## Narrowing Down
...
## Action
...
## Persistent: BrandColors
- Primary: ...
- Accent: ...
- Background: ...
## Persistent: Navigation
- ...
## Persistent: LogoText
...
## Persistent: SocialLinks
- X: ...
- LinkedIn: ...
- GitHub: ...
## Persistent: Contact
- Email: ...
- URL: ...
`

  try {
    const result = await model.generateContent(prompt)
    let text = result?.response?.text?.() || ''
    // Cleanup code fences if any
    text = text.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim()
    if (!text) {
      return buildMarkdown(params)
    }
    return text + '\n'
  } catch {
    return buildMarkdown(params)
  }
}

async function main() {
  console.log('対話を開始します。PASONA と恒久設定を入力してください。')

  const responses = await prompts([
    { type: 'text', name: 'siteName', message: 'サイト名（必須）:' },
    { type: 'text', name: 'brief', message: '概要・補足（任意）:' },
    { type: 'text', name: 'problem', message: 'Problem（問題提起・任意）:' },
    { type: 'text', name: 'affinity', message: 'Affinity（親近感・任意）:' },
    { type: 'text', name: 'solution', message: 'Solution（解決策・任意）:' },
    { type: 'text', name: 'offer', message: 'Offer（提案・任意）:' },
    { type: 'text', name: 'narrowingDown', message: 'Narrowing Down（絞り込み・任意）:' },
    { type: 'text', name: 'action', message: 'Action（行動喚起・任意）:' },
    { type: 'text', name: 'primary', message: 'ブランド色 Primary（例: #0EA5E9）:', initial: '#0EA5E9' },
    { type: 'text', name: 'accent', message: 'ブランド色 Accent（例: #9333EA）:', initial: '#9333EA' },
    { type: 'text', name: 'background', message: '背景色（例: #0B1221）:', initial: '#0B1221' },
    { type: 'text', name: 'nav', message: 'ナビゲーション（カンマ区切り）:', initial: 'Features,Pricing,FAQ,Contact' },
    { type: 'text', name: 'logoText', message: 'ロゴテキスト（任意）:', initial: '' },
    { type: 'text', name: 'x', message: 'X (URL 任意):', initial: '' },
    { type: 'text', name: 'linkedin', message: 'LinkedIn (URL 任意):', initial: '' },
    { type: 'text', name: 'github', message: 'GitHub (URL 任意):', initial: '' },
    { type: 'text', name: 'email', message: 'Contact Email（任意）:', initial: '' },
    { type: 'text', name: 'url', message: 'Contact URL（任意）:', initial: '' },
  ])

  if (!responses.siteName) {
    throw new Error('サイト名は必須です。')
  }

  const params = {
    siteName: responses.siteName.trim(),
    problem: responses.problem?.trim() || '',
    affinity: responses.affinity?.trim() || '',
    solution: responses.solution?.trim() || '',
    offer: responses.offer?.trim() || '',
    narrowingDown: responses.narrowingDown?.trim() || '',
    action: responses.action?.trim() || '',
    colors: {
      primary: responses.primary?.trim() || '#0EA5E9',
      accent: responses.accent?.trim() || '#9333EA',
      background: responses.background?.trim() || '#0B1221',
    },
    nav: (responses.nav || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    logoText: responses.logoText?.trim() || '',
    socials: {
      x: responses.x?.trim() || '',
      linkedin: responses.linkedin?.trim() || '',
      github: responses.github?.trim() || '',
    },
    contact: {
      email: responses.email?.trim() || '',
      url: responses.url?.trim() || '',
    },
  }

  // Build markdown (prefer Gemini if available)
  const md = await generateMarkdownWithGemini(params, responses.brief?.trim() || '')

  // Write to concepts/<name>-<timestamp>.md
  const conceptsDir = path.join(process.cwd(), 'concepts')
  await fs.mkdir(conceptsDir, { recursive: true })
  const fileBase = `${sanitizeForFolderName(params.siteName)}-${generateTimestamp()}.md`
  const filePath = path.join(conceptsDir, fileBase)
  await fs.writeFile(filePath, md, 'utf8')
  console.log(`Markdown を作成しました: ${filePath}`)

  // Auto-run generate (no confirmation)
  const relPath = `./concepts/${fileBase}`
  console.log('\nプロジェクトを生成します...')
  await runCommand('npm', ['run', 'generate', '--', '--name', params.siteName, '--file', relPath])
}

main().catch((err) => {
  console.error('\n❌ コンセプト作成中にエラーが発生しました')
  console.error(err?.message || err)
  process.exit(1)
})


