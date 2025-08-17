#!/usr/bin/env node

// 🚀 One-Click Minimal Concept Generator
const concept = {
  siteName: `テスト-${Date.now()}`,
  brief: 'ワンクリックテスト用',
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
  x: '', linkedin: '', github: '',
  email: 'test@example.com',
  url: 'https://example.com'
}

async function test() {
  try {
    console.log('🧪 Testing /api/concepts with minimal data...')
    
    const response = await fetch('http://localhost:3000/api/concepts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(concept)
    })
    
    const data = await response.text()
    
    if (response.ok) {
      console.log('✅ SUCCESS!')
      console.log('Response:', data)
    } else {
      console.log(`❌ FAILED (${response.status})`)
      console.log('Error:', data)
    }
  } catch (error) {
    console.log('❌ Network error:', error.message)
  }
}

test()
