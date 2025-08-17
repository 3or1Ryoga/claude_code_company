import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'

let GoogleGenerativeAI: any

function ensureEnvLoaded() {
  if (!process.env.GEMINI_API_KEY) {
    dotenv.config({ path: path.join(process.cwd(), '.env.local') })
  }
}

export function sanitizeForFolderName(input: string): string {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'project'
}

export function generateTimestamp(): string {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
}

export interface ConceptParams {
  siteName: string
  brief?: string
  problem?: string
  affinity?: string
  solution?: string
  offer?: string
  narrowingDown?: string
  action?: string
  colors: { primary: string; accent: string; background: string }
  nav: string[]
  logoText?: string
  socials: { x?: string; linkedin?: string; github?: string }
  contact: { email?: string; url?: string }
}

export function buildMarkdown(params: ConceptParams): string {
  const {
    siteName, problem, affinity, solution, offer, narrowingDown, action,
    colors, nav, logoText, socials, contact,
  } = params

  return (
    `# ${siteName}

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
${(nav || []).map((item) => `- ${item}`).join('\n')}

## Persistent: LogoText
${logoText || ''}

## Persistent: SocialLinks
- X: ${socials?.x || ''}
- LinkedIn: ${socials?.linkedin || ''}
- GitHub: ${socials?.github || ''}

## Persistent: Contact
- Email: ${contact?.email || ''}
- URL: ${contact?.url || ''}
`).trim() + '\n'
}

export async function generateMarkdownWithGemini(params: ConceptParams, brief?: string): Promise<string> {
  ensureEnvLoaded()
  const apiKey = process.env.GEMINI_API_KEY
  try {
    if (!GoogleGenerativeAI) {
      const mod = await import('@google/generative-ai')
      GoogleGenerativeAI = mod.GoogleGenerativeAI
    }
  } catch {
    // ignore; fallback to manual
  }

  if (!apiKey || !GoogleGenerativeAI) {
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
Navigation: ${(params.nav || []).join(', ')}
LogoText: ${params.logoText || ''}
SocialLinks: X=${params.socials?.x || ''}, LinkedIn=${params.socials?.linkedin || ''}, GitHub=${params.socials?.github || ''}
Contact: Email=${params.contact?.email || ''}, URL=${params.contact?.url || ''}

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
    text = text.replace(/^```(?:markdown)?\n?/, '').replace(/\n?```$/, '').trim()
    if (!text) return buildMarkdown(params)
    return text + '\n'
  } catch {
    return buildMarkdown(params)
  }
}

export interface SaveConceptResult {
  filePathAbsolute: string
  filePathRelative: string
  markdown: string
}

export async function saveConceptMarkdown(params: ConceptParams & { markdown?: string }): Promise<SaveConceptResult> {
  if (!params.siteName) {
    throw new Error('サイト名は必須です。')
  }

  const conceptsDir = path.join(process.cwd(), 'concepts')
  await fs.mkdir(conceptsDir, { recursive: true })

  const fileBase = `${sanitizeForFolderName(params.siteName)}-${generateTimestamp()}.md`
  const filePathAbsolute = path.join(conceptsDir, fileBase)
  const filePathRelative = `./concepts/${fileBase}`

  const markdown = params.markdown || await generateMarkdownWithGemini(params, params.brief)
  await fs.writeFile(filePathAbsolute, markdown, 'utf8')

  return { filePathAbsolute, filePathRelative, markdown }
}


