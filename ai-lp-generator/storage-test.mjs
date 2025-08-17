#!/usr/bin/env node

/**
 * 🧪 Supabase Storage 動作テストスクリプト
 * Purpose: project-archivesバケットの作成確認・RLS動作確認
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 環境変数が不足しています')
  console.error('必要: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

// Supabaseクライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testStorageSetup() {
  console.log('🧪 Supabase Storage 動作テスト開始')
  console.log('=' * 50)

  try {
    // 1. バケット一覧取得
    console.log('1️⃣ バケット一覧確認...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ バケット取得エラー:', bucketsError)
      return false
    }

    const projectArchivesBucket = buckets?.find(bucket => bucket.name === 'project-archives')
    
    if (projectArchivesBucket) {
      console.log('✅ project-archivesバケット存在確認')
      console.log(`   - Public: ${projectArchivesBucket.public}`)
      console.log(`   - Created: ${projectArchivesBucket.created_at}`)
    } else {
      console.log('⚠️ project-archivesバケットが見つかりません')
      console.log('利用可能バケット:', buckets?.map(b => b.name).join(', '))
      return false
    }

    // 2. テストファイル作成
    console.log('\n2️⃣ テストファイル作成...')
    const testContent = 'This is a test file for Supabase Storage'
    const testFileName = 'test-file.txt'
    const testFilePath = path.join(__dirname, testFileName)
    
    fs.writeFileSync(testFilePath, testContent)
    console.log(`✅ テストファイル作成: ${testFilePath}`)

    // 3. ファイルアップロードテスト（認証なし - 失敗が期待される）
    console.log('\n3️⃣ 未認証アップロードテスト（失敗が期待される）...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-archives')
      .upload('test/test-file.txt', fs.readFileSync(testFilePath))

    if (uploadError) {
      console.log('✅ 期待通り認証エラー:', uploadError.message)
    } else {
      console.log('⚠️ 認証なしでアップロード成功（RLS設定要確認）')
    }

    // 4. バケットポリシー確認（可能な範囲で）
    console.log('\n4️⃣ バケット詳細確認...')
    const { data: bucketData, error: bucketError } = await supabase.storage
      .from('project-archives')
      .list('', { limit: 1 })

    if (bucketError) {
      if (bucketError.message.includes('access')) {
        console.log('✅ 適切にアクセス制御されています:', bucketError.message)
      } else {
        console.log('⚠️ 予期しないエラー:', bucketError.message)
      }
    }

    // 5. テストファイル削除
    console.log('\n5️⃣ テストファイル削除...')
    fs.unlinkSync(testFilePath)
    console.log('✅ テストファイル削除完了')

    console.log('\n🎉 Storage設定基本テスト完了')
    console.log('\n📋 次のステップ:')
    console.log('   1. Supabase Dashboardでproject-archivesバケット確認')
    console.log('   2. RLSポリシー設定確認')
    console.log('   3. 認証ユーザーでのアップロードテスト')

    return true

  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
    return false
  }
}

// メイン実行
testStorageSetup()
  .then(success => {
    if (success) {
      console.log('\n✅ テスト正常終了')
      process.exit(0)
    } else {
      console.log('\n❌ テスト失敗')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })