# 🗄️ Supabase Storage セットアップ手順書

## 📋 概要
Supabase Storage統合プロジェクトで、プロジェクトアーカイブ（ZIP）をStorageに保存するための設定手順書。

## 🚀 1. Storage Bucket作成

### Supabase Dashboard → Storage → New bucket

**設定値:**
- **Bucket Name**: `project-archives`
- **Public**: ❌ **false** (private)
- **Allowed MIME types**: 
  - `application/zip`
  - `application/x-zip-compressed`
- **File size limit**: `50MB`

## 🔐 2. Storage RLS (Row Level Security) ポリシー設定

### Storage → Policies → New Policy

**Policy 1: Users can access their own archive files**
```sql
-- Policy Name: "Users can access their own archive files"
-- Bucket: project-archives
-- Operations: SELECT, INSERT, UPDATE, DELETE
-- Target roles: authenticated

-- Policy Definition:
name LIKE auth.uid()::text || '/%'
```

**Policy 2: Users can list their own directories**
```sql
-- Policy Name: "Users can list their own directories"  
-- Bucket: project-archives
-- Operations: SELECT
-- Target roles: authenticated

-- Policy Definition:
name = auth.uid()::text || '/'
```

## 📁 3. ディレクトリ構造

```
project-archives/
├── {user_id}/
│   ├── {project_id}/
│   │   └── project.zip
│   └── {project_id2}/
│       └── project.zip
└── {user_id2}/
    └── ...
```

## 🧪 4. 動作確認手順

### 4.1 Bucket作成確認
```bash
# curl テスト
curl -X GET 'https://your-project.supabase.co/storage/v1/bucket' \
  -H "Authorization: Bearer your-anon-key"
```

### 4.2 RLS確認
```bash
# 認証済みユーザーでのファイルアップロードテスト
curl -X POST 'https://your-project.supabase.co/storage/v1/object/project-archives/test/test.zip' \
  -H "Authorization: Bearer your-user-jwt" \
  -F 'file=@test.zip'
```

### 4.3 権限確認
- ✅ 自分のファイルのみアクセス可能
- ❌ 他のユーザーのファイルはアクセス不可
- ✅ 認証済みユーザーのみアクセス可能

## 📊 5. 環境変数設定

`.env.local` に以下を追加:
```env
# Supabase Storage
SUPABASE_STORAGE_BUCKET=project-archives
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://your-project.supabase.co/storage/v1
```

## ⚠️ 6. セキュリティ注意事項

- 🔐 **Service Role Key** はサーバーサイドでのみ使用
- 🚫 **Anon Key** はクライアントサイドでのみ使用
- 🔒 **RLS** は必ず有効化、ユーザー分離を確実に
- 📝 **ファイルサイズ制限** を適切に設定

## 🚀 7. 完了確認チェックリスト

- [ ] project-archivesバケット作成
- [ ] RLSポリシー設定
- [ ] 動作テスト完了
- [ ] 環境変数設定
- [ ] セキュリティ確認

---

**作成日**: 2025-08-13  
**担当**: worker1 (DB/Storage担当)  
**プロジェクト**: Supabase Storage統合