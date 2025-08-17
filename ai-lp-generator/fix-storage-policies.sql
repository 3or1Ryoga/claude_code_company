-- Storage RLS ポリシー修正SQL
-- Supabase Dashboard の Storage Policies で実行、または SQL Editor で実行

-- 1. 既存のStorage RLSポリシーを削除（必要に応じて）
-- 注意: これはSQL Editorではなく、Supabase Dashboard の Storage > Policies で実行してください

-- 2. 新しいStorage RLSポリシーを作成
-- 以下の定義を各操作（SELECT, INSERT, UPDATE, DELETE）に適用

-- 方法1: より厳密な定義（推奨）
-- bucket_id = 'project-archives' AND auth.uid()::text = (storage.foldername(name))[1]

-- 方法2: 現在の形式を修正（シンプル）
-- bucket_id = 'project-archives' AND (name ~~ (auth.uid()::text || '/%'))

-- 方法3: より安全な定義
-- bucket_id = 'project-archives' AND starts_with(name, auth.uid()::text || '/')

/*
推奨設定手順:

1. Supabase Dashboard → Storage → project-archives → Policies
2. 各ポリシー（SELECT, INSERT, UPDATE, DELETE）をクリックして編集
3. USING expression を以下のいずれかに変更:

【推奨】方法1 - storage.foldername() 使用:
bucket_id = 'project-archives' AND auth.uid()::text = (storage.foldername(name))[1]

【代替】方法2 - LIKE パターン修正:
bucket_id = 'project-archives' AND (name ~~ (auth.uid()::text || '/%'))

【最も安全】方法3 - starts_with() 使用:
bucket_id = 'project-archives' AND starts_with(name, auth.uid()::text || '/')

説明:
- storage.foldername(name)[1]: パスの最初のフォルダ名を取得
- 例: 'user123/project456/v1.zip' → 'user123'
- auth.uid()::text: 認証されたユーザーのID
- これにより、各ユーザーは自分のフォルダ内のファイルのみアクセス可能
*/