# AI Chat App - アーキテクチャ概要

## システム全体アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - React 19      │    │ - Next.js 15    │    │ - Prisma ORM    │
│ - Tailwind CSS  │    │ - TypeScript    │    │ - Connection    │
│ - TypeScript    │    │ - JWT Auth      │    │   Pooling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   External      │
                    │   Services      │
                    │                 │
                    │ - AI API        │
                    │ - CDN           │
                    │ - Monitoring    │
                    └─────────────────┘
```

## レイヤー構成

### 1. プレゼンテーション層 (Frontend)

**責務**: ユーザーインターフェース、ユーザーエクスペリエンス

**技術スタック**:
- Next.js 15 (App Router)
- React 19 (Server Components + Client Components)
- Tailwind CSS 4
- TypeScript

**主要コンポーネント**:
- Page Components (`/app/page.tsx`, `/app/chat/page.tsx`)
- UI Components (`/components/ui/`)
- Chat Components (`/components/chat/`)
- Layout Components (`/app/layout.tsx`)

### 2. アプリケーション層 (API Routes)

**責務**: ビジネスロジック、API エンドポイント

**技術スタック**:
- Next.js API Routes
- TypeScript
- Zod (バリデーション)
- JWT (認証)

**主要機能**:
- 認証・認可 (`/app/api/auth/`)
- チャット管理 (`/app/api/chat/`)
- メッセージ処理 (`/app/api/messages/`)
- ユーザー管理 (`/app/api/users/`)

### 3. データアクセス層 (ORM)

**責務**: データベースアクセス、クエリ最適化

**技術スタック**:
- Prisma ORM
- PostgreSQL Driver
- Connection Pooling

**主要機能**:
- スキーマ管理
- マイグレーション
- クエリビルダー
- 型安全なデータアクセス

### 4. データ永続化層 (Database)

**責務**: データ保存、整合性保証

**技術スタック**:
- PostgreSQL
- Supabase または Vercel Postgres

## データフロー

### 1. チャットメッセージ送信フロー

```
User Input → Client Component → API Route → Database
    ↓             ↓                ↓          ↓
UI Event → POST /api/messages → Prisma → PostgreSQL
    ↓             ↓                ↓          ↓
Response ← JSON Response ← Query Result ← Stored Data
    ↓             ↓                ↓          ↓
UI Update ← State Update ← Parse Response ← Network
```

### 2. 認証フロー

```
Login Form → /api/auth/login → User Verification → JWT Generation
    ↓              ↓                 ↓               ↓
Submit → Validate Credentials → Check Database → Create Token
    ↓              ↓                 ↓               ↓
Redirect ← Set Cookie ← Hash Password ← Store Session
```

## セキュリティアーキテクチャ

### 認証・認可
- JWT トークンベース認証
- HttpOnly Cookie によるトークン保存
- Refresh Token による長期認証

### データ保護
- HTTPS 通信の強制
- CORS 設定の適切な構成
- SQL インジェクション対策 (Prisma ORM)
- XSS 対策 (Content Security Policy)

### レート制限
- IP ベースレート制限
- ユーザーベースレート制限
- API エンドポイント毎の制限設定

## パフォーマンス最適化

### フロントエンド最適化
- Code Splitting (Next.js 自動)
- Image Optimization (next/image)
- Font Optimization (next/font)
- Bundle Size Optimization

### バックエンド最適化
- Database Connection Pooling
- Query Optimization (Prisma)
- Caching Strategy (Redis)
- CDN Integration

### データベース最適化
- インデックス設計
- クエリ最適化
- パーティショニング (将来的)

## スケーラビリティ

### 水平スケーリング
- Stateless API Design
- Database Read Replicas
- CDN による静的アセット配信

### 垂直スケーリング
- Database Performance Tuning
- Connection Pool サイズ調整
- Memory Management

## 監視・ログ

### アプリケーション監視
- Error Tracking (Sentry)
- Performance Monitoring
- User Analytics

### インフラ監視
- Database Metrics
- API Response Time
- Server Resource Usage

## デプロイメント構成

### 本番環境
```
Internet → Vercel Edge Network → Next.js App → Supabase PostgreSQL
              ↓                      ↓              ↓
          CDN Cache → Server Functions → Connection Pool
```

### 開発環境
```
Local Development → Next.js Dev Server → Local PostgreSQL
                        ↓                    ↓
                   Hot Reload → Direct Connection
```

## 技術選定理由

### Next.js 15 選定理由
- React Server Components 対応
- App Router による ファイルベース ルーティング
- API Routes による フルスタック開発
- Vercel との緊密な統合

### PostgreSQL 選定理由
- ACID 特性による高い信頼性
- JSON/JSONB 型による柔軟なデータ構造
- 豊富な拡張機能
- スケーラビリティ

### Prisma 選定理由
- 型安全なデータベースアクセス
- 直感的な Schema 定義
- 自動マイグレーション
- 優れた開発者体験

## 将来的な拡張ポイント

### 機能拡張
- リアルタイム通信 (WebSocket)
- ファイルアップロード機能
- 音声入力対応
- マルチモーダル AI 対応

### インフラ拡張
- マイクロサービス化
- Kubernetes デプロイ
- Multi-region 展開
- Edge Computing 活用