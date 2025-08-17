#!/usr/bin/env node

/**
 * 🌐 実際のAPIエンドポイントテストスクリプト
 * Purpose: /api/generate エンドポイントを直接テストしてプロジェクト保存機能を確認
 */

// Node.js 18+ has built-in fetch
// import fetch from 'node-fetch'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.join(__dirname, '.env.local') })

// 設定
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const API_ENDPOINT = `${BASE_URL}/api/generate`

async function testApiEndpoint() {
  console.log('🌐 API エンドポイント テスト開始')
  console.log('=' .repeat(50))
  console.log('API URL:', API_ENDPOINT)
  
  try {
    // 1. Web モード テスト（コード生成のみ）
    console.log('\n1️⃣ Web モード テスト（コード生成のみ）...')
    
    const webModePayload = {
      concept: 'テスト用LPサイト',
      description: 'エンドツーエンドテスト用のランディングページ',
      saveProject: false,
      useCliMode: false
    }
    
    const webResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webModePayload)
    })
    
    const webResult = await webResponse.json()
    
    if (webResponse.ok) {
      console.log('   ✅ Web モード成功')
      console.log('      - コード生成:', webResult.code ? '成功' : '失敗')
      console.log('      - 依存関係:', webResult.dependencies?.length || 0, '個')
    } else {
      console.log('   ❌ Web モード失敗')
      console.log('      - エラー:', webResult.error)
      console.log('      - ステータス:', webResponse.status)
    }
    
    // 2. CLI モード テスト（認証なし - エラーが期待される）
    console.log('\n2️⃣ CLI モード テスト（認証なし）...')
    
    const cliModePayload = {
      concept: 'テスト用プロジェクト',
      name: 'test-project-' + Date.now(),
      description: 'CLIモードテスト',
      useCliMode: true,
      skipAiFix: true
    }
    
    const cliResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cliModePayload)
    })
    
    const cliResult = await cliResponse.json()
    
    if (cliResponse.status === 401) {
      console.log('   ✅ CLI モード認証エラー（期待通り）')
      console.log('      - エラー:', cliResult.error)
    } else if (cliResponse.ok) {
      console.log('   ✅ CLI モード成功（認証済みの場合）')
      console.log('      - プロジェクト:', cliResult.project?.siteName)
      console.log('      - アーカイブ:', cliResult.archive?.path)
      console.log('      - プロジェクトID:', cliResult.projectId)
    } else {
      console.log('   ❌ CLI モード予期しないエラー')
      console.log('      - エラー:', cliResult.error)
      console.log('      - ステータス:', cliResponse.status)
    }
    
    // 3. 設定確認
    console.log('\n3️⃣ 必要な環境変数確認...')
    
    const requiredEnvVars = [
      'V0_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length === 0) {
      console.log('   ✅ 必要な環境変数すべて設定済み')
    } else {
      console.log('   ❌ 不足している環境変数:')
      missingVars.forEach(varName => {
        console.log('      -', varName)
      })
    }
    
    // 4. 開発サーバー確認
    console.log('\n4️⃣ 開発サーバー確認...')
    
    try {
      const healthResponse = await fetch(BASE_URL, {
        method: 'GET',
        timeout: 5000
      })
      
      if (healthResponse.ok) {
        console.log('   ✅ 開発サーバー稼働中')
        console.log('      - URL:', BASE_URL)
      } else {
        console.log('   ⚠️ 開発サーバーの応答が異常')
        console.log('      - ステータス:', healthResponse.status)
      }
    } catch (error) {
      console.log('   ❌ 開発サーバーに接続できません')
      console.log('      - エラー:', error.message)
      console.log('   📋 対処法:')
      console.log('      1. npm run dev を実行してサーバーを起動')
      console.log('      2. http://localhost:3000 にアクセスできることを確認')
    }
    
    console.log('\n📋 実際のブラウザテスト手順:')
    console.log('   1. npm run dev でサーバー起動')
    console.log('   2. http://localhost:3000/create にアクセス')
    console.log('   3. LP生成フォームでテスト')
    console.log('   4. 生成されたプロジェクトのダウンロードを確認')
    
    return true
    
  } catch (error) {
    console.error('❌ API テストエラー:', error)
    return false
  }
}

// メイン実行
testApiEndpoint()
  .then(success => {
    console.log('\n' + '=' .repeat(50))
    if (success) {
      console.log('✅ API エンドポイントテスト完了')
    } else {
      console.log('❌ API エンドポイントテスト失敗')
    }
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })