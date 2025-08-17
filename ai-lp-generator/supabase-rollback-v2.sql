-- Rollback migration for AI-LP Generator Supabase v2
-- Use this to revert the changes made in supabase-migration-v2.sql

-- 1. Drop RLS policies for concepts
DROP POLICY IF EXISTS "Users can only view their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only insert their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only update their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only delete their own concepts" ON concepts;

-- 2. Drop strict RLS policies for projects
DROP POLICY IF EXISTS "Users can only view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

-- 3. Restore original loose RLS policies for projects
CREATE POLICY "Users can view all projects" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert projects" ON projects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete projects" ON projects
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Drop indexes
DROP INDEX IF EXISTS idx_concepts_user_id;
DROP INDEX IF EXISTS idx_concepts_created_at;
DROP INDEX IF EXISTS idx_projects_user_id;
DROP INDEX IF EXISTS idx_projects_concept_id;

-- 5. Drop trigger for concepts
DROP TRIGGER IF EXISTS update_concepts_updated_at ON concepts;

-- 6. Remove columns from projects table
ALTER TABLE projects 
  DROP COLUMN IF EXISTS user_id,
  DROP COLUMN IF EXISTS concept_id,
  DROP COLUMN IF EXISTS archive_url;

-- 7. Drop concepts table
DROP TABLE IF EXISTS concepts CASCADE;