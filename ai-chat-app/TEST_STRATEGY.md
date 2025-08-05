# Next.js AIチャットアプリ テスト戦略・計画書

## 1. テスト戦略概要
- **テストピラミッド**: Unit > Integration > E2E の順で実装
- **テスト自動化**: CI/CD パイプラインでの自動実行
- **カバレッジ目標**: 80%以上のコードカバレッジ
- **テスト環境**: Staging環境での統合テスト

## 2. 単体テスト (Unit Testing)
### 技術スタック
- **フレームワーク**: Jest + Testing Library (React)
- **モック**: MSW (Mock Service Worker) for API
- **設定**: `jest.config.js` + `setupTests.ts`

### テスト対象
```javascript
// 例: コンポーネントテスト
describe('ChatMessage Component', () => {
  test('renders user message correctly', () => {
    render(<ChatMessage message="Hello" sender="user" />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
  
  test('renders AI response with proper styling', () => {
    render(<ChatMessage message="Hi there!" sender="ai" />)
    expect(screen.getByText('Hi there!')).toHaveClass('ai-message')
  })
})
```

### 対象範囲
- **React コンポーネント**: 表示ロジック、プロパティ処理
- **ユーティリティ関数**: 日付フォーマット、文字列処理
- **カスタムフック**: useChat, useAuth等の状態管理
- **API ルート**: Next.js API Routes単体テスト

## 3. 統合テスト (Integration Testing)
### テスト範囲
- **API 統合**: フロントエンド ↔ Next.js API Routes
- **データベース統合**: API Routes ↔ Database
- **AI API統合**: OpenAI/Anthropic API統合テスト
- **認証フロー**: NextAuth.js 認証統合

### テストシナリオ
```javascript
// 例: チャット機能統合テスト
describe('Chat Integration', () => {
  test('complete chat flow from user input to AI response', async () => {
    // 1. ユーザーメッセージ送信
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello AI' }})
    fireEvent.click(screen.getByText('Send'))
    
    // 2. API呼び出し確認
    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument()
    })
    
    // 3. AI レスポンス表示確認
    await waitFor(() => {
      expect(screen.getByText(/AI response/)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
```

## 4. E2E テスト (End-to-End Testing)
### 技術スタック
- **フレームワーク**: Playwright
- **実行環境**: GitHub Actions / Vercel Preview
- **ブラウザ**: Chrome, Firefox, Safari

### テストシナリオ
```javascript
// playwright/chat-flow.spec.ts
test('complete user journey', async ({ page }) => {
  // 1. ログイン
  await page.goto('/auth/signin')
  await page.fill('[data-testid=email]', 'user@test.com')
  await page.fill('[data-testid=password]', 'password123')
  await page.click('[data-testid=signin-button]')
  
  // 2. チャット開始
  await page.goto('/chat')
  await page.fill('[data-testid=message-input]', 'Hello, AI assistant!')
  await page.click('[data-testid=send-button]')
  
  // 3. AI応答確認
  await page.waitForSelector('[data-testid=ai-message]', { timeout: 10000 })
  const aiResponse = await page.textContent('[data-testid=ai-message]')
  expect(aiResponse).toBeTruthy()
})
```

## 5. パフォーマンステスト
### Core Web Vitals測定
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1

### ツール・測定
```javascript
// lighthouse CI設定
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/chat'],
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}]
      }
    }
  }
}
```

## 6. セキュリティテスト
### 自動脆弱性テスト
- **依存関係**: `npm audit` + Snyk
- **SAST**: ESLint security rules
- **Container Scanning**: Docker image vulnerability scan

### 手動セキュリティテスト
```javascript
// セキュリティテストケース例
describe('Security Tests', () => {
  test('prevents XSS injection', async () => {
    const maliciousInput = '<script>alert("XSS")</script>'
    await page.fill('[data-testid=message-input]', maliciousInput)
    await page.click('[data-testid=send-button]')
    
    // スクリプトが実行されないことを確認
    const messageText = await page.textContent('[data-testid=user-message]')
    expect(messageText).toBe(maliciousInput) // エスケープされて表示
  })
  
  test('enforces rate limiting', async () => {
    // 連続リクエストでレート制限テスト
    for(let i = 0; i < 100; i++) {
      await page.click('[data-testid=send-button]')
    }
    await expect(page.locator('[data-testid=rate-limit-error]')).toBeVisible()
  })
})
```

## 7. テスト実行・CI/CD統合
### GitHub Actions設定
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      # Unit & Integration Tests
      - run: npm ci
      - run: npm run test:coverage
      
      # E2E Tests
      - run: npx playwright install
      - run: npm run test:e2e
      
      # Security Tests  
      - run: npm audit
      - run: npm run test:security
      
      # Performance Tests
      - run: npm run lighthouse:ci
```

## 8. テストデータ管理
### テスト用データベース
- **Test DB**: SQLite (ローカル) / PostgreSQL (CI)
- **シード データ**: 一貫したテストデータ作成
- **データクリーンアップ**: テスト間のデータ初期化

### モック・Stub
```javascript
// MSW API mocking
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.post('/api/chat', (req, res, ctx) => {
    return res(
      ctx.json({
        message: 'Mocked AI response',
        timestamp: new Date().toISOString()
      })
    )
  })
)
```

## 9. テスト監視・レポート
### カバレッジレポート
- **Tool**: Istanbul/nyc
- **出力**: HTML + JSON レポート
- **閾値**: 80% minimum coverage

### テスト結果分析
- **Jest**: テスト実行時間・成功率追跡
- **Playwright**: テスト失敗時のスクリーンショット/動画
- **CI Metrics**: ビルド時間・テスト時間の監視

## 10. テスト保守・運用
### 定期メンテナンス
- **依存関係更新**: 月次テストライブラリ更新
- **テストケース見直し**: 四半期毎のテスト有効性確認
- **パフォーマンス基準**: 本番メトリクスに基づく調整

### テスト品質管理
- **Code Review**: テストコードのレビュー必須
- **Test Documentation**: テストケースの目的・期待値明記
- **Flaky Test対策**: 不安定テストの特定・修正プロセス