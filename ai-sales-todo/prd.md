# Product Requirements Document (PRD)
# AI Sales Todo Application

## 📋 エグゼクティブサマリー

**プロダクト名:** AI Sales Todo  
**バージョン:** 0.1.0  
**作成日:** 2025-08-09  
**作成者:** 開発組織（PRESIDENT, boss1, worker1, worker2, worker3）

## 🎯 プロダクト概要

AI-powered sales todo management system - 音声認識とAIを統合した次世代営業支援システム。商談の成約率向上を目的とし、BANT条件のヒアリング、AI駆動のToDo自動生成、リアルタイム音声解析による商談支援を提供。

## 🛠️ 技術スタック

### フロントエンド技術

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **フレームワーク** | Next.js | 15.4.6 | メインフレームワーク（App Router採用） |
| **UIライブラリ** | React | 19.1.1 | UIコンポーネント構築 |
| **レンダリング** | React DOM | 19.1.1 | DOM操作・レンダリング |
| **スタイリング** | Tailwind CSS | v4 | ユーティリティファーストCSS |
| **PostCSS** | @tailwindcss/postcss | v4 | CSS処理パイプライン |
| **アイコン** | lucide-react | 0.537.0 | UIアイコンライブラリ |
| **ビルドツール** | Turbopack | - | 高速開発サーバー（--turbopack） |

### バックエンド技術

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **APIフレームワーク** | Next.js API Routes | 15.4.6 | サーバーサイドAPI |
| **データベース** | Supabase (PostgreSQL) | - | メインデータストア |
| **認証** | Supabase Auth | - | ユーザー認証・認可 |
| **ORM/クライアント** | @supabase/supabase-js | 2.54.0 | データベース操作 |
| **SSR対応** | @supabase/ssr | 0.6.1 | サーバーサイドレンダリング対応 |

### AI・機械学習技術

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **生成AI** | Google Generative AI (Gemini) | 0.24.1 | AIテキスト生成・分析 |
| **音声認識** | Web Speech API | ネイティブ | ブラウザ音声認識 |
| **自然言語処理** | カスタムアルゴリズム | - | 音声-テキスト類似度判定 |

### 開発ツール・環境

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| **パッケージマネージャー** | npm | ≥8.0.0 | 依存関係管理 |
| **ランタイム** | Node.js | ≥18.0.0 | JavaScript実行環境 |
| **リンター** | ESLint | v8 | コード品質管理 |
| **ESLint設定** | eslint-config-next | 15.4.6 | Next.js用ESLint設定 |
| **テストランナー** | Jest | 29.7.0 | ユニット・統合テスト |

## 🏗️ アーキテクチャ構成

### ディレクトリ構造

```
ai-sales-todo/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/         # チャットAPI
│   │   ├── gemini/       # Gemini AI統合
│   │   ├── realtime/     # リアルタイム更新
│   │   ├── todos/        # ToDo管理
│   │   └── voice/        # 音声認識
│   ├── components/        # Reactコンポーネント
│   │   ├── audio/        # 音声制御
│   │   ├── chat/         # チャットUI
│   │   ├── meeting/      # 商談ダッシュボード
│   │   └── todo/         # ToDoリスト
│   └── globals.css       # グローバルスタイル
├── database/              # データベース定義
│   └── schema.sql        # PostgreSQLスキーマ
├── lib/                   # ユーティリティライブラリ
│   ├── auth-context.js   # 認証コンテキスト
│   ├── database.js       # DB接続
│   ├── gemini.js         # Gemini AI統合
│   ├── logger.js         # ロギング
│   ├── realtimeUpdater.js # リアルタイム更新
│   ├── speechRecognition.js # 音声認識
│   ├── supabase.js       # Supabaseクライアント
│   └── todoMatcher.js    # ToDo照合ロジック
└── __tests__/            # テストスイート
```

### データベース設計

**主要テーブル:**
- `meeting_projects` - 商談プロジェクト管理
- `todo_items` - ToDoアイテム管理
- `speech_records` - 音声認識記録
- `user_settings` - ユーザー設定

**セキュリティ:**
- Row Level Security (RLS) 実装
- ユーザー単位のデータアクセス制御
- 認証トークンベースのアクセス管理

## 🔑 主要機能と技術実装

### 1. BANT条件ヒアリングシステム
- **技術:** Gemini AI + カスタムプロンプトエンジニアリング
- **実装:** ChatInterface.jsx + /api/chat/route.js

### 2. AI駆動ToDo自動生成
- **技術:** Gemini AI + 構造化データ生成
- **実装:** /api/gemini/route.js + TodoList.jsx

### 3. リアルタイム音声認識
- **技術:** Web Speech API + カスタム音声処理
- **実装:** speechRecognition.js + AudioController.jsx

### 4. 音声-テキスト類似度判定
- **技術:** カスタムアルゴリズム（類似度スコア計算）
- **実装:** todoMatcher.js

### 5. リアルタイム更新システム
- **技術:** Supabase Realtime + WebSocket
- **実装:** realtimeUpdater.js

## 🚀 ビルド・デプロイ設定

### 開発コマンド
```bash
npm run dev        # 開発サーバー起動（Turbopack）
npm run build      # プロダクションビルド
npm run start      # プロダクションサーバー起動
npm run lint       # ESLintチェック
npm run test       # Jestテスト実行
npm run clean      # キャッシュクリア
```

### 環境変数
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase公開キー
- `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini APIキー（要セキュア化）

## 📊 技術評価サマリー

### 強み
- ✅ 最新のNext.js 15.4.6 + React 19採用
- ✅ AI/音声認識の先進的統合
- ✅ モジュラーで保守性の高い設計
- ✅ 包括的なデータベース設計

### 改善点
- ⚠️ TypeScript未採用
- ⚠️ CI/CDパイプライン未設定
- ⚠️ セキュリティ設定の強化必要
- ⚠️ E2Eテスト未実装

## 📝 結論

本アプリケーションは、Next.js 15を基盤とした最新のフルスタックWebアプリケーションとして実装されている。Google Gemini AIとWeb Speech APIを統合し、営業支援に特化した高度な機能を提供。技術選定は適切であり、実用的な価値を持つが、本番環境への移行にはセキュリティとデプロイ設定の改善が必要。

---
*作成: 開発組織全体による協力分析*  
*日付: 2025-08-09*