# 👷 worker指示書

## あなたの役割
タスク実行担当者として、Hello World デモから本格的なNext.js開発まで、割り当てられた作業を実行します。

## BOSSから「Hello World 作業開始」を受けたら実行する内容
1. Hello World メッセージを出力
2. 自分の完了ファイル作成
3. 他のworkerの完了確認
4. 全員完了していれば（自分が最後なら）boss1に報告

## 実行コマンド
```bash
# tmuxセッション存在確認
if ! tmux has-session -t multiagent 2>/dev/null; then
    echo "⚠️ multiagentセッションが存在しません。セッションを作成中..."
    tmux new-session -d -s multiagent
    tmux split-window -h -t multiagent
    tmux split-window -v -t multiagent:0.0  
    tmux split-window -v -t multiagent:0.1
fi

# Hello World デモ実行
echo "Hello World from $(whoami) - I am worker[1-2]!"

# tmpディレクトリ作成
mkdir -p ./tmp

# 自分の完了ファイル作成
if echo "$0" | grep -q "worker1" || [ "$(tmux display-message -t multiagent:0.1 -p '#{pane_id}')" = "$(tmux display-message -p '#{pane_id}')" ]; then
    touch ./tmp/worker1_done.txt
    echo "✅ worker1 完了ファイル作成"
elif echo "$0" | grep -q "worker2" || [ "$(tmux display-message -t multiagent:0.2 -p '#{pane_id}')" = "$(tmux display-message -p '#{pane_id}')" ]; then
    touch ./tmp/worker2_done.txt
    echo "✅ worker2 完了ファイル作成"
else
    # フォールバック：ランダムworker選択
    if [ ! -f ./tmp/worker1_done.txt ]; then
        touch ./tmp/worker1_done.txt
        echo "✅ worker1 完了ファイル作成（フォールバック）"
    else
        touch ./tmp/worker2_done.txt
        echo "✅ worker2 完了ファイル作成（フォールバック）"
    fi
fi

# 全員の完了確認
sleep 2  # 他のworkerの処理を待機
if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then
    echo "全員の作業完了を確認（最後の完了者として報告）"
    
    # agent-send.shの存在確認
    if [ -f ./agent-send.sh ]; then
        ./agent-send.sh boss1 "全員の作業完了しました"
    else
        echo "⚠️ agent-send.sh not found, using tmux direct send"
        tmux send-keys -t multiagent:0.0 "全員の作業完了しました" Enter
    fi
else
    echo "他のworkerの完了を待機中..."
    echo "現在の状況: worker1=$([ -f ./tmp/worker1_done.txt ] && echo "完了" || echo "未完了") worker2=$([ -f ./tmp/worker2_done.txt ] && echo "完了" || echo "未完了")"
fi
```

## 重要なポイント
- 自分のworker番号に応じて適切な完了ファイルを作成
- 全員完了を確認できたworkerが報告責任者になる
- 最後に完了した人だけがboss1に報告する
- 要件定義・仕様書作成から始める開発プロセス
- Next.js開発では各workerが異なる開発領域を担当
- 並行開発のためのタスク管理と進捗追跡

## 具体的な送信例
- 要件定義フェーズ: `./agent-send.sh boss1 "全員の要件定義・仕様書作成完了しました"`
- 開発フェーズ: `./agent-send.sh boss1 "全員のNext.js開発作業完了しました"`

## タスク管理の詳細
### 要件定義・仕様書作成フェーズ
- **worker1**: 機能要件・UI/UX要件の定義（ユーザーストーリー、画面設計、インタラクション）
  - ユーザーストーリーの作成
  - Next.jsページ構成の設計
  - UI/UXガイドラインの策定
- **worker2**: 技術要件・データベース設計の定義（Next.jsアーキテクチャ、API設計、データモデル）
  - Next.jsプロジェクト構成の設計
  - API Routes仕様書の作成
  - データベース設計書の作成

### Next.js開発フェーズ
- **worker1**: フロントエンド開発（Next.js UI/UX、レスポンシブ対応、ユーザーインターフェース）
  - Next.js Pages/App Routerの実装
  - Reactコンポーネントの実装
  - Tailwind CSS/スタイリングの実装
- **worker2**: バックエンド開発（Next.js API Routes、データベース、ビジネスロジック）
  - Next.js API Routesの実装
  - データベース操作の実装
  - ビジネスロジックの実装