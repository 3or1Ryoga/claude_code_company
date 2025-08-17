-- RLS設定修正SQL
-- Supabase SQL Editor で実行してください

-- 1. projectsテーブルのRLS有効化
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. conceptsテーブルのRLS有効化
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- 3. 既存ポリシーを削除
DROP POLICY IF EXISTS "Users can only view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

DROP POLICY IF EXISTS "Users can only view their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only insert their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only update their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only delete their own concepts" ON concepts;

-- 4. projects用のRLSポリシー作成
CREATE POLICY "Users can only view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 5. concepts用のRLSポリシー作成
CREATE POLICY "Users can only view their own concepts" ON concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own concepts" ON concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own concepts" ON concepts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own concepts" ON concepts
  FOR DELETE USING (auth.uid() = user_id);

-- 6. 設定確認クエリ
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN 'RLS有効' ELSE 'RLS無効' END as status
FROM pg_tables 
WHERE tablename IN ('projects', 'concepts');

-- 7. ポリシー確認クエリ
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING句あり'
    ELSE 'USING句なし'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'CHECK句あり'
    ELSE 'CHECK句なし'
  END as check_clause
FROM pg_policies
WHERE tablename IN ('projects', 'concepts')
ORDER BY tablename, policyname;