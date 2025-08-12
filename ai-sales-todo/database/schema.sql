-- 商談支援AIアプリ用データベーススキーマ

-- 商談プロジェクトテーブル
CREATE TABLE meeting_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    meeting_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'preparation' CHECK (status IN ('preparation', 'in_progress', 'completed')),
    -- BANT情報の保存
    budget TEXT,
    authority TEXT,
    need TEXT,
    timeline TEXT,
    additional_notes TEXT
);

-- ToDoリストテーブル
CREATE TABLE todo_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES meeting_projects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    task_text TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('アイスブレイク', 'ヒアリング', '提案', 'クロージング')),
    order_index INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    -- 音声認識による自動完了用
    similarity_threshold DECIMAL(3,2) DEFAULT 0.7,
    detected_speech TEXT
);

-- 音声認識記録テーブル
CREATE TABLE speech_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES meeting_projects(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    transcribed_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    processing_duration INTEGER -- ミリ秒
);

-- ユーザー設定テーブル
CREATE TABLE user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    -- 音声認識設定
    default_similarity_threshold DECIMAL(3,2) DEFAULT 0.7,
    speech_language VARCHAR(10) DEFAULT 'ja-JP',
    -- UI設定
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    -- 通知設定
    email_notifications BOOLEAN DEFAULT TRUE
);

-- RLS (Row Level Security) の設定
ALTER TABLE meeting_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分のプロジェクトのみアクセス可能
CREATE POLICY "Users can manage their own meeting projects" ON meeting_projects
    FOR ALL USING (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのToDoアイテムのみアクセス可能
CREATE POLICY "Users can manage their own todo items" ON todo_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meeting_projects 
            WHERE meeting_projects.id = todo_items.project_id 
            AND meeting_projects.user_id = auth.uid()
        )
    );

-- ユーザーは自分のプロジェクトの音声記録のみアクセス可能
CREATE POLICY "Users can manage their own speech records" ON speech_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM meeting_projects 
            WHERE meeting_projects.id = speech_records.project_id 
            AND meeting_projects.user_id = auth.uid()
        )
    );

-- ユーザーは自分の設定のみアクセス可能
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- インデックスの作成（パフォーマンス最適化）
CREATE INDEX idx_meeting_projects_user_id ON meeting_projects(user_id);
CREATE INDEX idx_meeting_projects_status ON meeting_projects(status);
CREATE INDEX idx_todo_items_project_id ON todo_items(project_id);
CREATE INDEX idx_todo_items_completed ON todo_items(completed);
CREATE INDEX idx_speech_records_project_id ON speech_records(project_id);
CREATE INDEX idx_speech_records_created_at ON speech_records(created_at);

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新日時トリガーを設定
CREATE TRIGGER update_meeting_projects_updated_at BEFORE UPDATE
    ON meeting_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE
    ON todo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE
    ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();