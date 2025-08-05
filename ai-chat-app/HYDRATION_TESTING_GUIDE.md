# ハイドレーションエラー テスト・品質管理ガイド

## 概要

Next.js AIチャットアプリケーションにおけるSSR/CSRハイドレーションエラーの検知、監視、およびテスト戦略の包括的なガイドです。

## 🎯 ハイドレーションエラーとは

ハイドレーションエラーは、サーバーサイドレンダリング（SSR）で生成されたHTMLと、クライアントサイドレンダリング（CSR）で生成されるHTMLが一致しない場合に発生します。

### 主な原因
- 時刻・タイムスタンプの動的生成
- ランダム値・UUID生成
- localStorage/sessionStorageの状態依存
- 環境変数の差異
- ユーザーエージェント検出
- 条件分岐の不整合

## 🔍 実装済みテストシステム

### 1. E2Eハイドレーションエラー検知テスト
**ファイル**: `e2e/hydration-errors.spec.ts`

```typescript
// 基本的なハイドレーションエラー検知
test('should not have hydration errors on initial page load', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  const hydrationErrors = consoleErrors.filter(error => 
    error.includes('Hydration') || error.includes('hydration')
  );
  
  expect(hydrationErrors).toHaveLength(0);
});
```

**検知項目**:
- ページ初期読み込み時のハイドレーションエラー
- タイムスタンプ関連のミスマッチ
- localStorage依存コンポーネントの問題
- 動的インポートのハイドレーション問題
- テーマ切り替え時の不整合
- フォーム状態のハイドレーション
- window/document アクセスエラー

### 2. SSR/CSRミスマッチ検知テスト
**ファイル**: `e2e/ssr-csr-mismatch.spec.ts`

```typescript
// サーバーHTMLとクライアントHTMLの比較
test('should compare initial server HTML with hydrated HTML', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const serverHTML = await page.evaluate(() => document.documentElement.innerHTML);
  
  await page.waitForLoadState('networkidle');
  const clientHTML = await page.evaluate(() => document.documentElement.innerHTML);
  
  const similarity = calculateStringSimilarity(serverHTML, clientHTML);
  expect(similarity).toBeGreaterThan(0.95); // 95%以上の類似度を要求
});
```

**検証項目**:
- HTML構造の差異分析
- 文字列類似度計算（Levenshtein距離）
- ストレージ依存コンテンツの検証
- 条件分岐ミスマッチの検出
- 動的インポートとコード分割の検証
- 環境変数依存レンダリングの確認

### 3. リアルタイム監視システム
**ファイル**: `src/lib/utils/hydration-monitor.ts`

```typescript
// ハイドレーションエラー監視
const hydrationMonitor = new HydrationMonitor({
  maxErrors: 100,
  reportingEndpoint: '/api/errors/hydration',
  autoStart: true
});

// エラー検知時の自動報告
hydrationMonitor.start();
```

**機能**:
- コンソールエラーの自動キャプチャ
- React Error Boundaryエラーの監視
- DOM変更の疑わしいパターン検出
- パフォーマンス監視（長時間タスク検知）
- エラー統計とメトリクス収集
- 外部レポートエンドポイントへの送信

### 4. 開発用デバッグパネル
**ファイル**: `src/components/HydrationMonitorProvider.tsx`

```typescript
// 開発環境でのリアルタイムエラー表示
<HydrationMonitorProvider enabled={process.env.NODE_ENV === 'development'}>
  <App />
</HydrationMonitorProvider>
```

**デバッグ機能**:
- リアルタイムエラー表示
- ヘルスステータス監視（healthy/warning/critical）
- エラー詳細情報の表示
- エラーレポートのエクスポート
- エラー履歴のクリア機能

## 🛠 実装済みハイドレーション対策

### 1. LocalStorageの安全な使用
```typescript
// useLocalStorage.ts - ハイドレーション安全な実装
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // クライアントサイドでのみlocalStorageにアクセス
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    
    if (isClient) {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    }
  };

  return [storedValue, setValue, clearValue] as const;
}
```

### 2. 決定的なID生成
```typescript
// useChat.ts - ハイドレーション安全なID生成
let messageIdCounter = 0;

export function useChat() {
  const initTimeRef = useRef<number>(Date.now());

  const sendMessage = useCallback(async (content: string) => {
    const now = Date.now();
    const userMessage: Message = {
      id: `msg-${initTimeRef.current}-${++messageIdCounter}`, // 決定的ID
      content: content.trim(),
      role: 'user',
      timestamp: new Date(now), // 固定タイムスタンプ
    };
    // ...
  }, []);
}
```

### 3. タイムスタンプの正規化
```typescript
// datetime.ts - サーバー・クライアント間でのタイムスタンプ統一
export function formatArrayTimestamps<T extends Record<string, any>>(
  array: T[]
): T[] {
  return array.map(item => formatTimestampFields(item));
}

export function formatTimestampFields<T extends Record<string, any>>(
  obj: T
): T {
  const formatted = { ...obj };
  
  Object.keys(formatted).forEach(key => {
    if (formatted[key] instanceof Date) {
      formatted[key] = formatted[key].toISOString() as any;
    }
  });
  
  return formatted;
}
```

## 🧪 テスト実行方法

### 1. 単体テスト実行
```bash
npm run test              # Jest単体テスト実行
npm run test:coverage     # カバレッジ付きテスト実行
npm run test:watch        # ウォッチモードでテスト実行
```

### 2. E2Eテスト実行
```bash
npm run test:e2e          # 全E2Eテスト実行
npm run test:e2e:ui       # UIモードでE2Eテスト実行

# 特定のテストファイルのみ実行
npx playwright test e2e/hydration-errors.spec.ts
npx playwright test e2e/ssr-csr-mismatch.spec.ts
```

### 3. ハイドレーション監視の有効化
```bash
# 開発環境で監視を有効化
NODE_ENV=development npm run dev

# 本番環境で監視を有効化（レポート送信付き）
HYDRATION_REPORTING_ENDPOINT=/api/errors/hydration npm run start
```

## 📊 エラー分析とレポート

### 1. エラーメトリクス
```typescript
interface HydrationMetrics {
  totalErrors: number;              // 総エラー数
  errorsByType: Record<string, number>;   // タイプ別エラー数
  errorsByPage: Record<string, number>;   // ページ別エラー数
  lastError?: HydrationError;       // 最新エラー
}
```

### 2. ヘルスステータス判定
- **healthy**: 過去1分間にエラーなし
- **warning**: 過去1分間に1-2個のエラー
- **critical**: 過去1分間に3個以上のエラー

### 3. エラーレポートの生成
```typescript
// デバッグ用レポート生成
const report = hydrationMonitor.exportReport();
console.log(report);

// 外部サービスへの自動送信
fetch('/api/errors/hydration', {
  method: 'POST',
  body: JSON.stringify(report)
});
```

## 🔧 トラブルシューティング

### よくあるハイドレーションエラーと対策

#### 1. Timestamp Mismatch
**問題**: `new Date()` や `Date.now()` の使用
```typescript
// ❌ 問題のあるコード
function Component() {
  return <div>Current time: {new Date().toISOString()}</div>;
}

// ✅ 修正版
function Component() {
  const [currentTime, setCurrentTime] = useState<string>('');
  
  useEffect(() => {
    setCurrentTime(new Date().toISOString());
  }, []);
  
  return <div>Current time: {currentTime}</div>;
}
```

#### 2. LocalStorage Dependency
**問題**: 初期レンダリング時のlocalStorage依存
```typescript
// ❌ 問題のあるコード  
function Component() {
  const [data, setData] = useState(
    JSON.parse(localStorage.getItem('data') || '[]')
  );
  return <div>{data.length} items</div>;
}

// ✅ 修正版（useLocalStorageフックを使用）
function Component() {
  const [data] = useLocalStorage('data', []);
  return <div>{data.length} items</div>;
}
```

#### 3. Random Value Generation
**問題**: ランダム値の生成
```typescript
// ❌ 問題のあるコード
function Component() {
  const id = Math.random().toString(36);
  return <div id={id}>Content</div>;
}

// ✅ 修正版
function Component() {
  const [id, setId] = useState<string>('');
  
  useEffect(() => {
    setId(Math.random().toString(36));
  }, []);
  
  return <div id={id}>Content</div>;
}
```

### 4. 環境変数依存レンダリング
**問題**: クライアント・サーバー間での環境変数の差異
```typescript
// ❌ 問題のあるコード
function Component() {
  if (process.env.NODE_ENV === 'development') {
    return <DebugPanel />;
  }
  return <ProductionView />;
}

// ✅ 修正版
function Component() {
  const [isDevelopment, setIsDevelopment] = useState(false);
  
  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);
  
  if (isDevelopment) {
    return <DebugPanel />;
  }
  return <ProductionView />;
}
```

## 📈 継続的監視

### 1. CI/CDパイプラインでの自動テスト
```yaml
# .github/workflows/deploy.yml
- name: Run Hydration Tests
  run: |
    npm run test:e2e -- --grep "hydration"
    npm run test:e2e -- --grep "ssr-csr-mismatch"
```

### 2. 本番環境での監視
```typescript
// 本番環境での監視設定
const monitor = new HydrationMonitor({
  enabled: process.env.NODE_ENV === 'production',
  reportingEndpoint: process.env.HYDRATION_REPORTING_ENDPOINT,
  maxErrors: 50,
});
```

### 3. アラート設定
```typescript
// Slack/Email通知の設定例
hydrationMonitor.on('critical', (metrics) => {
  sendAlert({
    type: 'critical',
    message: `Critical hydration errors detected: ${metrics.totalErrors}`,
    metrics: metrics
  });
});
```

## 🎯 品質目標

- **ハイドレーションエラー率**: < 0.1%
- **HTML類似度**: > 95%
- **エラー検知時間**: < 3秒
- **修正対応時間**: < 24時間（critical）, < 1週間（warning）

## 📚 参考資料

- [Next.js Hydration Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Troubleshooting](https://react.dev/reference/react-dom/client/hydrateRoot#troubleshooting)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)