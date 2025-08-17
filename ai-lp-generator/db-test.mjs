#!/usr/bin/env node

/**
 * 🧪 Database Migration & Connection テストスクリプト  
 * Purpose: supabase-migration-v2.sqlの実行確認・DB接続テスト
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

async function testDatabaseConnection() {
  console.log('🧪 Database Connection & Migration テスト開始')
  console.log('================================================')

  try {
    // 1. 基本接続テスト
    console.log('1️⃣ Supabase基本接続確認...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true })

    if (connectionError) {
      console.log('⚠️ projects テーブル未作成、または接続エラー:', connectionError.message)
    } else {
      console.log(`✅ Supabase接続成功 (projects count: ${connectionTest})`)
    }

    // 2. conceptsテーブル確認
    console.log('\n2️⃣ conceptsテーブル確認...')
    const { data: conceptsTest, error: conceptsError } = await supabase
      .from('concepts')
      .select('count', { count: 'exact', head: true })

    if (conceptsError) {
      console.log('⚠️ concepts テーブル未作成:', conceptsError.message)
    } else {
      console.log(`✅ concepts テーブル存在確認 (count: ${conceptsTest})`)
    }

    // 3. projectsテーブル構造確認
    console.log('\n3️⃣ projectsテーブル構造確認...')
    
    // 新規追加カラムをテスト
    const testColumns = ['user_id', 'concept_id', 'archive_path', 'archive_size', 'checksum', 'version']
    
    for (const column of testColumns) {
      try {
        const { error: columnError } = await supabase
          .from('projects')
          .select(column)
          .limit(1)
        
        if (columnError) {
          console.log(`⚠️ ${column} カラム未追加:`, columnError.message)
        } else {
          console.log(`✅ ${column} カラム存在確認`)
        }
      } catch (error) {
        console.log(`⚠️ ${column} カラムテストエラー:`, error.message)
      }
    }

    // 4. RLSポリシー確認（間接的）
    console.log('\n4️⃣ RLSポリシー動作確認...')
    
    // 認証なしでのアクセステスト（エラーが期待される）
    const { data: rlsTest, error: rlsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (rlsError && rlsError.message.includes('RLS')) {
      console.log('✅ RLS正常動作（認証なしアクセス拒否）:', rlsError.message)
    } else if (rlsError) {
      console.log('⚠️ RLS関連エラー:', rlsError.message)
    } else {
      console.log('⚠️ RLSが無効化されている可能性（認証なしアクセス成功）')
    }

    // 5. Migration実行状況チェック
    console.log('\n5️⃣ Migration実行状況チェック...')
    
    const migrationFile = path.join(__dirname, 'supabase-migration-v2.sql')
    if (fs.existsSync(migrationFile)) {
      console.log('✅ supabase-migration-v2.sql ファイル存在確認')
      
      const migrationContent = fs.readFileSync(migrationFile, 'utf-8')
      const lines = migrationContent.split('\n').length
      console.log(`📄 Migration SQL: ${lines} lines`)
    } else {
      console.log('⚠️ supabase-migration-v2.sql ファイル未発見')
    }

    // 6. Storage接続テスト
    console.log('\n6️⃣ Storage基本接続テスト...')
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.log('⚠️ Storage接続エラー:', storageError.message)
    } else {
      console.log('✅ Storage接続成功')
      console.log(`📂 利用可能バケット: ${buckets?.map(b => b.name).join(', ') || 'なし'}`)
      
      const projectArchivesBucket = buckets?.find(bucket => bucket.name === 'project-archives')
      if (projectArchivesBucket) {
        console.log('✅ project-archivesバケット存在確認')
      } else {
        console.log('⚠️ project-archivesバケット未作成（手動作成要）')
      }
    }

    console.log('\n🎉 Database テスト完了')
    console.log('\n📋 次のアクション:')
    console.log('   1. Supabase Dashboard で supabase-migration-v2.sql を実行')
    console.log('   2. project-archives バケットを手動作成')
    console.log('   3. Storage RLS ポリシーを設定')
    console.log('   4. worker2,3との統合テスト開始')

    return true

  } catch (error) {
    console.error('❌ Database テスト実行エラー:', error)
    return false
  }
}

// メイン実行
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Database テスト正常終了')
      process.exit(0)
    } else {
      console.log('\n❌ Database テスト失敗')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ 予期しないエラー:', error)
    process.exit(1)
  })