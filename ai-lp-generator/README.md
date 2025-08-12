# AI LP Generator

PASONAの法則に基づいた高コンバージョンLP自動生成ツール

## 概要

AI LP Generatorは、PASONAの法則（Problem, Affinity, Solution, Offer, Narrowing down, Action）に基づいたヒアリングフォームを通じて、ビジネスに最適化されたランディングページをAIで自動生成するWebアプリケーションです。

## 技術スタック

- **フロントエンド**: Next.js 15.4.5 + React 19.1.0 + TypeScript
- **スタイリング**: Tailwind CSS v4 + Radix UI
- **認証**: Supabase Auth（メール/パスワード、Google OAuth）
- **AI**: Vercel AI SDK
- **データベース**: Supabase PostgreSQL

## 主要機能

### 1. PASONAチャットインターフェース
- 6段階のステップ式入力フォーム
- リアルタイムプログレスバー
- 前後ナビゲーション機能
- Ctrl+Enterショートカット対応

### 2. プロジェクト管理
- プロジェクト一覧のグリッド表示
- ステータス管理（下書き/完成/公開中）
- 統計情報の可視化
- プレビュー/編集/削除機能

### 3. 認証システム
- メール/パスワード認証
- Google OAuth連携
- セキュアな認証状態管理

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番サーバーの起動
npm start

# ESLintチェック
npm run lint
```

## 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ホームページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── globals.css        # グローバルスタイル
│   ├── login/             # ログインページ
│   ├── signup/            # サインアップページ
│   ├── dashboard/         # ダッシュボード
│   ├── chat-create/       # LP作成チャット
│   └── api/               # APIルート
├── components/            # Reactコンポーネント
│   ├── pasona-chat.tsx   # PASONAチャット
│   ├── project-dashboard.tsx # プロジェクト管理UI
│   └── ui/               # 再利用可能UIコンポーネント
└── lib/                   # ユーティリティ・設定
    ├── auth-context.tsx   # 認証コンテキスト
    ├── supabase.ts       # Supabaseクライアント
    └── utils.ts          # 汎用ユーティリティ
```

## ユーザーフロー

1. **新規ユーザー**: ホームページ → サインアップ → ダッシュボード
2. **LP作成**: ダッシュボード → PASONAチャット（6ステップ） → AI生成 → 完了
3. **プロジェクト管理**: ダッシュボード → プロジェクト選択 → 各種操作

## 開発者向け情報

### デザインシステム
- CSS変数による一元的なカラー管理
- ライト/ダークモード自動対応
- レスポンシブデザイン（モバイルファースト）

### セキュリティ
- Supabase Row Level Security
- XSS/CSRF対策
- 環境変数による機密情報管理

## ライセンス

Private - All rights reserved
