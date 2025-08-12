# Next.js Webアプリケーション セキュリティ・テスト・デプロイ要件定義書

## 1. セキュリティ要件

### 1.1 認証要件
- **認証方式**: JWT (JSON Web Token) ベース認証
- **セッション管理**: 
  - セッションタイムアウト: 30分（設定可能）
  - リフレッシュトークン有効期限: 7日間
- **認証プロバイダー対応**:
  - NextAuth.js実装
  - OAuth 2.0対応（Google, GitHub, Microsoft）
  - Email/パスワード認証
  - マジックリンク認証

### 1.2 認可要件
- **ロールベースアクセス制御 (RBAC)**:
  - 管理者 (Admin)
  - 一般ユーザー (User)
  - ゲスト (Guest)
- **API Routes保護**:
  - ミドルウェアによるルート保護
  - APIキー管理
  - レート制限実装

### 1.3 データ保護要件
- **暗号化**:
  - HTTPS通信の強制
  - データベース暗号化（保存時）
  - 環境変数の安全な管理（.env.local）
- **入力検証とサニタイズ**:
  - XSS対策
  - SQLインジェクション防止
  - CSRFトークン実装

### 1.4 セキュリティヘッダー
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## 2. テスト戦略

### 2.1 テストピラミッド
- **単体テスト**: 70%
- **統合テスト**: 20%
- **E2Eテスト**: 10%

### 2.2 単体テスト要件
- **テストフレームワーク**: Jest + React Testing Library
- **カバレッジ目標**: 80%以上
- **テスト対象**:
  - Reactコンポーネント
  - API Routes
  - ユーティリティ関数
  - カスタムフック

### 2.3 統合テスト要件
- **API統合テスト**:
  - MSW (Mock Service Worker) 使用
  - データベース接続テスト
  - 外部API連携テスト
- **コンポーネント統合テスト**:
  - ページ間遷移
  - フォーム送信フロー
  - 認証フロー

### 2.4 E2Eテスト要件
- **テストフレームワーク**: Playwright
- **テストシナリオ**:
  - ユーザー登録・ログインフロー
  - 主要機能の動作確認
  - クロスブラウザテスト（Chrome, Firefox, Safari）
  - レスポンシブデザインテスト

### 2.5 パフォーマンステスト
- **Core Web Vitals目標**:
  - LCP (Largest Contentful Paint): < 2.5秒
  - FID (First Input Delay): < 100ミリ秒
  - CLS (Cumulative Layout Shift): < 0.1
- **Lighthouse スコア目標**:
  - Performance: 90以上
  - Accessibility: 100
  - Best Practices: 95以上
  - SEO: 100

## 3. デプロイ要件

### 3.1 Vercel デプロイ設定

#### 環境設定
- **Production環境**:
  - ドメイン: production.example.com
  - Node.js バージョン: 20.x
  - ビルドコマンド: `npm run build`
  - 出力ディレクトリ: `.next`

- **Staging環境**:
  - ドメイン: staging.example.com
  - プレビューデプロイ自動化
  - Pull Request連携

#### 環境変数管理
```bash
# Production環境変数
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
API_KEY=

# Staging環境変数
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_ANALYTICS_ID=
```

#### デプロイ設定ファイル (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### 3.2 Netlify デプロイ設定

#### ビルド設定
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### 3.3 CI/CD パイプライン

#### GitHub Actions ワークフロー
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 4. 運用・監視要件

### 4.1 監視項目
- **アプリケーション監視**:
  - エラー率
  - レスポンスタイム
  - API使用状況
  - メモリ使用量

### 4.2 ログ管理
- **ログレベル**:
  - ERROR: エラー情報
  - WARN: 警告情報
  - INFO: 一般情報
  - DEBUG: デバッグ情報（開発環境のみ）

### 4.3 アラート設定
- **重要度別アラート**:
  - Critical: 即時対応（サービス停止）
  - High: 1時間以内対応
  - Medium: 24時間以内対応
  - Low: 定期メンテナンス時対応

### 4.4 バックアップとリカバリ
- **バックアップ頻度**:
  - データベース: 日次
  - 静的ファイル: 週次
  - 設定ファイル: 変更時
- **リカバリ目標**:
  - RTO (Recovery Time Objective): 4時間
  - RPO (Recovery Point Objective): 24時間

## 5. 依存関係とパッケージ管理

### 必須パッケージ
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "next-auth": "^4.24.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "playwright": "^1.40.0",
    "msw": "^2.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## 6. コンプライアンス要件

### 6.1 データプライバシー
- GDPR準拠
- 個人情報の暗号化
- データ削除権の実装
- Cookie同意管理

### 6.2 アクセシビリティ
- WCAG 2.1 Level AA準拠
- スクリーンリーダー対応
- キーボードナビゲーション完全対応

## 7. ドキュメント要件

### 7.1 技術ドキュメント
- API仕様書
- データベース設計書
- アーキテクチャ図
- デプロイ手順書

### 7.2 運用ドキュメント
- 運用手順書
- 障害対応マニュアル
- セキュリティインシデント対応手順

---
作成日: 2025-08-08
作成者: Worker3 (セキュリティ・テスト・デプロイ担当)