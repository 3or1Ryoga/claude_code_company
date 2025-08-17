#!/bin/bash

# Agent Communication Script with Safe Multiline Paste Support
# Usage: ./agent-send-safe.sh [recipient] "[message]"
# Usage: ./agent-send-safe.sh --file [recipient] [filepath]
# Usage: ./agent-send-safe.sh --stdin [recipient]
# Usage: ./agent-send-safe.sh --announce [recipient] "[message]"
# Usage: ./agent-send-safe.sh --list
# Features: Bracketed paste, large text support (10KB+), safe character handling

# Create logs directory if it doesn't exist
mkdir -p logs

# Initialize variables
RECIPIENT=""
MESSAGE=""
FROM_FILE=false
FROM_STDIN=false
ANNOUNCE=false
FILEPATH=""

# Parse command line arguments
case "$1" in
    "--list")
        echo "📋 Available agents:"
        echo "   president  - Project Supervisor (president session)"
        echo "   boss1      - Team Leader (multiagent:0.0)"
        echo "   worker1    - Task Executor A (multiagent:0.1)" 
        echo "   worker2    - Task Executor B (multiagent:0.2)"
        echo "   worker3    - Task Executor C (multiagent:0.3)"
        echo ""
        echo "💡 Usage examples:"
        echo "   ./agent-send-safe.sh worker1 \"Hello World\""
        echo "   ./agent-send-safe.sh --file worker1 message.txt"
        echo "   echo \"Hello\" | ./agent-send-safe.sh --stdin worker1"
        echo "   ./agent-send-safe.sh --announce worker1 \"Important message\""
        echo ""
        echo "🔒 Safe multiline features:"
        echo "   - Bracketed paste for multiline content"
        echo "   - Large message chunking (10KB+ support)"
        echo "   - Safe handling of special characters"
        echo "   - Japanese text and code block support"
        exit 0
        ;;
    "--file")
        FROM_FILE=true
        RECIPIENT="$2"
        FILEPATH="$3"
        ;;
    "--stdin")
        FROM_STDIN=true
        RECIPIENT="$2"
        ;;
    "--announce")
        ANNOUNCE=true
        RECIPIENT="$2"
        MESSAGE="$3"
        ;;
    *)
        RECIPIENT="$1"
        MESSAGE="$2"
        ;;
esac

# Validate recipient
if [ -z "$RECIPIENT" ]; then
    echo "❌ Error: Recipient is required"
    echo "Usage: ./agent-send-safe.sh [recipient] \"[message]\""
    echo "       ./agent-send-safe.sh --file [recipient] [filepath]"
    echo "       ./agent-send-safe.sh --stdin [recipient]"
    echo "       ./agent-send-safe.sh --announce [recipient] \"[message]\""
    echo "       ./agent-send-safe.sh --list"
    exit 1
fi

# Read message from file if --file option is used
if [ "$FROM_FILE" = true ]; then
    if [ -z "$FILEPATH" ]; then
        echo "❌ Error: File path is required with --file option"
        exit 1
    fi
    if [ ! -f "$FILEPATH" ]; then
        echo "❌ Error: File '$FILEPATH' does not exist"
        exit 1
    fi
    MESSAGE=$(cat "$FILEPATH")
    if [ -z "$MESSAGE" ]; then
        echo "❌ Error: File '$FILEPATH' is empty"
        exit 1
    fi
    echo "📄 Reading message from file: $FILEPATH"
fi

# Read message from stdin if --stdin option is used
if [ "$FROM_STDIN" = true ]; then
    echo "📥 Reading message from stdin (Press Ctrl+D to finish)..."
    MESSAGE=$(cat)
    if [ -z "$MESSAGE" ]; then
        echo "❌ Error: No input received from stdin"
        exit 1
    fi
    echo "✅ Message received from stdin"
fi

# Validate message
if [ -z "$MESSAGE" ]; then
    echo "❌ Error: Message is required"
    echo "Use --file or --stdin options for multiline messages"
    exit 1
fi

# Map recipients to tmux sessions/panes
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
        echo "Use './agent-send-safe.sh --list' to see all available agents"
        exit 1
        ;;
esac

# Show announcement if --announce option is used
if [ "$ANNOUNCE" = true ]; then
    echo "📢 ===== MESSAGE PREVIEW ====="
    echo "🎯 Recipient: $RECIPIENT ($DESCRIPTION)"
    echo "📍 Target Pane: $PANE"
    echo "📝 Message Length: $(echo -n "$MESSAGE" | wc -c) characters"
    echo "📄 Message Lines: $(echo "$MESSAGE" | wc -l) lines"
    echo ""
    echo "💬 Message Content:"
    echo "─────────────────────────────────────────"
    echo "$MESSAGE"
    echo "─────────────────────────────────────────"
    echo ""
    read -p "🤔 Send this message? (y/N): " confirm
    case "$confirm" in
        [yY]|[yY][eE][sS])
            echo "✅ Confirmed! Sending message..."
            ;;
        *)
            echo "❌ Cancelled by user"
            exit 0
            ;;
    esac
fi

# Function to safely send multiline content using tmux load-buffer + paste-buffer
send_safe_multiline() {
    local pane="$1"
    local message="$2"
    
    # Check if target session/pane exists
    if ! tmux has-session -t "${pane%:*}" 2>/dev/null; then
        echo "❌ Error: Session ${pane%:*} does not exist"
        echo "Run './setup.sh' to create the required sessions"
        exit 1
    fi
    
    # Check message size and enable large text handling if needed
    MESSAGE_SIZE=$(echo -n "$message" | wc -c)
    
    if [ "$MESSAGE_SIZE" -gt 10240 ]; then
        echo "🔄 Large message detected (${MESSAGE_SIZE} bytes) - using chunked transfer"
        send_large_message "$pane" "$message"
        return $?
    fi
    
    # For small messages, check if multiline handling is needed
    if echo "$message" | grep -q $'\n'; then
        echo "📄 Multiline message detected - using bracketed paste"
        send_bracketed_paste "$pane" "$message"
        return $?
    else
        echo "📝 Single line message - using standard send-keys"
        tmux send-keys -t "$pane" "$message" Enter
        return $?
    fi
}

# Function to send content using bracketed paste mode
send_bracketed_paste() {
    local pane="$1" 
    local message="$2"
    
    # Create temporary file for safe content handling
    TEMP_FILE=$(mktemp)
    trap 'rm -f "$TEMP_FILE"' EXIT
    
    # Write message to temp file with proper encoding
    printf '%s' "$message" > "$TEMP_FILE"
    
    echo "🔒 Using bracketed paste mode for safe multiline transmission"
    
    # Clear any existing input
    tmux send-keys -t "$pane" C-c
    sleep 0.2
    
    # Load message content into tmux buffer
    tmux load-buffer "$TEMP_FILE"
    
    # Enable bracketed paste mode in target terminal
    tmux send-keys -t "$pane" $'\033[?2004h'
    sleep 0.1
    
    # Send bracketed paste start sequence
    tmux send-keys -t "$pane" $'\033[200~' -l
    
    # Paste the actual content
    tmux paste-buffer -t "$pane" -p
    
    # Send bracketed paste end sequence + Enter
    tmux send-keys -t "$pane" $'\033[201~' -l
    tmux send-keys -t "$pane" Enter
    
    # Disable bracketed paste mode
    tmux send-keys -t "$pane" $'\033[?2004l'
    
    return 0
}

# Function to handle large messages (10KB+) with chunking
send_large_message() {
    local pane="$1"
    local message="$2"
    local chunk_size=8192
    local temp_dir=$(mktemp -d)
    local chunk_count=0
    
    trap 'rm -rf "$temp_dir"' EXIT
    
    echo "📦 Splitting large message into chunks..."
    
    # Split message into chunks
    echo -n "$message" | split -b "$chunk_size" - "$temp_dir/chunk_"
    
    # Count chunks
    chunk_count=$(ls "$temp_dir"/chunk_* 2>/dev/null | wc -l)
    echo "📊 Created $chunk_count chunks of max ${chunk_size} bytes each"
    
    # Send initialization message
    tmux send-keys -t "$pane" "# Receiving large multiline message ($chunk_count chunks)" Enter
    sleep 0.5
    
    # Prepare for large message reception
    tmux send-keys -t "$pane" C-c
    sleep 0.2
    
    # Send each chunk using bracketed paste
    local chunk_num=1
    for chunk_file in "$temp_dir"/chunk_*; do
        echo "📤 Sending chunk $chunk_num/$chunk_count..."
        
        # Load chunk into buffer
        tmux load-buffer "$chunk_file"
        
        # Enable bracketed paste for chunk
        tmux send-keys -t "$pane" $'\033[?2004h'
        sleep 0.1
        
        # Send bracketed paste start sequence
        tmux send-keys -t "$pane" $'\033[200~' -l
        
        # Paste chunk content
        tmux paste-buffer -t "$pane" -p
        
        # Send bracketed paste end sequence (no Enter for intermediate chunks)
        tmux send-keys -t "$pane" $'\033[201~' -l
        
        # Only send Enter on the final chunk
        if [ "$chunk_num" -eq "$chunk_count" ]; then
            tmux send-keys -t "$pane" Enter
        fi
        
        # Disable bracketed paste
        tmux send-keys -t "$pane" $'\033[?2004l'
        
        sleep 0.3  # Brief pause between chunks
        chunk_num=$((chunk_num + 1))
    done
    
    echo "✅ Large message sent successfully in $chunk_count chunks"
    return 0
}

# Log the message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SOURCE_INFO=""
if [ "$FROM_FILE" = true ]; then
    SOURCE_INFO=" [from file: $FILEPATH]"
elif [ "$FROM_STDIN" = true ]; then
    SOURCE_INFO=" [from stdin]"
elif [ "$ANNOUNCE" = true ]; then
    SOURCE_INFO=" [announced]"
fi
echo "[$TIMESTAMP] $RECIPIENT ($DESCRIPTION)$SOURCE_INFO: $MESSAGE" >> logs/send_log.txt

# Main execution
echo "📤 Sending message to $RECIPIENT ($DESCRIPTION) at $PANE"
echo "📊 Message size: $(echo -n "$MESSAGE" | wc -c) bytes"
if echo "$MESSAGE" | grep -q $'\n'; then
    echo "📄 Message lines: $(echo "$MESSAGE" | wc -l) lines"
fi

# Call the safe multiline function
if send_safe_multiline "$PANE" "$MESSAGE"; then
    echo "✅ Message sent and executed automatically!"
    echo "📝 Logged to: logs/send_log.txt"
    if [ "$FROM_FILE" = true ]; then
        echo "📄 Source: $FILEPATH"
    elif [ "$FROM_STDIN" = true ]; then
        echo "📥 Source: Standard input"
    fi
    
    # Wait for processing
    sleep 1
else
    echo "❌ Failed to send message"
    exit 1
fi