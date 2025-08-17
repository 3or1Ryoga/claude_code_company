-- Storage設定修正SQL
-- このSQLをSupabase SQL Editorで実行してください

-- 1. projectsテーブルのRLSを有効化
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 2. conceptsテーブルのRLSを有効化（念のため）
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- 3. RLSポリシーが存在することを確認
-- 既存のポリシーを一旦削除して再作成
DROP POLICY IF EXISTS "Users can only view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

-- 4. 新しいRLSポリシーを作成
CREATE POLICY "Users can only view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 5. RLS設定の確認
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('projects', 'concepts');

-- 6. ポリシーの確認
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('projects', 'concepts')
ORDER BY tablename, policyname;