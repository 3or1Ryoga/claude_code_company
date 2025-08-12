#!/bin/bash

# Quick start for 2-worker automated development
echo "Quick Start: Automated AI Development Team"

# Clean previous state
mkdir -p ./tmp
rm -f ./tmp/worker*_done.txt 2>/dev/null

echo "🎯 Initiating PRESIDENT..."
./agent-send.sh president "あなたはpresidentです。指示書に従って。Next.js Webアプリケーション開発プロジェクト開始指示をboss1に送信してください。./agent-send.sh boss1 \"あなたはboss1です。Next.js開発プロジェクト管理開始\" を実行してください。"

sleep 3

echo "📋 Boss1 assigning tasks..."
./agent-send.sh boss1 "あなたはboss1です。worker1（フロントエンド）とworker2（バックエンド）にタスクを割り当てます。./agent-send.sh worker1 \"フロントエンド開発開始\" と ./agent-send.sh worker2 \"バックエンド開発開始\" を実行してください。"

sleep 3

echo "👨‍💻 Starting frontend development..."
./agent-send.sh worker1 "あなたはworker1です。Next.jsフロントエンド開発（UI/UX、レスポンシブ対応）を実行してください。作業完了後: 1) touch ./tmp/worker1_done.txt を実行 2) if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then ./agent-send.sh boss1 \"全員の作業完了しました\"; fi を実行"

sleep 2

echo "⚙️ Starting backend development..." 
./agent-send.sh worker2 "あなたはworker2です。Next.jsバックエンド開発（API Routes、データベース、ロジック）を実行してください。作業完了後: 1) touch ./tmp/worker2_done.txt を実行 2) if [ -f ./tmp/worker1_done.txt ] && [ -f ./tmp/worker2_done.txt ]; then ./agent-send.sh boss1 \"全員の作業完了しました\"; fi を実行"

echo "✅ All agents are working autonomously!"
echo "Monitor progress with: ls -la ./tmp/"