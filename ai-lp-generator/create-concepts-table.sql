-- 🚨 PRESIDENT指示: conceptsテーブル緊急作成
-- Created by worker2 for emergency Supabase setup

-- Create concepts table with all required fields
CREATE TABLE concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  markdown TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_concepts_user_id ON concepts(user_id);
CREATE INDEX idx_concepts_created_at ON concepts(created_at DESC);
CREATE INDEX idx_concepts_site_name ON concepts(site_name);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_concepts_updated_at 
  BEFORE UPDATE ON concepts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies as per PRESIDENT requirements
CREATE POLICY "Users can only view their own concepts" ON concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own concepts" ON concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own concepts" ON concepts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own concepts" ON concepts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON concepts TO authenticated;
GRANT ALL ON concepts TO service_role;