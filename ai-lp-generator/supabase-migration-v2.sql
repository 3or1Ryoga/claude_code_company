-- AI-LP Generator Supabase Migration v2
-- This migration adds concepts table and extends projects table with Supabase integration

-- 1. Create concepts table
CREATE TABLE IF NOT EXISTS concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pasona_input JSONB NOT NULL,
  markdown_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Extend projects table with new columns for Storage integration
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS concept_id UUID REFERENCES concepts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_url TEXT,
  ADD COLUMN IF NOT EXISTS archive_path TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS archive_size BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checksum TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- 3. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_concepts_user_id ON concepts(user_id);
CREATE INDEX IF NOT EXISTS idx_concepts_created_at ON concepts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_concept_id ON projects(concept_id);
CREATE INDEX IF NOT EXISTS idx_projects_archive_path ON projects(archive_path);
CREATE INDEX IF NOT EXISTS idx_projects_checksum ON projects(checksum);

-- 4. Create trigger for concepts updated_at
CREATE TRIGGER update_concepts_updated_at 
  BEFORE UPDATE ON concepts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Enable RLS for concepts table
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing loose RLS policies for projects
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- 7. Create strict RLS policies for concepts (user can only access their own)
CREATE POLICY "Users can only view their own concepts" ON concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own concepts" ON concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own concepts" ON concepts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own concepts" ON concepts
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create strict RLS policies for projects (user can only access their own)
CREATE POLICY "Users can only view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Add constraints for data integrity
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS projects_archive_path_not_empty CHECK (archive_path <> ''),
ADD CONSTRAINT IF NOT EXISTS projects_checksum_not_empty CHECK (checksum <> ''),
ADD CONSTRAINT IF NOT EXISTS projects_archive_size_positive CHECK (archive_size >= 0);

-- 10. Storage bucket creation instructions (execute manually in Supabase Dashboard)
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

-- 11. Add comment for documentation
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