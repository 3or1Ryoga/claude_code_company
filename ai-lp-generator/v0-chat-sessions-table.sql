-- V0風チャット駆動LPエディター用テーブル
-- Supabase SQL Editor で実行

-- V0チャットセッションテーブル
CREATE TABLE IF NOT EXISTS v0_chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_history JSONB NOT NULL DEFAULT '[]',
  current_lp JSONB,
  compressed_data BYTEA, -- gzip圧縮されたLP大容量データ
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_v0_chat_sessions_user_id ON v0_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_v0_chat_sessions_updated_at ON v0_chat_sessions(updated_at);

-- RLS (Row Level Security) 設定
ALTER TABLE v0_chat_sessions ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のセッションのみアクセス可能
CREATE POLICY "Users can access own chat sessions" ON v0_chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_v0_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_v0_chat_sessions_updated_at
  BEFORE UPDATE ON v0_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_v0_chat_sessions_updated_at();

-- V0生成済みLPテンプレートテーブル（パフォーマンス最適化用）
CREATE TABLE IF NOT EXISTS v0_generated_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  industry TEXT,
  sections JSONB NOT NULL,
  config JSONB NOT NULL,
  preview_image_url TEXT,
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_v0_templates_category ON v0_generated_templates(category);
CREATE INDEX IF NOT EXISTS idx_v0_templates_industry ON v0_generated_templates(industry);
CREATE INDEX IF NOT EXISTS idx_v0_templates_featured ON v0_generated_templates(is_featured);

-- V0生成履歴・分析テーブル
CREATE TABLE IF NOT EXISTS v0_generation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES v0_chat_sessions(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- 'create', 'modify', 'optimize'
  input_prompt TEXT NOT NULL,
  output_sections JSONB NOT NULL,
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  user_satisfaction INTEGER, -- 1-5 rating
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_v0_analytics_user_id ON v0_generation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_v0_analytics_session_id ON v0_generation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_v0_analytics_type ON v0_generation_analytics(generation_type);

-- RLS設定
ALTER TABLE v0_generation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own generation analytics" ON v0_generation_analytics
  FOR ALL USING (auth.uid() = user_id);

-- サンプルテンプレート挿入
INSERT INTO v0_generated_templates (name, category, industry, sections, config, is_featured) VALUES
(
  'スタートアップSaaS',
  'business',
  'technology',
  '[
    {
      "type": "hero",
      "id": "hero-1", 
      "content": {
        "title": "革新的なSaaSで業務効率を劇的改善",
        "subtitle": "従来の10倍の速度でタスクを処理し、チーム生産性を最大化",
        "cta": "無料トライアル開始"
      },
      "styles": {
        "background": "bg-gradient-to-r from-indigo-600 to-purple-600",
        "text": "text-white",
        "layout": "text-center py-24"
      }
    },
    {
      "type": "problem",
      "id": "problem-1",
      "content": {
        "title": "こんな課題でお困りではありませんか？",
        "items": [
          "手作業による非効率な業務プロセス",
          "チーム間の情報共有の遅れ",
          "重複作業による時間の無駄"
        ]
      }
    }
  ]',
  '{
    "theme": "modern",
    "colorScheme": "indigo-purple",
    "typography": "professional"
  }',
  true
),
(
  'Eコマース商品',
  'ecommerce', 
  'retail',
  '[
    {
      "type": "hero",
      "id": "hero-1",
      "content": {
        "title": "限定商品で特別な体験を",
        "subtitle": "厳選された高品質商品をお得な価格でご提供",
        "cta": "今すぐ購入"
      },
      "styles": {
        "background": "bg-gradient-to-r from-rose-500 to-pink-600",
        "text": "text-white",
        "layout": "text-center py-20"
      }
    }
  ]',
  '{
    "theme": "commerce",
    "colorScheme": "rose-pink", 
    "typography": "friendly"
  }',
  true
);

COMMENT ON TABLE v0_chat_sessions IS 'V0風チャット駆動LPエディターのセッション管理';
COMMENT ON TABLE v0_generated_templates IS 'V0風生成済みLPテンプレート保存';
COMMENT ON TABLE v0_generation_analytics IS 'V0風LP生成の分析・改善データ';