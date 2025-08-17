-- 🚨🚨🚨 CRITICAL EMERGENCY: Complete Concepts Table Creation
-- This SQL must be executed in Supabase Dashboard > SQL Editor IMMEDIATELY

-- Drop table if exists (for clean creation)
DROP TABLE IF EXISTS public.concepts CASCADE;

-- Create complete concepts table matching route.ts expectations
CREATE TABLE public.concepts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  site_name text NOT NULL,
  markdown_content text NOT NULL,
  
  -- PASONA Framework fields
  pasona_input jsonb DEFAULT '{}'::jsonb,
  brief text,
  
  -- Design fields
  colors jsonb DEFAULT '{}'::jsonb,
  nav jsonb DEFAULT '[]'::jsonb,
  logo_text text,
  socials jsonb DEFAULT '{}'::jsonb,
  contact jsonb DEFAULT '{}'::jsonb,
  
  -- File path
  file_path text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_concepts_user_id ON public.concepts(user_id);
CREATE INDEX idx_concepts_created_at ON public.concepts(created_at DESC);
CREATE INDEX idx_concepts_site_name ON public.concepts(site_name);

-- Enable Row Level Security
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own concepts" ON public.concepts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts" ON public.concepts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concepts" ON public.concepts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own concepts" ON public.concepts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.concepts TO authenticated;
GRANT ALL ON public.concepts TO service_role;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_concepts_updated_at 
  BEFORE UPDATE ON public.concepts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Verification query
SELECT 'Concepts table created successfully!' as status;