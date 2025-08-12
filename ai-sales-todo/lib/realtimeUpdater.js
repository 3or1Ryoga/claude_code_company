/**
 * リアルタイムToDo状態更新処理システム
 * 音声認識結果による自動完了とUI同期
 */

import { matchTodosWithTranscription } from './todoMatcher';

/**
 * リアルタイムToDo更新管理クラス
 */
export class RealtimeUpdater {
  constructor(options = {}) {
    this.updateInterval = options.updateInterval || 5000; // 5秒間隔
    this.batchSize = options.batchSize || 10; // バッチ処理サイズ
    this.updateQueue = []; // 更新待ちキュー
    this.isProcessing = false;
    this.listeners = new Map(); // イベントリスナー
    this.processTimer = null;
    
    // 自動バッチ処理開始
    this.startBatchProcessor();
  }

  /**
   * ToDo完了更新をキューに追加
   * @param {Object} updateData - 更新データ
   */
  queueUpdate(updateData) {
    const update = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...updateData
    };
    
    this.updateQueue.push(update);
    console.log(`[RealtimeUpdater] 更新をキューに追加: ${this.updateQueue.length}件待機中`);
    
    // 即座に処理する場合のオプション
    if (updateData.immediate) {
      this.processUpdateQueue();
    }
  }

  /**
   * バッチ処理開始
   */
  startBatchProcessor() {
    if (this.processTimer) {
      clearInterval(this.processTimer);
    }
    
    this.processTimer = setInterval(() => {
      if (this.updateQueue.length > 0) {
        this.processUpdateQueue();
      }
    }, this.updateInterval);
    
    console.log(`[RealtimeUpdater] バッチ処理開始 - ${this.updateInterval}ms間隔`);
  }

  /**
   * バッチ処理停止
   */
  stopBatchProcessor() {
    if (this.processTimer) {
      clearInterval(this.processTimer);
      this.processTimer = null;
    }
    console.log('[RealtimeUpdater] バッチ処理停止');
  }

  /**
   * 更新キューの処理
   */
  async processUpdateQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[RealtimeUpdater] バッチ処理開始 - ${this.updateQueue.length}件の更新を処理`);

    try {
      // バッチサイズ分の更新を取得
      const batch = this.updateQueue.splice(0, this.batchSize);
      
      // 並列処理で更新実行
      const results = await Promise.allSettled(
        batch.map(update => this.executeSingleUpdate(update))
      );

      // 結果集計
      let successCount = 0;
      let errorCount = 0;
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          // 成功イベント発火
          this.emitEvent('updateSuccess', {
            update: batch[index],
            result: result.value
          });
        } else {
          errorCount++;
          console.error(`[RealtimeUpdater] 更新エラー:`, result.reason);
          // エラーイベント発火
          this.emitEvent('updateError', {
            update: batch[index],
            error: result.reason
          });
        }
      });

      console.log(`[RealtimeUpdater] バッチ処理完了 - 成功: ${successCount}, エラー: ${errorCount}`);
      
      // バッチ処理完了イベント
      this.emitEvent('batchComplete', {
        successCount,
        errorCount,
        totalProcessed: batch.length,
        remainingQueue: this.updateQueue.length
      });

    } catch (error) {
      console.error('[RealtimeUpdater] バッチ処理エラー:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 単一更新の実行
   * @param {Object} update - 更新データ
   */
  async executeSingleUpdate(update) {
    try {
      switch (update.type) {
        case 'complete_todo':
          return await this.completeTodo(update);
        case 'voice_match':
          return await this.processVoiceMatch(update);
        case 'similarity_update':
          return await this.updateSimilarity(update);
        case 'batch_complete':
          return await this.batchCompleteTodos(update);
        default:
          throw new Error(`未対応の更新タイプ: ${update.type}`);
      }
    } catch (error) {
      console.error(`[RealtimeUpdater] 更新実行エラー (${update.type}):`, error);
      throw error;
    }
  }

  /**
   * ToDo完了処理
   * @param {Object} update - 完了データ
   */
  async completeTodo(update) {
    const { todoId, transcribedText, similarity, method } = update;
    
    console.log(`[RealtimeUpdater] ToDo完了処理: #${todoId} (類似度: ${similarity})`);

    // API経由で完了処理
    const response = await fetch('/api/todos', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        todoId: todoId,
        completed: true,
        completedBy: method || 'voice_recognition',
        transcribedText: transcribedText,
        similarity: similarity,
        completedAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`API エラー: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[RealtimeUpdater] ToDo #${todoId} 完了成功`);
    
    return {
      todoId: todoId,
      success: true,
      apiResult: result,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * 音声マッチング処理
   * @param {Object} update - 音声マッチングデータ
   */
  async processVoiceMatch(update) {
    const { transcribedText, todos, threshold } = update;
    
    console.log(`[RealtimeUpdater] 音声マッチング処理: "${transcribedText}"`);

    // 高精度マッチング実行
    const matches = await matchTodosWithTranscription(transcribedText, todos, threshold);
    
    // マッチしたToDoを自動完了キューに追加
    matches.forEach(match => {
      this.queueUpdate({
        type: 'complete_todo',
        todoId: match.todoId,
        transcribedText: transcribedText,
        similarity: match.similarity,
        method: 'voice_auto_match',
        immediate: match.similarity >= 0.9 // 高類似度は即座処理
      });
    });

    return {
      matches: matches,
      autoQueuedCount: matches.length,
      transcribedText: transcribedText
    };
  }

  /**
   * 類似度更新処理
   * @param {Object} update - 類似度データ
   */
  async updateSimilarity(update) {
    const { todoId, similarity, method } = update;
    
    console.log(`[RealtimeUpdater] 類似度更新: ToDo #${todoId} = ${similarity}`);
    
    // 類似度がしきい値を超えた場合、自動完了キューに追加
    if (similarity >= 0.8) {
      this.queueUpdate({
        type: 'complete_todo',
        todoId: todoId,
        similarity: similarity,
        method: method,
        autoTriggered: true
      });
    }

    return {
      todoId: todoId,
      similarity: similarity,
      autoTriggered: similarity >= 0.8
    };
  }

  /**
   * 複数ToDo一括完了処理
   * @param {Object} update - 一括完了データ
   */
  async batchCompleteTodos(update) {
    const { todoIds, transcribedText, method } = update;
    
    console.log(`[RealtimeUpdater] 一括完了処理: ${todoIds.length}個のToDo`);

    const results = await Promise.allSettled(
      todoIds.map(todoId => 
        this.completeTodo({
          todoId: todoId,
          transcribedText: transcribedText,
          method: method,
          batchOperation: true
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.length - successCount;

    return {
      totalCount: todoIds.length,
      successCount: successCount,
      errorCount: errorCount,
      results: results
    };
  }

  /**
   * イベントリスナーの登録
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * イベントリスナーの削除
   * @param {string} event - イベント名
   * @param {Function} callback - コールバック関数
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * イベント発火
   * @param {string} event - イベント名
   * @param {Object} data - イベントデータ
   */
  emitEvent(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[RealtimeUpdater] イベントコールバックエラー (${event}):`, error);
        }
      });
    }
  }

  /**
   * 統計情報の取得
   */
  getStats() {
    return {
      queueSize: this.updateQueue.length,
      isProcessing: this.isProcessing,
      updateInterval: this.updateInterval,
      batchSize: this.batchSize,
      listeners: Object.fromEntries(
        Array.from(this.listeners.entries()).map(([event, callbacks]) => [
          event,
          callbacks.length
        ])
      ),
      uptime: Date.now() - this.startTime || 0
    };
  }

  /**
   * リソースクリーンアップ
   */
  destroy() {
    this.stopBatchProcessor();
    this.updateQueue = [];
    this.listeners.clear();
    console.log('[RealtimeUpdater] リソースクリーンアップ完了');
  }
}

/**
 * グローバルリアルタイム更新インスタンス
 */
let globalUpdater = null;

/**
 * リアルタイム更新インスタンスの取得/作成
 * @param {Object} options - オプション
 * @returns {RealtimeUpdater} 更新インスタンス
 */
export function getRealtimeUpdater(options = {}) {
  if (!globalUpdater) {
    globalUpdater = new RealtimeUpdater(options);
    globalUpdater.startTime = Date.now();
  }
  return globalUpdater;
}

/**
 * 音声認識結果による自動ToDo完了処理
 * @param {string} transcribedText - 音声認識テキスト
 * @param {Array} todos - ToDo配列
 * @param {number} threshold - 類似度しきい値
 * @param {Function} onComplete - 完了コールバック
 */
export async function processVoiceCompletion(transcribedText, todos, threshold = 0.7, onComplete) {
  const updater = getRealtimeUpdater();
  
  // 完了コールバックの登録
  if (onComplete) {
    updater.on('updateSuccess', (data) => {
      if (data.update.type === 'complete_todo') {
        onComplete(data.update.todoId, data.result);
      }
    });
  }
  
  // 音声マッチング処理をキューに追加
  updater.queueUpdate({
    type: 'voice_match',
    transcribedText: transcribedText,
    todos: todos,
    threshold: threshold,
    immediate: true // 音声認識結果は即座に処理
  });
}

/**
 * デバウンス機能付きリアルタイム更新
 * @param {Object} updateData - 更新データ
 * @param {number} delay - デバウンス遅延時間（ミリ秒）
 */
const debounceTimers = new Map();

export function debouncedUpdate(updateData, delay = 1000) {
  const key = `${updateData.type}_${updateData.todoId || 'global'}`;
  
  // 既存のタイマーをクリア
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }
  
  // 新しいタイマーを設定
  const timer = setTimeout(() => {
    const updater = getRealtimeUpdater();
    updater.queueUpdate(updateData);
    debounceTimers.delete(key);
  }, delay);
  
  debounceTimers.set(key, timer);
}

export default RealtimeUpdater;