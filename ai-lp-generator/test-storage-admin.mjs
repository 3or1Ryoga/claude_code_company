#!/usr/bin/env node

/**
 * 🔍 Supabase Storage Admin テストスクリプト
 * Purpose: Service Role Keyを使用してバケットの状態を確認
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.join(__dirname, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Storage診断テスト開始')
console.log('=' .repeat(50))

// 1. Anon Keyでのテスト
console.log('\n1️⃣ Anonymous Key でのバケット確認:')
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    const { data: buckets, error } = await anonClient.storage.listBuckets()
    
    if (error) {
      console.log('   ❌ エラー:', error.message)
    } else {
      console.log('   ✅ 接続成功')
      console.log('   📂 バケット数:', buckets?.length || 0)
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`      - ${bucket.name} (Public: ${bucket.public})`)
        })
      }
    }
  } catch (e) {
    console.log('   ❌ 例外:', e.message)
  }
} else {
  console.log('   ⚠️ ANON_KEY が設定されていません')
}

// 2. Service Role Keyでのテスト
console.log('\n2️⃣ Service Role Key でのバケット確認:')
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  try {
    const { data: buckets, error } = await adminClient.storage.listBuckets()
    
    if (error) {
      console.log('   ❌ エラー:', error.message)
    } else {
      console.log('   ✅ 接続成功')
      console.log('   📂 バケット数:', buckets?.length || 0)
      if (buckets && buckets.length > 0) {
        buckets.forEach(bucket => {
          console.log(`      - ${bucket.name} (Public: ${bucket.public}, Created: ${bucket.created_at})`)
        })
        
        // project-archivesバケットを探す
        const projectArchivesBucket = buckets.find(b => b.name === 'project-archives')
        if (projectArchivesBucket) {
          console.log('\n   🎯 project-archives バケット詳細:')
          console.log('      - ID:', projectArchivesBucket.id)
          console.log('      - Name:', projectArchivesBucket.name)
          console.log('      - Public:', projectArchivesBucket.public)
          console.log('      - Created:', projectArchivesBucket.created_at)
        } else {
          console.log('\n   ⚠️ project-archives バケットが見つかりません')
          
          // バケット作成を試みる
          console.log('\n3️⃣ バケット作成を試みます...')
          const { data: newBucket, error: createError } = await adminClient.storage.createBucket('project-archives', {
            public: false,
            allowedMimeTypes: ['application/zip', 'application/x-zip-compressed'],
            fileSizeLimit: 52428800 // 50MB
          })
          
          if (createError) {
            console.log('   ❌ バケット作成エラー:', createError.message)
          } else {
            console.log('   ✅ バケット作成成功!')
            console.log('      - Name:', newBucket.name)
          }
        }
      } else {
        console.log('   ⚠️ バケットが1つも存在しません')
        
        // バケット作成を試みる
        console.log('\n3️⃣ project-archives バケットを作成します...')
        const { data: newBucket, error: createError } = await adminClient.storage.createBucket('project-archives', {
          public: false,
          allowedMimeTypes: ['application/zip', 'application/x-zip-compressed'],
          fileSizeLimit: 52428800 // 50MB
        })
        
        if (createError) {
          console.log('   ❌ バケット作成エラー:', createError.message)
        } else {
          console.log('   ✅ バケット作成成功!')
          console.log('      - Name:', newBucket.name)
        }
      }
    }
  } catch (e) {
    console.log('   ❌ 例外:', e.message)
  }
} else {
  console.log('   ⚠️ SERVICE_ROLE_KEY が設定されていません')
  console.log('   📋 .env.local に SUPABASE_SERVICE_ROLE_KEY を追加してください')
}

// 3. RLS設定の確認
console.log('\n4️⃣ プロジェクトテーブルのRLS設定確認:')
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  // 認証なしでprojectsテーブルにアクセス
  const { data, error } = await anonClient
    .from('projects')
    .select('id')
    .limit(1)
  
  if (error) {
    if (error.message.includes('policy') || error.message.includes('RLS')) {
      console.log('   ✅ RLS が有効（認証なしアクセス拒否）')
    } else {
      console.log('   ⚠️ エラー:', error.message)
    }
  } else {
    console.log('   ⚠️ RLS が無効または不適切（認証なしアクセス成功）')
    console.log('   📋 対処法:')
    console.log('      1. Supabase Dashboard → Table Editor → projects')
    console.log('      2. RLS を有効化')
    console.log('      3. 適切なポリシーを設定')
  }
}

console.log('\n' + '=' .repeat(50))
console.log('診断完了')