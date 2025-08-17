-- AI-LP Generator Supabase Migration v3 (Fixed)
-- This migration adds concepts table and extends projects table with Supabase integration
-- Fixed: Removed IF NOT EXISTS from ADD CONSTRAINT statements for PostgreSQL compatibility

-- 1. Create concepts table if not exists
CREATE TABLE IF NOT EXISTS concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pasona_input JSONB NOT NULL,
  markdown_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Check and add columns to projects table if they don't exist
DO $$ 
BEGIN
  -- Add user_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'user_id') THEN
    ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  -- Add concept_id if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'concept_id') THEN
    ALTER TABLE projects ADD COLUMN concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL;
  END IF;
  
  -- Add archive_url if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'archive_url') THEN
    ALTER TABLE projects ADD COLUMN archive_url TEXT;
  END IF;
  
  -- Add archive_path if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'archive_path') THEN
    ALTER TABLE projects ADD COLUMN archive_path TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add archive_size if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'archive_size') THEN
    ALTER TABLE projects ADD COLUMN archive_size BIGINT NOT NULL DEFAULT 0;
  END IF;
  
  -- Add checksum if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'checksum') THEN
    ALTER TABLE projects ADD COLUMN checksum TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add version if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'projects' AND column_name = 'version') THEN
    ALTER TABLE projects ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;

-- 3. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_concepts_user_id ON concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_created_at ON concepts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_concept_id ON projects(concept_id);
CREATE INDEX IF NOT EXISTS idx_projects_archive_path ON projects(archive_path);
CREATE INDEX IF NOT EXISTS idx_projects_checksum ON projects(checksum);

-- 4. Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Drop and recreate trigger for concepts updated_at
DROP TRIGGER IF EXISTS update_concepts_updated_at ON concepts;
CREATE TRIGGER update_concepts_updated_at 
  BEFORE UPDATE ON concepts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS for concepts table
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing RLS policies for projects if they exist
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can only view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only delete their own projects" ON projects;

-- 8. Drop and recreate RLS policies for concepts
DROP POLICY IF EXISTS "Users can only view their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only insert their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only update their own concepts" ON concepts;
DROP POLICY IF EXISTS "Users can only delete their own concepts" ON concepts;

CREATE POLICY "Users can only view their own concepts" ON concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own concepts" ON concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own concepts" ON concepts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own concepts" ON concepts
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create strict RLS policies for projects (user can only access their own)
CREATE POLICY "Users can only view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Add constraints for data integrity (with proper error handling)
DO $$
BEGIN
  -- Check if constraint exists before adding
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                 WHERE conname = 'projects_archive_path_not_empty') THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_archive_path_not_empty CHECK (archive_path <> '');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                 WHERE conname = 'projects_checksum_not_empty') THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_checksum_not_empty CHECK (checksum <> '');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                 WHERE conname = 'projects_archive_size_positive') THEN
    ALTER TABLE projects 
    ADD CONSTRAINT projects_archive_size_positive CHECK (archive_size >= 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, skip
    NULL;
END $$;

-- 11. Add comments for documentation
COMMENT ON TABLE concepts IS 'Stores AI-generated concepts with PASONA methodology';
COMMENT ON COLUMN concepts.pasona_input IS 'JSONB structure containing PASONA framework data';
COMMENT ON COLUMN concepts.markdown_content IS 'Generated markdown content for the concept';
COMMENT ON COLUMN projects.concept_id IS 'Reference to the concept that generated this project';
COMMENT ON COLUMN projects.archive_url IS 'Storage URL for project archive/ZIP file';
COMMENT ON COLUMN projects.archive_path IS 'Supabase Storage path for project archive';
COMMENT ON COLUMN projects.archive_size IS 'Archive file size in bytes';
COMMENT ON COLUMN projects.checksum IS 'Archive file checksum for integrity verification';
COMMENT ON COLUMN projects.version IS 'Project version number';
COMMENT ON COLUMN projects.user_id IS 'Owner of the project';

-- 12. Storage bucket creation instructions (execute manually in Supabase Dashboard)
/*
MANUAL STEPS FOR SUPABASE STORAGE:

1. Create Storage Bucket:
   - Name: project-archives
   - Public: false (private)
   - Allowed MIME types: application/zip, application/x-zip-compressed
   - File size limit: 50MB

2. Create Storage RLS Policy:
   - Bucket: project-archives
   - Policy Name: "Users can access their own archive files"
   - Operations: SELECT, INSERT, UPDATE, DELETE
   - Target roles: authenticated
   - Policy definition: name LIKE auth.uid()::text || '/%'

3. Verify bucket permissions in Storage > Policies
*/

-- Migration completed successfully message
DO $$
BEGIN
  RAISE NOTICE 'Migration v3 completed successfully. Please complete manual Storage setup steps.';
END $$;