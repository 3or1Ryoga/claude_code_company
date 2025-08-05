# OpenAI API統合テスト 品質管理ガイド

## 概要

Next.js AIチャットアプリケーションにおけるOpenAI API統合の包括的テスト戦略とベストプラクティスガイドです。

## 🎯 テスト戦略

### テストレベル構成
1. **単体テスト**: OpenAIService クラスの機能テスト
2. **統合テスト**: API統合とエラーハンドリングテスト
3. **E2Eテスト**: ユーザー体験全体のテスト
4. **環境設定テスト**: 設定と環境変数のテスト

## 🔧 実装済みテストスイート

### 1. OpenAI API統合テスト (`src/lib/services/__tests__/openaiService.test.ts`)

#### 設定検証テスト
```typescript
describe('Configuration Validation', () => {
  test('should validate valid configuration', () => {
    const config = openaiService.validateConfig();
    expect(config.isValid).toBe(true);
  });

  test('should detect missing API key', () => {
    process.env.OPENAI_API_KEY = '';
    const service = new OpenAIService();
    const config = service.validateConfig();
    expect(config.errors).toContain('OPENAI_API_KEY is required');
  });
});
```

#### API通信テスト
```typescript
test('should make successful API request', async () => {
  const response = await openaiService.generateResponse([
    { role: 'user', content: 'Hello, AI!' }
  ]);
  
  expect(response.choices[0].message.content).toBeTruthy();
  expect(response.usage.total_tokens).toBeGreaterThan(0);
});
```

### 2. 環境変数設定テスト (`src/lib/__tests__/environment-config.test.ts`)

#### APIキー検証
```typescript
test('should validate API key format', () => {
  const invalidKeys = [
    'invalid-key',
    'pk-1234567890',  // Wrong prefix
    'sk-',            // Too short
  ];

  invalidKeys.forEach(invalidKey => {
    process.env.OPENAI_API_KEY = invalidKey;
    const service = new OpenAIService();
    const config = service.validateConfig();
    expect(config.errors).toContain('OPENAI_API_KEY must start with "sk-"');
  });
});
```

#### 環境設定テスト
```typescript
test('should work in different environments', () => {
  ['development', 'production', 'test'].forEach(nodeEnv => {
    process.env.NODE_ENV = nodeEnv;
    const service = new OpenAIService();
    const config = service.validateConfig();
    expect(config.isValid).toBe(true);
  });
});
```

### 3. レート制限・エラーハンドリングテスト (`src/lib/__tests__/rate-limit-error-handling.test.ts`)

#### レート制限テスト
```typescript
test('should handle 429 rate limit error with exponential backoff', async () => {
  // Mock: Fail twice with 429, succeed on third attempt
  let attemptCount = 0;
  server.use(/* Rate limit mock */);

  const response = await openaiService.generateResponse([/*...*/]);
  expect(attemptCount).toBe(3); // Retried 3 times
});
```

#### エラー分類テスト
```typescript
test('should correctly classify error types', () => {
  const rateLimitError = new OpenAIAPIError('Rate limit', 429, 'rate_limit_exceeded');
  const authError = new OpenAIAPIError('Invalid key', 401, 'invalid_request_error');
  
  expect(rateLimitError.isRateLimitError()).toBe(true);
  expect(rateLimitError.isTemporaryError()).toBe(true);
  expect(authError.isAuthenticationError()).toBe(true);
  expect(authError.isTemporaryError()).toBe(false);
});
```

### 4. E2E AI対話テスト (`e2e/openai-integration.spec.ts`)

#### 基本対話テスト
```typescript
test('should send message and receive AI response', async ({ page }) => {
  const messageInput = page.locator('[data-testid="message-input"]');
  const sendButton = page.locator('[data-testid="send-button"]');
  
  await messageInput.fill('Hello, AI assistant!');
  await sendButton.click();
  
  await expect(page.locator('[data-testid="user-message"]').last())
    .toContainText('Hello, AI assistant!');
  await expect(page.locator('[data-testid="ai-message"]').last())
    .toBeVisible({ timeout: 10000 });
});
```

#### エラーハンドリングテスト
```typescript
test('should handle API server errors gracefully', async ({ page }) => {
  await page.route('**/api/chat/completions', route => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: { message: 'Server error' } })
    });
  });

  // Send message and verify error handling
  await messageInput.fill('This should cause an error');
  await sendButton.click();
  
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();
});
```

## 🛠 APIモックシステム

### MSW (Mock Service Worker) 設定
```typescript
// src/lib/__mocks__/msw/handlers.ts
export const handlers = [
  rest.post('https://api.openai.com/v1/chat/completions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'chatcmpl-mock123',
        choices: [{
          message: {
            role: 'assistant',
            content: 'Mock AI response'
          }
        }],
        usage: { total_tokens: 40 }
      })
    );
  })
];
```

### 動的レスポンス生成
```typescript
// E2Eテストでのインテリジェントモック
await page.route('**/api/chat/completions', async route => {
  const requestBody = JSON.parse(route.request().postData() || '{}');
  const userContent = requestBody.messages?.[0]?.content?.toLowerCase();
  
  let mockResponse = 'Default mock response';
  if (userContent?.includes('hello')) {
    mockResponse = 'Hello! How can I assist you today?';
  } else if (userContent?.includes('error')) {
    return route.fulfill({ status: 500 });
  }
  
  await route.fulfill({
    status: 200,
    body: JSON.stringify({
      choices: [{ message: { content: mockResponse } }]
    })
  });
});
```

## 🧪 テスト実行方法

### 基本テスト実行
```bash
# 単体テスト実行
npm run test

# 統合テスト実行
npm run test:integration

# OpenAI E2Eテスト実行
npm run test:openai

# ハイドレーションテスト実行
npm run test:hydration

# 全テスト実行
npm run test:all
```

### 開発時のテスト実行
```bash
# ウォッチモードで単体テスト
npm run test:watch

# UIモードでE2Eテスト
npm run test:openai:ui

# カバレッジ付きテスト
npm run test:coverage
```

## 🔐 環境設定とセキュリティ

### 必須環境変数
```bash
# .env.local (開発環境)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT=30000

# テスト環境用
OPENAI_API_KEY=sk-test-key-for-development
```

### 本番環境設定
```bash
# Vercel環境変数設定例
OPENAI_API_KEY=sk-prod-xxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_MAX_RETRIES=5
OPENAI_TIMEOUT=60000
```

### セキュリティベストプラクティス
1. **APIキー保護**: 環境変数のみ、コードにハードコーディング禁止
2. **キー形式検証**: `sk-` プレフィックス確認
3. **権限最小化**: 必要最小限のAPI権限設定
4. **ローテーション**: 定期的なAPIキー更新

## 📊 品質メトリクス

### テストカバレッジ目標
- **単体テスト**: 90%以上
- **統合テスト**: 80%以上
- **E2Eテスト**: 主要フロー100%

### パフォーマンス目標
- **API応答時間**: < 5秒（通常時）
- **エラー処理時間**: < 3秒
- **UI応答性**: < 100ms（ユーザー入力反映）

### 信頼性目標
- **API成功率**: 99%以上
- **エラーハンドリング**: 100%（全エラーケース対応）
- **リトライ成功率**: 90%以上

## 🚨 エラーハンドリング戦略

### エラー分類と対応
```typescript
// 一時的エラー（リトライ対象）
- 429 Rate Limit Exceeded → 指数バックオフでリトライ
- 500 Internal Server Error → 最大3回リトライ
- 502 Bad Gateway → 最大3回リトライ
- 503 Service Unavailable → 最大3回リトライ

// 永続的エラー（リトライ不要）
- 401 Invalid API Key → 即座に失敗、設定確認促進
- 400 Bad Request → 即座に失敗、リクエスト修正必要
- 404 Model Not Found → 即座に失敗、モデル設定確認
```

### ユーザー向けエラーメッセージ
```typescript
const getErrorMessage = (error: OpenAIAPIError): string => {
  if (error.isRateLimitError()) {
    return 'APIの利用制限に達しました。しばらく待ってから再試行してください。';
  }
  if (error.isAuthenticationError()) {
    return 'API認証エラーが発生しました。設定を確認してください。';
  }
  if (error.isQuotaExceededError()) {
    return 'API使用量の上限に達しました。アカウント設定を確認してください。';
  }
  return '一時的なエラーが発生しました。もう一度お試しください。';
};
```

## 🔍 デバッグとトラブルシューティング

### ログ分析
```typescript
// 開発環境でのデバッグログ
if (process.env.NODE_ENV === 'development') {
  console.log('OpenAI Request:', {
    model: this.model,
    messages: messages,
    timestamp: new Date().toISOString()
  });
  
  console.log('OpenAI Response:', {
    id: response.id,
    usage: response.usage,
    responseTime: Date.now() - startTime
  });
}
```

### よくある問題と解決方法

#### 1. APIキー関連
```bash
# 問題: "Invalid API key provided"
# 解決: APIキー形式確認
echo $OPENAI_API_KEY | grep "^sk-" || echo "Invalid format"

# 問題: "API key not found"
# 解決: 環境変数設定確認
node -e "console.log(process.env.OPENAI_API_KEY ? 'Found' : 'Missing')"
```

#### 2. レート制限
```typescript
// 問題: 頻繁な429エラー
// 解決: リクエスト間隔の調整
const rateLimiter = new RateLimiter({
  tokensPerInterval: 60,
  interval: 'minute'
});

await rateLimiter.removeTokens(1);
const response = await openaiService.generateResponse(messages);
```

#### 3. タイムアウト
```typescript
// 問題: リクエストタイムアウト
// 解決: タイムアウト値の調整
process.env.OPENAI_TIMEOUT = '60000'; // 60秒に延長
```

## 📈 監視とアラート

### メトリクス収集
```typescript
// API使用量監視
export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokenUsage: number;
  costEstimate: number;
}

// エラー率監視
const errorRate = (failedRequests / totalRequests) * 100;
if (errorRate > 5) {
  sendAlert('High API error rate detected');
}
```

### コスト監視
```typescript
// トークン使用量とコスト計算
const calculateCost = (usage: TokenUsage, model: string): number => {
  const pricing = {
    'gpt-3.5-turbo': { input: 0.001, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 }
  };
  
  const rate = pricing[model];
  return (usage.prompt_tokens * rate.input + usage.completion_tokens * rate.output) / 1000;
};
```

## 🚀 CI/CD統合

### GitHub Actions設定
```yaml
# .github/workflows/test.yml
- name: Run OpenAI Integration Tests
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_API_KEY }}
  run: |
    npm run test:integration
    npm run test:openai

- name: Check API Configuration
  run: |
    npm run test -- --testNamePattern="environment-config"
```

### テスト環境分離
```typescript
// テスト専用のOpenAIサービス設定
const testOpenAIService = new OpenAIService({
  apiKey: process.env.OPENAI_TEST_API_KEY,
  baseURL: process.env.OPENAI_TEST_BASE_URL || 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo', // テストでは安価なモデル使用
  maxRetries: 1 // テストでは少ないリトライ
});
```

## 📚 ベストプラクティス

### 1. テスト設計
- **独立性**: 各テストは独立して実行可能
- **決定性**: 同じ入力で同じ結果
- **高速性**: 単体テストは1秒以内
- **可読性**: テスト名で意図を明確化

### 2. モック戦略
- **開発時**: 実APIとモックの併用
- **CI/CD**: 完全モック環境
- **ステージング**: 実API環境でのテスト
- **本番**: 監視とアラートのみ

### 3. エラーハンドリング
- **グレースフルデグラデーション**: エラー時も基本機能維持
- **ユーザー体験**: 分かりやすいエラーメッセージ
- **復旧支援**: 再試行や代替手段の提供
- **ログ記録**: トラブルシューティング用の詳細ログ

## 🎯 品質ゲート

### リリース前チェックリスト
- [ ] 全単体テスト成功（90%以上カバレッジ）
- [ ] 統合テスト成功（主要エラーケース含む）
- [ ] E2Eテスト成功（実際のユーザーフロー）
- [ ] 環境変数設定確認
- [ ] API制限・コスト試算完了
- [ ] エラーハンドリング動作確認
- [ ] パフォーマンス基準達成
- [ ] セキュリティ監査完了

### 継続的品質改善
1. **週次**: エラー率・応答時間監視
2. **月次**: コスト分析・最適化
3. **四半期**: API使用パターン分析
4. **年次**: セキュリティ監査・APIキーローテーション