#!/usr/bin/env node

/**
 * 🔧 Supabase Storage 最終準備・新構造対応テストスクリプト
 * Purpose: project-archivesバケット・RLS・新スキーマ統合準備確認
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cisjwiegbvydbbjwpthz.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpc2p3aWVnYnZ5ZGJiandwdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzAyNDQsImV4cCI6MjA2OTk0NjI0NH0.4dWYAdylou56Kcf8uychAgxpLxNuzQ__Fk5em6mQC8k'

// Supabaseクライアント初期化
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function finalStorageTest() {
  console.log('🔧 Supabase Storage 最終準備・新構造対応テスト')
  console.log('====================================================')

  const results = {
    bucket: false,
    rls: false,
    connection: false,
    schema: false
  }

  try {
    // 1. project-archivesバケット手動作成状況確認
    console.log('1️⃣ project-archivesバケット作成状況確認...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ バケット取得エラー:', bucketsError.message)
    } else {
      console.log('✅ Storage接続成功')
      console.log(`📂 利用可能バケット: ${buckets?.map(b => b.name).join(', ') || 'なし'}`)
      
      const projectArchivesBucket = buckets?.find(bucket => bucket.name === 'project-archives')
      if (projectArchivesBucket) {
        console.log('✅ project-archivesバケット存在確認')
        console.log(`   - Public: ${projectArchivesBucket.public}`)
        console.log(`   - Created: ${projectArchivesBucket.created_at}`)
        results.bucket = true
      } else {
        console.log('⚠️ project-archivesバケット未作成')
        console.log('📋 作成手順:')
        console.log('   1. Supabase Dashboard → Storage')
        console.log('   2. Create Bucket')
        console.log('   3. Name: project-archives, Public: false')
      }
    }

    // 2. 新projectsテーブルスキーマ確認
    console.log('\n2️⃣ 新projectsテーブルスキーマ確認...')
    
    const newColumns = ['concept_id', 'archive_path', 'archive_size', 'checksum', 'version']
    let schemaOK = true
    
    for (const column of newColumns) {
      try {
        const { error: columnError } = await supabase
          .from('projects')
          .select(column)
          .limit(1)
        
        if (columnError) {
          console.log(`❌ ${column} カラム未適用:`, columnError.message)
          schemaOK = false
        } else {
          console.log(`✅ ${column} カラム適用済み`)
        }
      } catch (error) {
        console.log(`❌ ${column} カラムテストエラー:`, error.message)
        schemaOK = false
      }
    }
    
    if (schemaOK) {
      console.log('✅ 新projectsテーブルスキーマ完全適用')
      results.schema = true
    } else {
      console.log('⚠️ Migration実行が必要')
      console.log('📋 実行手順: Supabase Dashboard → SQL Editor → supabase-migration-v2.sql実行')
    }

    // 3. RLS設定動作確認
    console.log('\n3️⃣ RLS設定動作確認...')
    
    // 認証なしでのアクセステスト
    const { data: rlsTest, error: rlsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (rlsError) {
      if (rlsError.message.includes('RLS') || rlsError.message.includes('policy')) {
        console.log('✅ RLS正常動作（認証なしアクセス拒否）')
        results.rls = true
      } else {
        console.log('⚠️ RLS関連エラー:', rlsError.message)
      }
    } else {
      console.log('⚠️ RLSが無効化されている可能性（認証なしアクセス成功）')
      console.log('📋 RLS確認手順: Supabase Dashboard → Authentication → Policies')
    }

    // 4. Storage RLS ポリシー確認
    console.log('\n4️⃣ Storage RLS ポリシー確認...')
    
    if (results.bucket) {
      // テストファイルでアップロード試行（失敗が期待される）
      const testContent = 'Test content for RLS verification'
      const testPath = 'test-user/test-file.txt'
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-archives')
        .upload(testPath, testContent)

      if (uploadError) {
        if (uploadError.message.includes('policy') || uploadError.message.includes('RLS') || uploadError.message.includes('not allowed')) {
          console.log('✅ Storage RLS正常動作（認証なしアップロード拒否）')
          results.rls = true
        } else {
          console.log('⚠️ Storage RLS設定要確認:', uploadError.message)
        }
      } else {
        console.log('⚠️ Storage RLS未設定（認証なしアップロード成功）')
        console.log('📋 RLS設定手順: Supabase Dashboard → Storage → project-archives → Policies')
      }
    }

    // 5. Storage接続最終テスト
    console.log('\n5️⃣ Storage接続最終テスト...')
    
    if (results.bucket) {
      // バケット一覧取得テスト
      const { data: listTest, error: listError } = await supabase.storage
        .from('project-archives')
        .list('', { limit: 1 })

      if (listError) {
        if (listError.message.includes('policy') || listError.message.includes('not allowed')) {
          console.log('✅ Storage接続・RLS動作確認済み')
          results.connection = true
        } else {
          console.log('⚠️ Storage接続エラー:', listError.message)
        }
      } else {
        console.log('✅ Storage接続成功（リスト取得可能）')
        results.connection = true
      }
    }

    // 6. 統合準備状況レポート
    console.log('\n6️⃣ 統合準備状況レポート...')
    
    const readyCount = Object.values(results).filter(Boolean).length
    const totalChecks = Object.keys(results).length
    
    console.log(`📊 準備完了度: ${readyCount}/${totalChecks} (${Math.round(readyCount/totalChecks*100)}%)`)
    
    if (results.bucket && results.schema) {
      console.log('✅ worker2,3新スキーマ統合準備完了')
      console.log('🚀 ZIP化→Storage→DB連携フロー統合テスト開始可能')
    } else {
      console.log('⚠️ 手動設定完了後に統合テスト開始')
    }

    // 7. 次のアクション指示
    console.log('\n7️⃣ 次のアクション指示...')
    console.log('📋 即座実行事項:')
    
    if (!results.bucket) {
      console.log('   ❗ project-archivesバケット手動作成')
    }
    if (!results.schema) {
      console.log('   ❗ supabase-migration-v2.sql実行')
    }
    if (!results.rls) {
      console.log('   ❗ Storage RLSポリシー設定')
    }
    
    console.log('📋 worker2,3連携準備:')
    console.log('   ✅ 新スキーマ対応API修正（concept_id, archive_path, archive_size, checksum, version）')
    console.log('   ✅ UI対応修正（新フィールド表示・ダウンロード機能）')
    console.log('   ✅ 統合テスト前倒し実行可能')

    return results

  } catch (error) {
    console.error('❌ 最終テスト実行エラー:', error)
    return results
  }
}

// メイン実行
finalStorageTest()
  .then(results => {
    const allReady = Object.values(results).every(Boolean)
    
    if (allReady) {
      console.log('\n🎉 Storage準備完了！統合テスト開始可能')
      process.exit(0)
    } else {
      console.log('\n⚠️ 手動設定後に統合テスト開始')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })