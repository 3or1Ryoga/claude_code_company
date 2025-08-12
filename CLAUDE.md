# 🤖 Multi-Agent AI Development System

## 📋 システム概要
完全自動化されたAI開発チーム。人間の介入なしで、プロジェクトの企画から実装まで自律的に実行します。

## 🏗️ エージェント構成
```
PRESIDENT (multiagent:0.0) - 統括責任者
    ↓ プロジェクト指示
boss1 (multiagent:0.1) - チームリーダー
    ↓ タスク割り当て
worker1 (multiagent:0.2) - フロントエンド担当
worker2 (multiagent:0.3) - バックエンド担当
```

## 🚀 クイックスタート手順

### 1. tmuxセッション起動
```bash
# 4つのペインでClaude Codeを起動
for i in {0..3}; do tmux send-keys -t multiagent:0.$i 'claude --dangerously-skip-permissions' Enter; done
```

### 2. 自動開発開始
```bash
# 完全自動化ワークフロー実行
./quick-start.sh
```

### 3. 進捗監視
```bash
# 完了状況確認
ls -la ./tmp/

# リアルタイム監視
watch "ls -la ./tmp/"
```

## 🎯 自動実行フロー

1. **PRESIDENT**: プロジェクト統括・開始指示発令
2. **boss1**: チーム管理・タスク自動割り当て
3. **worker1**: フロントエンド開発・完了ファイル作成
4. **worker2**: バックエンド開発・完了ファイル作成
5. **最終worker**: 全員完了確認・自動報告
6. **boss1**: 統合品質管理・完了報告
7. **PRESIDENT**: 最終承認・プロジェクト完了宣言

## 🔧 利用可能スクリプト

### メッセージ送信（自動実行）
```bash
./agent-send.sh [recipient] "[message]"
# recipient: president, boss1, worker1, worker2
```

### 自動ワークフロー
```bash
./quick-start.sh        # 高速2ワーカー体制
./auto-workflow.sh      # 完全版ワークフロー
./init-agents.sh        # エージェント役割初期化
```

## 📂 各エージェントの役割

### PRESIDENT (multiagent:0.0)
- **役割**: プロジェクト統括責任者
- **詳細**: @instructions/president.md
- **実行**: 要件定義・仕様書作成指示、最終品質承認

### boss1 (multiagent:0.1)  
- **役割**: 開発チームリーダー
- **詳細**: @instructions/boss.md
- **実行**: ワーカー管理、統合品質管理

### worker1 (multiagent:0.2)
- **役割**: フロントエンド開発担当
- **詳細**: @instructions/worker.md
- **実行**: Next.js UI/UX、レスポンシブ対応

### worker2 (multiagent:0.3)
- **役割**: バックエンド開発担当
- **詳細**: @instructions/worker.md  
- **実行**: API Routes、データベース、ロジック

## 🎪 完了判定システム

### ワーカー完了処理
```bash
# 各ワーカーは作業完了時に実行
touch ./tmp/worker1_done.txt  # worker1
touch ./tmp/worker2_done.txt  # worker2

# 全員完了確認・自動報告
if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then
    ./agent-send.sh boss1 "全員の作業完了しました"
fi
```

### 成功確認方法
- `./tmp/worker*_done.txt` ファイルの存在確認
- boss1からの「統合品質管理完了」報告
- PRESIDENTからの「プロジェクト完了宣言」

## 💡 使用例

### 基本的な開発プロジェクト
```bash
# 1. システム起動
./quick-start.sh

# 2. 進捗監視
watch "ls -la ./tmp/ && echo '=== 作業状況 ===' && (ls ./tmp/*.txt 2>/dev/null && echo '完了！' || echo '作業中...')"

# 3. 完了確認（3-5分後）
ls -la ./tmp/  # worker1_done.txt, worker2_done.txt があれば成功
```

### カスタム指示
```bash
# 特定のプロジェクト指示
./agent-send.sh president "あなたはpresidentです。ECサイト開発プロジェクトを開始してください。"

# 直接ワーカーに指示
./agent-send.sh worker1 "React+TypeScript でダッシュボード UI を作成してください。"
```

## ⚙️ システム復旧

### セッション再起動
```bash
# tmuxセッション確認
tmux list-sessions | grep multiagent

# セッション再作成（必要時）
tmux new-session -d -s multiagent
tmux split-window -h -t multiagent
tmux split-window -v -t multiagent:0.0  
tmux split-window -v -t multiagent:0.1
```

### Claude Code再起動
```bash
# 全ペインでClaude Code起動
for i in {0..3}; do tmux send-keys -t multiagent:0.$i 'claude --dangerously-skip-permissions' Enter; done
```

## 📋 重要ファイル
- `agent-send.sh` - 自動実行メッセージング
- `quick-start.sh` - 高速自動開始
- `instructions/*.md` - 各エージェント詳細役割
- `MULTIAGENT_README.md` - システム詳細ドキュメント

このシステムにより、AIエージェントチームが人間の介入なしで自律的にソフトウェア開発を完遂します。 