# Next.js AIチャットアプリ デプロイ要件定義書

## 1. Vercelデプロイ要件（推奨）
### プラットフォーム仕様
- **プラン**: Pro Plan推奨（Hobby可、商用利用時はPro必須）
- **Node.js**: v18.17+ (Next.js 15対応)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (自動設定)
- **Install Command**: `npm ci`

### 環境変数設定
```bash
# 必須環境変数
NEXTAUTH_SECRET=your-secret-key-32-chars-min
NEXTAUTH_URL=https://your-domain.vercel.app
DATABASE_URL=postgresql://username:password@host:port/database

# AI API設定
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# セキュリティ設定
ALLOWED_ORIGINS=https://your-domain.vercel.app
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# 分析・監視
VERCEL_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn
```

### vercel.jsonの設定
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options", 
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

## 2. Netlifyデプロイ要件（代替案）
### ビルド設定
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--prefix=/opt/buildhome/.local"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[dev]
  command = "npm run dev"
  port = 3000

# リダイレクト設定
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# セキュリティヘッダー
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 3. データベース要件
### 本番データベース
- **PostgreSQL**: Vercel Postgres / PlanetScale / Supabase
- **接続プール**: PgBouncer設定（同時接続数制限）
- **SSL**: 必須（証明書検証有効）
- **バックアップ**: 日次自動バックアップ + ポイントインタイム復旧

### データベース接続設定
```javascript
// lib/db.ts
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20, // 最大接続数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

## 4. CDN・静的アセット配信
### Vercel Edge Network
- **自動CDN**: グローバルエッジキャッシュ
- **画像最適化**: Next.js Image Optimization
- **静的ファイル**: `/public` フォルダ自動配信
- **キャッシュ設定**: `Cache-Control` ヘッダー設定

### アセット最適化
```javascript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24時間
  },
  
  // 静的ファイル圧縮
  compress: true,
  
  // バンドル分析
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/components': path.resolve(__dirname, 'components'),
      }
    }
    return config
  }
}
```

## 5. 監視・ログ設定
### Vercel Analytics
```javascript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### エラー監視 (Sentry)
```javascript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/yoursite\.vercel\.app/],
    }),
  ],
})
```

## 6. CI/CD パイプライン
### GitHub Actions設定
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        
      - name: Run lint
        run: npm run lint
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 7. セキュリティ・コンプライアンス
### HTTPS・SSL設定
- **SSL証明書**: Vercel自動SSL（Let's Encrypt）
- **HSTS**: HTTP Strict Transport Security有効
- **セキュリティヘッダー**: CSP、X-Frame-Options等

### データ保護
```javascript
// middleware.ts - セキュリティミドルウェア
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // セキュリティヘッダー設定
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // CORS設定
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  return response
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|favicon.ico).*)']
}
```

## 8. パフォーマンス最適化
### Core Web Vitals
- **LCP目標**: < 2.5秒
- **FID目標**: < 100ms
- **CLS目標**: < 0.1

### 最適化設定
```javascript
// next.config.ts パフォーマンス設定
const nextConfig = {
  // 実験的機能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components', '@/lib'],
  },
  
  // バンドル最適化
  webpack: (config, { dev }) => {
    if (!dev) {
      config.optimization.splitChunks.cacheGroups = {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      }
    }
    return config
  }
}
```

## 9. スケーリング・負荷対策
### Vercel Functions制限
- **実行時間**: 30秒上限（Proプラン）
- **メモリ**: 1008MB上限 
- **同時実行**: プランに応じた制限
- **コールドスタート**: 最小化のための最適化

### レート制限実装
```javascript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 1分間に10リクエスト
  analytics: true,
})
```

## 10. 災害復旧・バックアップ
### バックアップ戦略
- **データベース**: 日次フルバックアップ + 継続的ログバックアップ
- **コード**: Git repository（複数リモート）
- **環境変数**: 暗号化された設定管理ツール
- **復旧手順**: RTO 4時間、RPO 1時間

### 災害復旧計画
```markdown
## 災害復旧手順

### レベル1: サービス一時停止（< 15分）
1. Vercel ダッシュボードでサービス状態確認
2. DNS設定確認・修正
3. 環境変数設定確認

### レベル2: アプリケーション障害（< 1時間）
1. 前回安定版へのロールバック実行
2. データベース接続・クエリ確認
3. 外部API (OpenAI/Anthropic) 接続確認

### レベル3: データ損失（< 4時間）
1. 最新バックアップからデータベース復旧
2. アプリケーション再デプロイ
3. データ整合性検証・修正
```