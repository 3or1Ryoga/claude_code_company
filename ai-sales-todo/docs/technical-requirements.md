# AI Sales Assistant - 技術要件・データベース設計仕様書

## 1. プロジェクト概要

### 1.1 システム名称
AI Sales Assistant（商談成約率向上支援システム）

### 1.2 システム目的
- BANT条件に基づく効率的な商談準備
- AIによる自動ToDo生成とリアルタイム進捗管理
- 音声解析による商談の自動化・最適化

## 2. 技術要件

### 2.1 フロントエンド技術スタック
- **Next.js**: 15.4.5 (App Router)
- **React**: 19.1.0 (React 19 最新機能活用)
- **TypeScript**: 5.x (型安全性確保)
- **Tailwind CSS**: 4.0 (デザインシステム)
- **Lucide React**: 0.536.0 (アイコンライブラリ)

### 2.2 バックエンド技術スタック
- **Next.js API Routes**: RESTful API設計
- **Supabase**: PostgreSQL データベース + 認証
- **Google Gemini API**: 0.24.1 (AI処理・音声認識)
- **Edge Functions**: Deno runtime (リアルタイム処理)

### 2.3 インフラ・デプロイメント
- **Vercel**: ホスティング・CI/CD
- **Supabase Cloud**: Database as a Service
- **Edge Runtime**: グローバル配信最適化

### 2.4 開発・運用要件
- **Turbopack**: 高速ビルド・開発体験
- **ESLint + Prettier**: コード品質管理
- **Git**: バージョン管理
- **Environment Variables**: 機密情報管理

## 3. システムアーキテクチャ

### 3.1 アーキテクチャ概要
```
Frontend (Next.js App Router)
├── app/
│   ├── page.js (メインフロー制御)
│   ├── components/
│   │   ├── chat/ (BANT質問システム)
│   │   ├── todo/ (ToDo管理)
│   │   ├── audio/ (音声処理)
│   │   └── meeting/ (商談ダッシュボード)
│   └── api/ (API Routes)
│       ├── chat/
│       ├── todos/
│       ├── audio/
│       └── analytics/
```

### 3.2 コンポーネント設計
- **Atomic Design Pattern**: 再利用可能なコンポーネント設計
- **Custom Hooks**: ビジネスロジック分離
- **Context API**: グローバル状態管理

### 3.3 状態管理
```javascript
// メインアプリケーション状態
{
  currentStep: 'chat' | 'todo' | 'meeting',
  bantAnswers: BANTAnswers,
  todos: TodoItem[],
  isRecording: boolean,
  recordingTime: number,
  similarityThreshold: number
}
```

## 4. データベース設計

### 4.1 テーブル設計

#### 4.1.1 users テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4.1.2 meetings テーブル（商談セッション）
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'preparation' CHECK (status IN ('preparation', 'active', 'completed')),
  bant_answers JSONB NOT NULL, -- BANT条件回答
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

#### 4.1.3 todos テーブル（商談ToDo項目）
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  similarity_score DECIMAL(3,2), -- 音声マッチング類似度
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4.1.4 audio_transcriptions テーブル（音声文字起こし）
```sql
CREATE TABLE audio_transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  audio_segment_url TEXT,
  transcription TEXT NOT NULL,
  confidence_score DECIMAL(3,2),
  processing_duration INTEGER, -- ミリ秒
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4.1.5 meeting_analytics テーブル（商談分析）
```sql
CREATE TABLE meeting_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  completion_rate DECIMAL(5,2) NOT NULL,
  total_todos INTEGER NOT NULL,
  completed_todos INTEGER NOT NULL,
  high_priority_completed INTEGER DEFAULT 0,
  medium_priority_completed INTEGER DEFAULT 0,
  low_priority_completed INTEGER DEFAULT 0,
  meeting_duration INTEGER, -- 秒
  average_similarity_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 インデックス設計
```sql
-- パフォーマンス最適化用インデックス
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_todos_meeting_id ON todos(meeting_id);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_audio_transcriptions_meeting_id ON audio_transcriptions(meeting_id);
CREATE INDEX idx_meeting_analytics_meeting_id ON meeting_analytics(meeting_id);
```

### 4.3 データベース制約・ビジネスルール
```sql
-- BANT回答必須チェック
ALTER TABLE meetings ADD CONSTRAINT check_bant_complete 
CHECK (
  bant_answers ? 'budget' AND 
  bant_answers ? 'authority' AND 
  bant_answers ? 'need' AND 
  bant_answers ? 'timeline'
);

-- 完了時刻自動更新
CREATE OR REPLACE FUNCTION update_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  ELSIF NEW.completed = FALSE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_todo_completed_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_at();
```

## 5. API Routes 仕様

### 5.1 認証・ユーザー管理
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/user` - ユーザー情報取得

### 5.2 商談管理
- `POST /api/meetings` - 新規商談作成
- `GET /api/meetings` - 商談一覧取得
- `GET /api/meetings/[id]` - 商談詳細取得
- `PUT /api/meetings/[id]` - 商談更新
- `DELETE /api/meetings/[id]` - 商談削除

### 5.3 ToDo管理
- `POST /api/todos` - ToDo生成（AI処理）
- `GET /api/todos?meeting_id=[id]` - ToDo一覧取得
- `PUT /api/todos/[id]` - ToDo更新
- `DELETE /api/todos/[id]` - ToDo削除

### 5.4 音声処理
- `POST /api/audio/transcribe` - 音声文字起こし
- `POST /api/audio/similarity` - ToDo類似度判定
- `GET /api/audio/transcriptions?meeting_id=[id]` - 文字起こし履歴

### 5.5 分析・レポート
- `GET /api/analytics/meeting/[id]` - 商談分析データ
- `GET /api/analytics/performance` - パフォーマンス統計

## 6. セキュリティ要件

### 6.1 認証・認可
- **Supabase Auth**: JWT-based認証
- **Row Level Security (RLS)**: テーブルレベルアクセス制御
- **API Key Management**: 環境変数による機密情報管理

### 6.2 データ暗号化
- **Transit**: HTTPS/TLS 1.3
- **At Rest**: Supabase暗号化ストレージ
- **API Keys**: 環境変数 + Vercel Secrets

### 6.3 入力検証
- **Zod**: TypeScript スキーマ検証
- **CSRF Protection**: Next.js built-in
- **Rate Limiting**: Vercel Edge Functions

## 7. パフォーマンス要件

### 7.1 応答時間
- **ページ読み込み**: < 2秒
- **API応答時間**: < 500ms
- **音声処理**: < 3秒

### 7.2 スケーラビリティ
- **同時接続**: 1000+ sessions
- **データベース**: Auto-scaling (Supabase)
- **CDN**: Vercel Edge Network

### 7.3 可用性
- **稼働率**: 99.9%
- **バックアップ**: 自動日次バックアップ
- **災害復旧**: Multi-region deployment

## 8. 監視・ログ

### 8.1 アプリケーション監視
- **Vercel Analytics**: パフォーマンス監視
- **Supabase Dashboard**: データベース監視
- **Error Tracking**: Next.js built-in error handling

### 8.2 ログ管理
- **アクセスログ**: Vercel Functions logs
- **エラーログ**: Console logging + Vercel
- **監査ログ**: データベース変更追跡

---

**作成日**: 2025-08-07  
**作成者**: worker2 (技術要件・データベース設計担当)  
**バージョン**: 1.0