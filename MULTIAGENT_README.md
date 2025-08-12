# 🤖 Multi-Agent AI Development System

完全自動化されたAI開発チームシステム

## 🏗️ システム構成

```
PRESIDENT (pane 0) 
    ↓ 統括指示
boss1 (pane 1)
    ↓ タスク割り当て
worker1 (pane 2) ← フロントエンド
worker2 (pane 3) ← バックエンド
```

## 🚀 使用方法

### 1. 基本セットアップ
```bash
# tmuxセッション起動（既に実行済みの場合スキップ）
for i in {0..3}; do tmux send-keys -t multiagent:0.$i 'claude --dangerously-skip-permissions' Enter; done
```

### 2. 完全自動化フロー実行
```bash
# クイックスタート（推奨）
./quick-start.sh

# 完全版ワークフロー
./auto-workflow.sh

# カスタム指示（手動）
./agent-send.sh president "あなたはpresidentです。指示書に従って"
```

### 3. 進捗監視
```bash
# 完了ファイル確認
ls -la ./tmp/

# リアルタイム監視
watch "ls -la ./tmp/"
```

## 🎯 自動フロー内容

1. **PRESIDENT**: プロジェクト開始指示を発令
2. **boss1**: workerにタスクを自動割り当て
3. **worker1**: フロントエンド開発を実行し完了ファイル作成
4. **worker2**: バックエンド開発を実行し完了ファイル作成
5. **最後のworker**: 全員完了を確認してboss1に自動報告
6. **boss1**: 統合品質管理後PRESIDENTに報告
7. **PRESIDENT**: 最終承認と完了宣言

## 🔧 スクリプト詳細

- `agent-send.sh`: 自動実行付きメッセージ送信
- `quick-start.sh`: 2ワーカー体制の高速開始
- `auto-workflow.sh`: 完全版自動ワークフロー
- `init-agents.sh`: 各エージェントの役割初期化

## 📋 完了判定

ワーカーは作業完了時に以下を実行：
```bash
touch ./tmp/worker1_done.txt  # worker1の場合
touch ./tmp/worker2_done.txt  # worker2の場合
```

全員完了時に最後のworkerが自動報告：
```bash
if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then
    ./agent-send.sh boss1 "全員の作業完了しました"
fi
```

## 🎪 デモ実行例

```bash
# 1. エージェント組織を自動起動
./quick-start.sh

# 2. 進捗監視
watch "ls -la ./tmp/ && echo '=== Status ===' && cat ./tmp/*.txt 2>/dev/null || echo 'Working...'"

# 3. 完了まで待機（通常3-5分）
# worker1_done.txt, worker2_done.txt が作成されれば完了
```

## 🏆 成功の確認

- `./tmp/worker1_done.txt` と `./tmp/worker2_done.txt` が存在
- boss1から「統合品質管理完了」報告
- PRESIDENTから「プロジェクト完了宣言」

完全自動化により、人間の介入なしでAI開発チームが自律的に作業を完遂します！