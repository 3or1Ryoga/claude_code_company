#!/bin/bash

# Automated AI Agent Workflow
echo "Starting automated AI agent workflow..."

# Create tmp directory for completion tracking
mkdir -p ./tmp
rm -f ./tmp/worker*_done.txt 2>/dev/null

echo "Step 1: PRESIDENT initiates project..."
./agent-send.sh president "あなたはpresidentです。指示書に従って。Next.js Webアプリケーション開発プロジェクト開始指示をboss1に送信してください。"

sleep 3

echo "Step 2: BOSS1 assigns tasks to workers..."
./agent-send.sh boss1 "あなたはboss1です。PRESIDENTから指示を受けました。以下の3つのworkerにタスクを並行で割り当ててください:"

sleep 2

echo "Step 3: Assigning frontend development to worker1..."
./agent-send.sh worker1 "あなたはworker1です。Next.jsフロントエンド開発（UI/UX、レスポンシブ対応）の作業を開始してください。完了後は./tmp/worker1_done.txtファイルを作成し、全員の完了を確認して最後なら報告してください。"

sleep 2

echo "Step 4: Assigning backend development to worker2..."  
./agent-send.sh worker2 "あなたはworker2です。Next.jsバックエンド開発（API Routes、データベース、ロジック）の作業を開始してください。完了後は./tmp/worker2_done.txtファイルを作成し、全員の完了を確認して最後なら報告してください。"

sleep 2

echo "Step 5: Assigning testing to worker3 (if available)..."
if tmux list-panes -t multiagent | grep -q "0.4"; then
    ./agent-send.sh worker3 "あなたはworker3です。Next.jsテスト・デプロイ（品質確認、Vercel/Netlifyデプロイ）の作業を開始してください。完了後は./tmp/worker3_done.txtファイルを作成し、全員の完了を確認して最後なら報告してください。"
else
    echo "Worker3 pane not found, creating worker2 as combined backend+test worker"
fi

echo "Automated workflow initiated!"
echo "Monitoring completion status..."

# Monitor completion
while true; do
    if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then
        if [ -f ./tmp/worker3_done.txt ] || ! tmux list-panes -t multiagent | grep -q "0.4"; then
            echo "All workers completed! Triggering boss1 completion..."
            ./agent-send.sh boss1 "全員の作業完了しました。統合品質管理を実行してPRESIDENTに報告してください。"
            sleep 3
            ./agent-send.sh president "Next.js開発完了・品質確認済み。最終承認をお願いします。"
            break
        fi
    fi
    sleep 5
done

echo "Workflow completed successfully!"