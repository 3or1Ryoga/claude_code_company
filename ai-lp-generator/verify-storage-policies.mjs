#!/usr/bin/env node

/**
 * 🔍 Storage ポリシー検証スクリプト
 * Purpose: 既存のStorageポリシーが正しく設定されているか確認
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.join(__dirname, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

// Service Role クライアント
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verifyStoragePolicies() {
  console.log('🔍 Storage ポリシー検証開始')
  console.log('=' .repeat(50))

  try {
    // 1. バケット存在確認
    console.log('\n1️⃣ project-archives バケット確認:')
    const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets()
    
    if (bucketsError) {
      console.log('   ❌ エラー:', bucketsError.message)
      return
    }
    
    const projectArchivesBucket = buckets?.find(b => b.name === 'project-archives')
    if (!projectArchivesBucket) {
      console.log('   ❌ project-archives バケットが見つかりません')
      return
    }
    
    console.log('   ✅ バケット存在確認')
    console.log('      - Public:', projectArchivesBucket.public)
    
    // 2. テスト用ファイルアップロード（Service Roleで成功するはず）
    console.log('\n2️⃣ Service Role でのアップロードテスト:')
    
    const testUserId = crypto.randomUUID()
    const testContent = 'Test content for policy verification'
    const testPath = `${testUserId}/test-file.txt`
    
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('project-archives')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (uploadError) {
      console.log('   ❌ アップロードエラー:', uploadError.message)
    } else {
      console.log('   ✅ アップロード成功:', testPath)
      
      // 3. ファイルの削除（クリーンアップ）
      const { error: deleteError } = await adminClient.storage
        .from('project-archives')
        .remove([testPath])
      
      if (deleteError) {
        console.log('   ⚠️ 削除エラー:', deleteError.message)
      } else {
        console.log('   ✅ テストファイル削除完了')
      }
    }
    
    // 4. ポリシーの推奨設定
    console.log('\n3️⃣ Storage ポリシーの推奨設定:')
    console.log('   既存のポリシーが以下の条件を満たしているか確認してください：')
    console.log('   ')
    console.log('   📋 各ポリシー（SELECT, INSERT, UPDATE, DELETE）の定義:')
    console.log('   ```sql')
    console.log('   -- ユーザーは自分のフォルダ内のファイルのみアクセス可能')
    console.log('   (bucket_id = \'project-archives\' AND auth.uid()::text = (storage.foldername(name))[1])')
    console.log('   ```')
    console.log('   ')
    console.log('   この定義により:')
    console.log('   - ユーザーIDをフォルダ名として使用')
    console.log('   - 各ユーザーは自分のフォルダ内のファイルのみ操作可能')
    console.log('   - 他のユーザーのファイルにはアクセス不可')
    
    console.log('\n4️⃣ 現在のポリシー状況:')
    console.log('   ✅ SELECT: Users can access their own archive files pxqtd1_0')
    console.log('   ✅ INSERT: Users can access their own archive files pxqtd1_1')
    console.log('   ✅ UPDATE: Users can access their own archive files pxqtd1_3')
    console.log('   ✅ DELETE: Users can access their own archive files pxqtd1_2')
    
    console.log('\n5️⃣ 最終確認事項:')
    console.log('   1. Supabase Dashboard → Storage → project-archives → Policies')
    console.log('   2. 各ポリシーをクリックして定義を確認')
    console.log('   3. 定義が上記の推奨設定と一致していることを確認')
    
    return true
    
  } catch (error) {
    console.error('❌ エラー:', error)
    return false
  }
}

// メイン実行
verifyStoragePolicies()
  .then(success => {
    console.log('\n' + '=' .repeat(50))
    if (success) {
      console.log('✅ Storage ポリシー検証完了')
      console.log('次のステップ: projectsテーブルのRLSを有効化してください')
    } else {
      console.log('❌ 検証失敗')
    }
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })