#!/bin/bash

# Tmux Multi-Agent Communication Demo Setup Script
# Based on README.md specifications

echo "🤖 Setting up Tmux Multi-Agent Communication Demo..."

# Kill existing sessions if they exist
echo "⚠️  Cleaning up existing sessions..."
tmux kill-session -t multiagent 2>/dev/null || true
tmux kill-session -t president 2>/dev/null || true

# Create logs directory
mkdir -p logs
mkdir -p tmp

# Remove old completion files
rm -f ./tmp/worker*_done.txt 2>/dev/null

echo "📊 Creating PRESIDENT session (1 pane)..."
tmux new-session -d -s president

echo "📊 Creating multiagent session (4 panes)..."
# Create multiagent session with first pane
tmux new-session -d -s multiagent

# Split into 4 panes
tmux split-window -h -t multiagent
tmux split-window -v -t multiagent:0.0  
tmux split-window -v -t multiagent:0.1

# Label the panes
tmux send-keys -t multiagent:0.0 'echo "boss1 - Team Leader"' C-m
tmux send-keys -t multiagent:0.1 'echo "worker1 - Task Executor A"' C-m
tmux send-keys -t multiagent:0.2 'echo "worker2 - Task Executor B"' C-m
tmux send-keys -t multiagent:0.3 'echo "worker3 - Task Executor C"' C-m

tmux send-keys -t president 'echo "PRESIDENT - Project Supervisor"' C-m

echo "✅ Session setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Attach to sessions:"
echo "   tmux attach-session -t multiagent"
echo "   tmux attach-session -t president  # (in another terminal)"
echo ""
echo "2. Start Claude Code:"
echo "   # First authenticate PRESIDENT:"
echo "   tmux send-keys -t president 'claude --dangerously-skip-permissions' C-m"
echo ""
echo "   # Then start multiagent (after PRESIDENT authentication):"
echo "   for i in {0..3}; do tmux send-keys -t multiagent:0.\$i 'claude --dangerously-skip-permissions' C-m; done"
echo ""
echo "3. Start demo:"
echo "   # In PRESIDENT session, enter:"
echo "   あなたはpresidentです。指示書に従って"
echo ""
echo "🎯 Sessions created:"
echo "   📊 president: 1 pane (PRESIDENT)"
echo "   📊 multiagent: 4 panes (boss1, worker1, worker2, worker3)"

