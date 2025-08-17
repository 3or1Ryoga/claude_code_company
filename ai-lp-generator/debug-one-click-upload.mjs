#!/usr/bin/env node

/**
 * 🚀 One-Click Debug Upload Tool
 * 
 * Functionality:
 * 1. Upload existing concept files to Supabase
 * 2. Generate minimal test concepts
 * 3. Test API endpoints
 * 4. Verify database connectivity
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration (replace with your actual values)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Test data templates
const MINIMAL_CONCEPT = {
  siteName: 'テストLP',
  brief: 'デバッグ用の最小限コンセプト',
  problem: 'テスト問題',
  affinity: 'テスト共感',
  solution: 'テスト解決策',
  offer: 'テスト提案',
  narrowingDown: 'テスト絞り込み',
  action: 'テスト行動',
  primary: '#0EA5E9',
  accent: '#9333EA',
  background: '#0B1221',
  nav: 'ホーム,サービス,お問い合わせ',
  logoText: 'テストロゴ',
  x: '',
  linkedin: '',
  github: '',
  email: 'test@example.com',
  url: 'https://example.com'
}

const COMPLEX_CONCEPT = {
  siteName: 'AIパワードマーケティングソリューション',
  brief: 'AI技術を活用したマーケティング自動化プラットフォーム',
  problem: '従来のマーケティングは手動作業が多く、効果測定が困難で、パーソナライゼーションが限定的です。',
  affinity: 'マーケティング担当者なら、毎日の繰り返し作業や効果の見えない施策に疲れを感じているはずです。',
  solution: 'AI技術により、マーケティング活動を完全自動化し、リアルタイムで効果を可視化します。',
  offer: '30日間無料トライアル + 専門コンサルタントによる無料設定サポート',
  narrowingDown: '中小企業のマーケティング担当者、月間広告費50万円以上の企業様',
  action: '今すぐ無料トライアルを開始して、マーケティングの未来を体験してください',
  primary: '#0EA5E9',
  accent: '#9333EA',
  background: '#0B1221',
  nav: 'ホーム,機能,価格,事例,お問い合わせ',
  logoText: 'AI Marketing Pro',
  x: 'https://x.com/aimarketingpro',
  linkedin: 'https://linkedin.com/company/aimarketingpro',
  github: 'https://github.com/aimarketingpro',
  email: 'info@aimarketingpro.com',
  url: 'https://aimarketingpro.com'
}

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
  console.log(`${emoji} [${timestamp}] ${message}`)
}

function generateMarkdown(concept) {
  return `# ${concept.siteName}

## 概要
${concept.brief}

## PASONA Framework

### Problem (問題)
${concept.problem}

### Affinity (親近感)
${concept.affinity}

### Solution (解決策)
${concept.solution}

### Offer (提案)
${concept.offer}

### Narrowing Down (絞り込み)
${concept.narrowingDown}

### Action (行動)
${concept.action}

## デザイン設定

### カラーパレット
- Primary: ${concept.primary}
- Accent: ${concept.accent}
- Background: ${concept.background}

### ナビゲーション
${concept.nav}

### ブランディング
- Logo Text: ${concept.logoText}

### コンタクト情報
- Email: ${concept.email}
- Website: ${concept.url}

### ソーシャルメディア
- X: ${concept.x}
- LinkedIn: ${concept.linkedin}
- GitHub: ${concept.github}

---
Generated at: ${new Date().toISOString()}
`
}

async function testAPIEndpoint(endpoint, method, data = null) {
  try {
    log(`Testing ${method} ${endpoint}...`)
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    }
    
    if (data) {
      options.body = JSON.stringify(data)
    }
    
    const response = await fetch(`http://localhost:3000${endpoint}`, options)
    const responseData = await response.text()
    
    if (response.ok) {
      log(`✅ ${method} ${endpoint} - Success (${response.status})`, 'success')
      try {
        const json = JSON.parse(responseData)
        console.log('Response:', JSON.stringify(json, null, 2))
      } catch {
        console.log('Response:', responseData)
      }
      return true
    } else {
      log(`❌ ${method} ${endpoint} - Failed (${response.status})`, 'error')
      console.log('Error response:', responseData)
      return false
    }
  } catch (error) {
    log(`❌ ${method} ${endpoint} - Network error: ${error.message}`, 'error')
    return false
  }
}

async function uploadExistingConcepts() {
  log('🔍 Scanning for existing concept files...')
  
  const conceptsDir = path.join(__dirname, 'concepts')
  if (!fs.existsSync(conceptsDir)) {
    log('No concepts directory found', 'warning')
    return []
  }
  
  const files = fs.readdirSync(conceptsDir).filter(file => file.endsWith('.md'))
  log(`Found ${files.length} concept files`)
  
  const uploaded = []
  
  for (const file of files) {
    try {
      const filePath = path.join(conceptsDir, file)
      const content = fs.readFileSync(filePath, 'utf-8')
      const siteName = path.basename(file, '.md')
      
      log(`📤 Uploading ${file}...`)
      
      const success = await testAPIEndpoint('/api/concepts', 'POST', {
        siteName,
        brief: `Existing concept from ${file}`,
        problem: 'Existing content',
        affinity: 'Existing content',
        solution: 'Existing content',
        offer: 'Existing content',
        narrowingDown: 'Existing content',
        action: 'Existing content',
        primary: '#0EA5E9',
        accent: '#9333EA',
        background: '#0B1221',
        nav: 'ホーム,サービス,お問い合わせ',
        logoText: siteName,
        x: '',
        linkedin: '',
        github: '',
        email: 'test@example.com',
        url: 'https://example.com'
      })
      
      if (success) {
        uploaded.push(file)
        log(`✅ Successfully uploaded ${file}`, 'success')
      }
    } catch (error) {
      log(`❌ Failed to upload ${file}: ${error.message}`, 'error')
    }
  }
  
  return uploaded
}

async function generateTestConcepts() {
  log('🧪 Generating test concepts...')
  
  const concepts = [
    { ...MINIMAL_CONCEPT, siteName: `minimal-test-${Date.now()}` },
    { ...COMPLEX_CONCEPT, siteName: `complex-test-${Date.now()}` }
  ]
  
  const results = []
  
  for (const concept of concepts) {
    try {
      log(`📝 Creating concept: ${concept.siteName}`)
      
      const success = await testAPIEndpoint('/api/concepts', 'POST', concept)
      
      if (success) {
        results.push(concept)
        
        // Also save to local file
        const markdown = generateMarkdown(concept)
        const fileName = `${concept.siteName}-${Date.now()}.md`
        const filePath = path.join(__dirname, 'concepts', fileName)
        
        // Ensure concepts directory exists
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        fs.writeFileSync(filePath, markdown)
        
        log(`✅ Concept created and saved to ${fileName}`, 'success')
      }
    } catch (error) {
      log(`❌ Failed to create concept ${concept.siteName}: ${error.message}`, 'error')
    }
  }
  
  return results
}

async function runDiagnostics() {
  log('🔧 Running system diagnostics...')
  
  // Test API endpoints
  const endpoints = [
    { endpoint: '/api/concepts', method: 'GET' },
    { endpoint: '/api/concepts', method: 'POST', data: MINIMAL_CONCEPT }
  ]
  
  for (const test of endpoints) {
    await testAPIEndpoint(test.endpoint, test.method, test.data)
  }
  
  // Test Supabase connection
  try {
    log('🗄️ Testing Supabase connection...')
    const { data, error } = await supabase.from('concepts').select('count').limit(1)
    
    if (error) {
      log(`❌ Supabase connection failed: ${error.message}`, 'error')
    } else {
      log('✅ Supabase connection successful', 'success')
    }
  } catch (error) {
    log(`❌ Supabase test failed: ${error.message}`, 'error')
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  
  console.log('🚀 One-Click Debug Upload Tool')
  console.log('===============================')
  
  switch (command) {
    case 'upload':
      await uploadExistingConcepts()
      break
      
    case 'generate':
      await generateTestConcepts()
      break
      
    case 'test':
      await runDiagnostics()
      break
      
    case 'all':
      await runDiagnostics()
      await uploadExistingConcepts()
      await generateTestConcepts()
      break
      
    default:
      console.log('Usage:')
      console.log('  node debug-one-click-upload.mjs upload    # Upload existing concept files')
      console.log('  node debug-one-click-upload.mjs generate  # Generate test concepts')
      console.log('  node debug-one-click-upload.mjs test      # Run diagnostics')
      console.log('  node debug-one-click-upload.mjs all       # Run all operations')
      break
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error')
  console.error(error)
  process.exit(1)
})