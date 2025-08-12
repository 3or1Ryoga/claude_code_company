#!/bin/bash

# Agent Communication Script with Auto-execution and Logging
# Usage: ./agent-send.sh [recipient] "[message]"
# Usage: ./agent-send.sh --list

# Create logs directory if it doesn't exist
mkdir -p logs

# Check for --list option
if [ "$1" = "--list" ]; then
    echo "📋 Available agents:"
    echo "   president  - Project Supervisor (president session)"
    echo "   boss1      - Team Leader (multiagent:0.0)"
    echo "   worker1    - Task Executor A (multiagent:0.1)" 
    echo "   worker2    - Task Executor B (multiagent:0.2)"
    echo "   worker3    - Task Executor C (multiagent:0.3)"
    exit 0
fi

RECIPIENT=$1
MESSAGE=$2

if [ -z "$RECIPIENT" ] || [ -z "$MESSAGE" ]; then
    echo "Usage: ./agent-send.sh [recipient] \"[message]\""
    echo "       ./agent-send.sh --list"
    exit 1
fi

# Map recipients to tmux sessions/panes based on README.md
case $RECIPIENT in
    "president")
        PANE="president"
        DESCRIPTION="Project Supervisor"
        ;;
    "boss1")
        PANE="multiagent:0.0"
        DESCRIPTION="Team Leader"
        ;;
    "worker1")
        PANE="multiagent:0.1"
        DESCRIPTION="Task Executor A"
        ;;
    "worker2")
        PANE="multiagent:0.2"
        DESCRIPTION="Task Executor B"
        ;;
    "worker3")
        PANE="multiagent:0.3"
        DESCRIPTION="Task Executor C"
        ;;
    *)
        echo "Unknown recipient: $RECIPIENT"
        echo "Valid recipients: president, boss1, worker1, worker2, worker3"
        echo "Use './agent-send.sh --list' to see all available agents"
        exit 1
        ;;
esac

# Log the message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] $RECIPIENT ($DESCRIPTION): $MESSAGE" >> logs/send_log.txt

# Send message to tmux pane with auto-execution
echo "Sending message to $RECIPIENT ($DESCRIPTION) at $PANE: $MESSAGE"

# Check if target session/pane exists
if ! tmux has-session -t "${PANE%:*}" 2>/dev/null; then
    echo "❌ Error: Session ${PANE%:*} does not exist"
    echo "Run './setup.sh' to create the required sessions"
    exit 1
fi

tmux send-keys -t "$PANE" "$MESSAGE" Enter

# Wait a moment for processing
sleep 1

echo "✅ Message sent and executed automatically!"
echo "📝 Logged to: logs/send_log.txt"