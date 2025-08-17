#!/bin/bash

# Quick start for Hello World automated demo
echo "🚀 Quick Start: Hello World プロジェクト自動実行"

# Clean previous state
mkdir -p ./tmp
rm -f ./tmp/worker*_done.txt 2>/dev/null

echo "===================================="
echo "期待される動作フロー："
echo "1. PRESIDENT → boss1: プロジェクト開始指示"
echo "2. boss1 → workers: Hello World 作業開始"
echo "3. workers → 完了ファイル作成 → boss1へ報告"
echo "4. boss1 → PRESIDENT: 全員完了報告"
echo "===================================="
echo ""

sleep 2

echo "🎯 Step 1: PRESIDENT → boss1"
echo "PRESIDENTにプロジェクト開始を指示..."
./agent-send.sh president "あなたはpresidentです。Hello World プロジェクト開始指示を出してください。指示書に従って、./agent-send.sh boss1 \"あなたはboss1です。Hello World プロジェクト開始指示\" を実行してください。"

echo ""
echo "✅ 自動実行開始しました！"
echo ""
echo "📊 進捗監視方法："
echo "  watch 'ls -la ./tmp/'"
echo ""
echo "📁 完了確認："
echo "  ./tmp/worker1_done.txt と worker2_done.txt が作成されれば成功"