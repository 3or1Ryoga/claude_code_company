#!/bin/bash

# Initialize all agents with their role instructions
echo "Initializing AI agent organization..."

# Initialize PRESIDENT
echo "Setting up PRESIDENT (pane 0)..."
tmux send-keys -t multiagent:0.0 'あなたはpresidentです。指示書に従って以下を実行してください: 1) Next.js Webアプリケーション開発プロジェクト開始指示をboss1に送信 2) 統合品質管理完了報告を待機 3) 最終承認とプロジェクト完了宣言を行う' Enter

sleep 2

# Initialize BOSS1
echo "Setting up BOSS1 (pane 1)..."
tmux send-keys -t multiagent:0.1 'あなたはboss1です。PRESIDENTからの指示を受けたら以下を実行: 1) worker1,2,3にNext.js開発作業を割り当て 2) 各workerの完了報告を待機 3) 統合品質管理を実行 4) PRESIDENTに完了報告を送信' Enter

sleep 2

# Initialize WORKER1 (Frontend)
echo "Setting up WORKER1 - Frontend (pane 2)..."
tmux send-keys -t multiagent:0.2 'あなたはworker1です。boss1からの指示を受けたら以下を実行: 1) Next.jsフロントエンド開発（UI/UX、レスポンシブ対応）を実行 2) 自分の完了ファイル(./tmp/worker1_done.txt)を作成 3) 他workerの完了を確認し最後なら報告' Enter

sleep 2

# Initialize WORKER2 (Backend)  
echo "Setting up WORKER2 - Backend (pane 3)..."
tmux send-keys -t multiagent:0.3 'あなたはworker2です。boss1からの指示を受けたら以下を実行: 1) Next.jsバックエンド開発（API Routes、データベース、ロジック）を実行 2) 自分の完了ファイル(./tmp/worker2_done.txt)を作成 3) 他workerの完了を確認し最後なら報告' Enter

echo "All agents initialized and ready for autonomous operation!"
echo "To start the development process, run:"
echo "./agent-send.sh president \"あなたはpresidentです。指示書に従って\""