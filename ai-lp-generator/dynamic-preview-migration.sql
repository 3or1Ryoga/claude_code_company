-- 動的プレビュー機能用データベース拡張
-- Supabase SQL Editor で実行

-- projectsテーブルにプレビュー関連カラム追加
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS preview_status TEXT CHECK (preview_status IN ('stopped', 'pending', 'building', 'ready', 'error')),
ADD COLUMN IF NOT EXISTS preview_port INTEGER CHECK (preview_port BETWEEN 3002 AND 3010),
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS preview_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preview_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS build_output TEXT;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_projects_preview_status ON projects(preview_status);
CREATE INDEX IF NOT EXISTS idx_projects_preview_port ON projects(preview_port);
CREATE INDEX IF NOT EXISTS idx_projects_user_preview ON projects(user_id, preview_status);

-- プレビューセッション管理テーブル
CREATE TABLE IF NOT EXISTS preview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  port INTEGER NOT NULL CHECK (port BETWEEN 3002 AND 3010),
  status TEXT NOT NULL CHECK (status IN ('starting', 'building', 'running', 'error', 'stopped')),
  url TEXT,
  process_pid INTEGER,
  build_logs JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- プレビューセッションインデックス
CREATE INDEX IF NOT EXISTS idx_preview_sessions_project ON preview_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_user ON preview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_port ON preview_sessions(port);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_status ON preview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_preview_sessions_activity ON preview_sessions(last_activity);

-- RLS設定
ALTER TABLE preview_sessions ENABLE ROW LEVEL SECURITY;

-- プレビューセッションアクセス制御
CREATE POLICY "Users can access own preview sessions" ON preview_sessions
  FOR ALL USING (auth.uid() = user_id);

-- プレビューパフォーマンス分析テーブル
CREATE TABLE IF NOT EXISTS preview_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES preview_sessions(id) ON DELETE SET NULL,
  build_duration_ms INTEGER,
  startup_duration_ms INTEGER,
  memory_usage_mb DECIMAL,
  cpu_usage_percent DECIMAL,
  port_used INTEGER,
  success BOOLEAN NOT NULL,
  error_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 分析テーブルインデックス
CREATE INDEX IF NOT EXISTS idx_preview_analytics_project ON preview_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_preview_analytics_user ON preview_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_preview_analytics_created_at ON preview_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_preview_analytics_success ON preview_analytics(success);

-- RLS設定
ALTER TABLE preview_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own preview analytics" ON preview_analytics
  FOR ALL USING (auth.uid() = user_id);

-- プレビューセッション自動更新トリガー
CREATE OR REPLACE FUNCTION update_preview_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preview_session_activity_trigger
  BEFORE UPDATE ON preview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_session_activity();

-- 古いプレビューセッション自動クリーンアップ関数
CREATE OR REPLACE FUNCTION cleanup_old_preview_sessions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- 24時間以上非アクティブなセッションを停止状態に更新
  UPDATE preview_sessions 
  SET status = 'stopped', stopped_at = NOW()
  WHERE last_activity < NOW() - INTERVAL '24 hours'
    AND status NOT IN ('stopped', 'error');
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- 7日以上古いセッションを削除
  DELETE FROM preview_sessions 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- 毎時間実行するクリーンアップジョブ（pg_cron が利用可能な場合）
-- SELECT cron.schedule('cleanup-preview-sessions', '0 * * * *', 'SELECT cleanup_old_preview_sessions();');

-- プレビューポート使用状況ビュー
CREATE OR REPLACE VIEW preview_port_usage AS
SELECT 
  port,
  COUNT(*) as active_sessions,
  MAX(last_activity) as last_used,
  ARRAY_AGG(project_id) as project_ids
FROM preview_sessions 
WHERE status IN ('starting', 'building', 'running')
GROUP BY port
ORDER BY port;

-- プレビュー使用統計ビュー
CREATE OR REPLACE VIEW preview_usage_stats AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE success = true) as successful_sessions,
  COUNT(*) FILTER (WHERE success = false) as failed_sessions,
  AVG(build_duration_ms) as avg_build_time_ms,
  AVG(startup_duration_ms) as avg_startup_time_ms,
  MAX(memory_usage_mb) as peak_memory_mb
FROM preview_analytics 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- サンプルデータとテスト用ヘルパー関数
CREATE OR REPLACE FUNCTION get_available_preview_ports()
RETURNS INTEGER[] AS $$
DECLARE
  all_ports INTEGER[] := ARRAY[3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
  used_ports INTEGER[];
  available_ports INTEGER[];
BEGIN
  -- 現在使用中のポート取得
  SELECT ARRAY_AGG(port) INTO used_ports
  FROM preview_sessions 
  WHERE status IN ('starting', 'building', 'running');
  
  -- 利用可能ポート計算
  SELECT ARRAY_AGG(port) INTO available_ports
  FROM UNNEST(all_ports) AS port
  WHERE port != ALL(COALESCE(used_ports, ARRAY[]::INTEGER[]));
  
  RETURN COALESCE(available_ports, all_ports);
END;
$$ LANGUAGE plpgsql;

-- プレビューセッション統計関数
CREATE OR REPLACE FUNCTION get_preview_session_stats(user_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'total_sessions', COUNT(*),
    'active_sessions', COUNT(*) FILTER (WHERE status IN ('starting', 'building', 'running')),
    'successful_sessions', COUNT(*) FILTER (WHERE status = 'running'),
    'failed_sessions', COUNT(*) FILTER (WHERE status = 'error'),
    'average_build_time_ms', AVG(EXTRACT(EPOCH FROM (stopped_at - started_at)) * 1000) FILTER (WHERE stopped_at IS NOT NULL),
    'ports_in_use', ARRAY_AGG(DISTINCT port) FILTER (WHERE status IN ('starting', 'building', 'running')),
    'last_activity', MAX(last_activity)
  ) INTO stats
  FROM preview_sessions
  WHERE (user_uuid IS NULL OR user_id = user_uuid);
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE preview_sessions IS '動的プレビューセッション管理';
COMMENT ON TABLE preview_analytics IS 'プレビューパフォーマンス分析データ';
COMMENT ON FUNCTION cleanup_old_preview_sessions() IS '古いプレビューセッションの自動クリーンアップ';
COMMENT ON FUNCTION get_available_preview_ports() IS '利用可能なプレビューポート一覧取得';
COMMENT ON FUNCTION get_preview_session_stats(UUID) IS 'プレビューセッション統計情報取得';