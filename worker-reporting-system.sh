#!/bin/bash

# Worker Reporting System - Enhanced with PRESIDENT monitoring
# worker1専用の確実な報告システム

WORKER_ID="worker1"
STATUS_FILE="./tmp/completion_status.json"
LOG_FILE="./tmp/worker1_reporting.log"

# ログ出力関数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 状態報告関数
report_status() {
    local task="$1"
    local task_status="$2" 
    local details="$3"
    local timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    log_message "📊 Status Report: $task - $task_status"
    
    # JSON状態ファイル更新
    cat > "$STATUS_FILE" << EOF
{
  "worker_id": "$WORKER_ID",
  "task": "$task",
  "status": "$task_status",
  "timestamp": "$timestamp",
  "details": "$details",
  "president_monitoring": true,
  "last_update": "$timestamp"
}
EOF
    
    log_message "✅ Status file updated: $STATUS_FILE"
}

# agent-send.shの確実実行関数
send_message_reliable() {
    local recipient="$1"
    local message="$2"
    local max_retries=3
    local retry_count=0
    
    log_message "📤 Attempting to send message to $recipient"
    
    while [ $retry_count -lt $max_retries ]; do
        if ./agent-send.sh "$recipient" "$message"; then
            log_message "✅ Message sent successfully to $recipient"
            return 0
        else
            retry_count=$((retry_count + 1))
            log_message "❌ Message send failed (attempt $retry_count/$max_retries)"
            
            if [ $retry_count -lt $max_retries ]; then
                log_message "⏳ Retrying in 2 seconds..."
                sleep 2
            fi
        fi
    done
    
    log_message "🚨 CRITICAL: Failed to send message after $max_retries attempts"
    return 1
}

# 完了報告関数
complete_task() {
    local task="$1"
    local details="$2"
    
    log_message "🎯 Task completion initiated: $task"
    
    # 状態を完了に更新
    report_status "$task" "completed" "$details"
    
    # completion markerファイル作成
    touch "./tmp/worker1_done.txt"
    log_message "✅ Completion marker created"
    
    # boss1への確実な報告
    if send_message_reliable "boss1" "worker1完了報告: $task"; then
        log_message "✅ Boss1 notification successful"
    else
        log_message "🚨 CRITICAL: Boss1 notification failed"
        exit 1
    fi
    
    log_message "🎉 Task completion sequence finished"
}

# 進行中状態報告
progress_update() {
    local task="$1"
    local progress_details="$2"
    
    report_status "$task" "in_progress" "$progress_details"
    log_message "📈 Progress updated: $progress_details"
}

# エクスポート関数（他のスクリプトから使用可能）
export -f report_status
export -f send_message_reliable
export -f complete_task
export -f progress_update
export -f log_message

log_message "🚀 Worker Reporting System initialized"