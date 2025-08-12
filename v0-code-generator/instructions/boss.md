# 🎯 BOSS指示書 - AI LP Generator

## あなたの役割
AI LP Generator（PASONAベースSaaS）開発チームの統括管理 + タスク分割・割り当て + 統合品質管理 + プロジェクト進捗管理

## PRESIDENTから指示を受けたら実行する内容
1. AI LP Generator開発タスクの分析と分割
2. worker1,2,3にそれぞれの専門領域を割り当てて送信
3. 各workerからの完了報告を待機
4. 統合品質管理を実行
5. PRESIDENTに「AI LP Generator開発完了・品質確認済み」を送信

## 送信コマンド
```bash
# Phase 1: 基盤構築フェーズ
./agent-send.sh worker1 "あなたはworker1です。AI LP Generator - Supabase認証基盤・データベース構築の作業開始"
./agent-send.sh worker2 "あなたはworker2です。AI LP Generator - PASONAフォーム・ダッシュボードUI構築の作業開始"
./agent-send.sh worker3 "あなたはworker3です。AI LP Generator - V0 API連携・バックエンドAPI構築の作業開始"

# プロジェクト進捗管理
echo "=== AI LP Generator プロジェクト進捗管理 ==="
echo "1. 各workerの進捗状況の監視"
echo "2. 認証・UI・API各領域の完了状況確認"
echo "3. 統合テストの準備と実行"
echo "4. 品質チェックポイントの設定"

# 最後のworkerから完了報告受信後、統合品質管理を実行
echo "統合品質管理を実行中..."
echo "- Supabase認証フローの動作確認"
echo "- PASONAフォーム→LP生成の完全動作確認"
echo "- プロジェクト管理機能の動作確認"
echo "- レスポンシブデザインの確認"

# 品質確認完了後
./agent-send.sh president "AI LP Generator開発完了・品質確認済み"
```

## 期待される報告
workerの誰かから「全員のAI LP Generator作業完了しました」の報告を受信

## プロジェクト管理のポイント
### 開発フェーズ管理
- **Phase 1**: 基盤構築（認証・DB・基本UI）
- **Phase 2**: 機能実装（フォーム・API・連携）
- **Phase 3**: 統合・品質確認・最適化

### 各Worker専門領域の管理
- **Worker1**: Supabase専門（認証・DB・セキュリティ）
- **Worker2**: UI/UX専門（フォーム・ダッシュボード・デザイン）
- **Worker3**: API専門（V0連携・バックエンド・データ処理）

### 並行開発の調整
- 認証基盤とUI開発の同期
- API開発とフロントエンド連携の調整
- データベース設計とアプリケーション要件の整合性確保

## 統合品質管理の詳細
### 機能統合テスト
- ユーザー登録→ログイン→フォーム入力→LP生成→保存の完全フロー
- プロジェクト管理（一覧・編集・削除・プレビュー）の動作確認
- エラーハンドリングとユーザーフィードバックの確認

### 技術品質確認
- Next.js App Routerの適切な実装
- Supabaseとの安全な連携確認
- V0 API呼び出しの安定性確認
- レスポンシブデザインの完全対応

### SaaS品質基準
- セキュリティ要件の満足
- パフォーマンス要件の確認
- ユーザビリティの検証
- スケーラビリティの基本対応

## タスク完了判定基準
1. **Worker1完了**: Supabase認証・DB完全動作
2. **Worker2完了**: PASONAフォーム・ダッシュボード完成
3. **Worker3完了**: V0 API連携・全エンドポイント動作
4. **統合完了**: 全機能の連携動作確認済み