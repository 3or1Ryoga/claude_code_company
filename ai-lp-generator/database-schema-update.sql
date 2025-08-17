-- Enhanced database schema for AI LP Generator with editor support
-- This extends the existing schema with additional tables for better LP management

-- Check if landing_pages table exists, create if not
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'landing_pages') THEN
        -- Create landing_pages table for easier LP management
        CREATE TABLE landing_pages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE,
            description TEXT,
            template_id VARCHAR(100),
            layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
            is_published BOOLEAN DEFAULT FALSE,
            custom_domain VARCHAR(255),
            seo_meta JSONB DEFAULT '{}'::jsonb,
            analytics_config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            published_at TIMESTAMP WITH TIME ZONE
        );

        -- Create indexes
        CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
        CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
        CREATE INDEX idx_landing_pages_published ON landing_pages(is_published);
        CREATE INDEX idx_landing_pages_created_at ON landing_pages(created_at DESC);

        -- Enable RLS
        ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can only view their own landing pages" ON landing_pages
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can only insert their own landing pages" ON landing_pages
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can only update their own landing pages" ON landing_pages
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can only delete their own landing pages" ON landing_pages
            FOR DELETE USING (auth.uid() = user_id);

        -- Create trigger for updated_at
        CREATE TRIGGER update_landing_pages_updated_at 
            BEFORE UPDATE ON landing_pages 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Check if templates table exists, create if not
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'templates') THEN
        -- Create templates table for custom user templates
        CREATE TABLE templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'custom',
            thumbnail TEXT,
            sections JSONB NOT NULL DEFAULT '[]'::jsonb,
            config JSONB NOT NULL DEFAULT '{}'::jsonb,
            is_public BOOLEAN DEFAULT FALSE,
            usage_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_templates_user_id ON templates(user_id);
        CREATE INDEX idx_templates_category ON templates(category);
        CREATE INDEX idx_templates_public ON templates(is_public);
        CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);

        -- Enable RLS
        ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view public templates and their own" ON templates
            FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

        CREATE POLICY "Users can only insert their own templates" ON templates
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can only update their own templates" ON templates
            FOR UPDATE USING (auth.uid() = user_id);

        CREATE POLICY "Users can only delete their own templates" ON templates
            FOR DELETE USING (auth.uid() = user_id);

        -- Create trigger for updated_at
        CREATE TRIGGER update_templates_updated_at 
            BEFORE UPDATE ON templates 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add additional columns to existing projects table if they don't exist
DO $$ 
BEGIN 
    -- Add archive_path column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='archive_path') THEN
        ALTER TABLE projects ADD COLUMN archive_path TEXT;
    END IF;
    
    -- Add archive_size column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='archive_size') THEN
        ALTER TABLE projects ADD COLUMN archive_size BIGINT DEFAULT 0;
    END IF;
    
    -- Add checksum column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='checksum') THEN
        ALTER TABLE projects ADD COLUMN checksum TEXT;
    END IF;
    
    -- Add version column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='version') THEN
        ALTER TABLE projects ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='status') THEN
        ALTER TABLE projects ADD COLUMN status VARCHAR(50) DEFAULT 'draft';
    END IF;

    -- Add landing_page_id column for linking to landing_pages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='landing_page_id') THEN
        ALTER TABLE projects ADD COLUMN landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update existing NULL archive_path values with placeholder
UPDATE projects SET archive_path = 'legacy-no-archive' WHERE archive_path IS NULL;

-- Make archive_path NOT NULL after updating existing records
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='archive_path' AND is_nullable='YES') THEN
        ALTER TABLE projects ALTER COLUMN archive_path SET NOT NULL;
    END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_version ON projects(version);
CREATE INDEX IF NOT EXISTS idx_projects_landing_page_id ON projects(landing_page_id);

-- Insert default system templates if templates table was just created
INSERT INTO templates (id, user_id, name, description, category, sections, config, is_public) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', NULL, 'ビジネス基本テンプレート', 'スタンダードなビジネス向けランディングページテンプレート', 'business', 
     '["hero", "features", "testimonials", "cta"]'::jsonb,
     '{"hero": {"title": "御社のビジネスを次のレベルへ", "subtitle": "プロフェッショナルなサービスで成功をサポート", "ctaText": "お問い合わせ", "backgroundType": "gradient"}, "features": {"title": "選ばれる理由", "items": [{"title": "高品質", "description": "最高品質のサービスを提供"}, {"title": "迅速対応", "description": "素早いレスポンスで安心"}, {"title": "実績豊富", "description": "多数の成功事例"}]}, "testimonials": {"title": "お客様の声", "items": []}, "cta": {"title": "今すぐ始めましょう", "buttonText": "無料相談", "description": "お気軽にお問い合わせください"}}'::jsonb,
     TRUE),
    ('550e8400-e29b-41d4-a716-446655440002', NULL, 'SaaSプロダクト', 'SaaSプロダクト向けのモダンなテンプレート', 'saas',
     '["hero", "features", "pricing", "cta"]'::jsonb,
     '{"hero": {"title": "革新的なSaaSソリューション", "subtitle": "ビジネスを効率化する次世代ツール", "ctaText": "無料トライアル", "backgroundType": "video"}, "features": {"title": "主な機能", "items": [{"title": "自動化", "description": "作業の自動化で時間を節約"}, {"title": "リアルタイム分析", "description": "データに基づく意思決定"}, {"title": "チーム連携", "description": "シームレスな共同作業"}]}, "pricing": {"title": "料金プラン", "plans": [{"name": "Basic", "price": "¥1,000/月", "features": ["基本機能", "メールサポート"]}, {"name": "Pro", "price": "¥3,000/月", "features": ["全機能", "優先サポート", "API アクセス"]}]}, "cta": {"title": "今すぐ始めよう", "buttonText": "無料で始める", "description": "クレジットカード不要"}}'::jsonb,
     TRUE),
    ('550e8400-e29b-41d4-a716-446655440003', NULL, 'ポートフォリオ', 'クリエイター・個人事業主向けポートフォリオテンプレート', 'portfolio',
     '["hero", "about", "portfolio", "contact"]'::jsonb,
     '{"hero": {"title": "Creative Designer", "subtitle": "デザインであなたのビジョンを形に", "ctaText": "ポートフォリオを見る", "backgroundType": "image"}, "about": {"title": "About Me", "description": "デザイナーとしての経験と情熱をご紹介", "skills": ["UI/UX Design", "Graphic Design", "Brand Identity"]}, "portfolio": {"title": "Works", "items": []}, "contact": {"title": "Contact", "email": "hello@example.com", "social": []}}'::jsonb,
     TRUE)
ON CONFLICT (id) DO NOTHING;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Convert name to slug format
    base_slug := lower(regexp_replace(input_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Ensure uniqueness
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM landing_pages WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if table exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'landing_pages') THEN
        DROP TRIGGER IF EXISTS auto_slug_trigger ON landing_pages;
        CREATE TRIGGER auto_slug_trigger 
            BEFORE INSERT OR UPDATE ON landing_pages 
            FOR EACH ROW 
            EXECUTE FUNCTION auto_generate_slug();
    END IF;
END $$;