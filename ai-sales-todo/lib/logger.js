/**
 * 音声認識ToDo自動完了機能専用ロガー
 * Worker3 - エラーハンドリングとログ出力実装
 */

class VoiceToDoLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // 最大ログ保存数
    this.isDebugMode = process.env.NODE_ENV === 'development';
  }

  /**
   * ログレベル定義
   */
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
  };

  /**
   * ログエントリ作成
   */
  createLogEntry(level, category, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level,
      category: category,
      message: message,
      data: data,
      sessionId: this.getSessionId()
    };

    this.logs.push(entry);

    // ログ数制限
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    return entry;
  }

  /**
   * セッションID取得
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = `voice-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * コンソール出力
   */
  outputToConsole(entry) {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[entry.level] || 'UNKNOWN';
    const prefix = `🎤 [${levelName}][${entry.category}]`;
    
    switch (entry.level) {
      case VoiceToDoLogger.LEVELS.DEBUG:
        if (this.isDebugMode) {
          console.debug(prefix, entry.message, entry.data || '');
        }
        break;
      case VoiceToDoLogger.LEVELS.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case VoiceToDoLogger.LEVELS.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case VoiceToDoLogger.LEVELS.ERROR:
        console.error(prefix, entry.message, entry.data || '');
        break;
      case VoiceToDoLogger.LEVELS.CRITICAL:
        console.error('🚨' + prefix, entry.message, entry.data || '');
        break;
    }
  }

  /**
   * DEBUG レベルログ
   */
  debug(category, message, data = null) {
    const entry = this.createLogEntry(VoiceToDoLogger.LEVELS.DEBUG, category, message, data);
    this.outputToConsole(entry);
    return entry;
  }

  /**
   * INFO レベルログ
   */
  info(category, message, data = null) {
    const entry = this.createLogEntry(VoiceToDoLogger.LEVELS.INFO, category, message, data);
    this.outputToConsole(entry);
    return entry;
  }

  /**
   * WARN レベルログ
   */
  warn(category, message, data = null) {
    const entry = this.createLogEntry(VoiceToDoLogger.LEVELS.WARN, category, message, data);
    this.outputToConsole(entry);
    return entry;
  }

  /**
   * ERROR レベルログ
   */
  error(category, message, data = null) {
    const entry = this.createLogEntry(VoiceToDoLogger.LEVELS.ERROR, category, message, data);
    this.outputToConsole(entry);
    return entry;
  }

  /**
   * CRITICAL レベルログ
   */
  critical(category, message, data = null) {
    const entry = this.createLogEntry(VoiceToDoLogger.LEVELS.CRITICAL, category, message, data);
    this.outputToConsole(entry);
    return entry;
  }

  /**
   * 特定カテゴリのログ取得
   */
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * 特定レベル以上のログ取得
   */
  getLogsByLevel(minLevel) {
    return this.logs.filter(log => log.level >= minLevel);
  }

  /**
   * 時間範囲でのログ取得
   */
  getLogsByTimeRange(startTime, endTime) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= startTime && logTime <= endTime;
    });
  }

  /**
   * ログエクスポート
   */
  exportLogs(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv':
        return this.logsToCSV();
      case 'text':
        return this.logsToText();
      default:
        return this.logs;
    }
  }

  /**
   * CSV形式変換
   */
  logsToCSV() {
    if (this.logs.length === 0) return '';
    
    const headers = ['timestamp', 'level', 'category', 'message', 'sessionId'];
    const csvRows = [headers.join(',')];
    
    this.logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.sessionId
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * テキスト形式変換
   */
  logsToText() {
    return this.logs.map(log => 
      `${log.timestamp} [${log.level}][${log.category}] ${log.message}`
    ).join('\n');
  }

  /**
   * ログクリア
   */
  clearLogs() {
    const clearedCount = this.logs.length;
    this.logs = [];
    this.info('SYSTEM', `ログクリア完了: ${clearedCount}件削除`);
    return clearedCount;
  }
}

// シングルトンインスタンス
const logger = new VoiceToDoLogger();

/**
 * カテゴリ別の専用ロガー関数
 */
export const voiceLogger = {
  // 音声認識関連
  speech: {
    start: () => logger.info('SPEECH', '音声認識開始'),
    stop: () => logger.info('SPEECH', '音声認識停止'),
    result: (transcript) => logger.debug('SPEECH', '音声認識結果', { transcript }),
    error: (error) => logger.error('SPEECH', '音声認識エラー', { error }),
    timeout: () => logger.warn('SPEECH', '音声認識タイムアウト')
  },

  // ToDo処理関連
  todo: {
    processing: (todoCount) => logger.info('TODO', `ToDo照合開始: ${todoCount}件`),
    match: (todo, similarity) => logger.info('TODO', `ToDo一致検出: ${todo}`, { similarity }),
    complete: (todo, method) => logger.info('TODO', `ToDo完了: ${todo}`, { method }),
    noMatch: (transcript) => logger.debug('TODO', '一致するToDo無し', { transcript }),
    error: (error, context) => logger.error('TODO', 'ToDo処理エラー', { error, context })
  },

  // 類似度計算関連
  similarity: {
    calculating: (todoText, speechText) => logger.debug('SIMILARITY', '類似度計算中', { todoText, speechText }),
    result: (similarity, threshold) => logger.debug('SIMILARITY', `類似度結果: ${similarity} (閾値: ${threshold})`),
    match: (similarity, threshold) => logger.info('SIMILARITY', `閾値超過: ${similarity} >= ${threshold}`),
    noMatch: (similarity, threshold) => logger.debug('SIMILARITY', `閾値未満: ${similarity} < ${threshold}`),
    error: (error) => logger.error('SIMILARITY', '類似度計算エラー', { error })
  },

  // 30秒間隔処理関連
  interval: {
    start: () => logger.info('INTERVAL', '30秒間隔処理開始'),
    execute: (count) => logger.debug('INTERVAL', `30秒間隔処理実行 #${count}`),
    complete: (completedTodos) => logger.info('INTERVAL', '30秒間隔処理完了', { completedTodos }),
    stop: () => logger.info('INTERVAL', '30秒間隔処理停止'),
    error: (error) => logger.error('INTERVAL', '30秒間隔処理エラー', { error })
  },

  // API通信関連
  api: {
    request: (url, method, data) => logger.debug('API', `API呼び出し: ${method} ${url}`, { data }),
    response: (url, status, data) => logger.debug('API', `APIレスポンス: ${url} (${status})`, { data }),
    error: (url, error) => logger.error('API', `API呼び出しエラー: ${url}`, { error }),
    timeout: (url) => logger.warn('API', `APIタイムアウト: ${url}`)
  },

  // パフォーマンス関連
  performance: {
    start: (operation) => {
      const startTime = Date.now();
      logger.debug('PERFORMANCE', `処理開始: ${operation}`, { startTime });
      return startTime;
    },
    end: (operation, startTime) => {
      const duration = Date.now() - startTime;
      logger.info('PERFORMANCE', `処理完了: ${operation} (${duration}ms)`);
      return duration;
    },
    slow: (operation, duration, threshold = 2000) => {
      if (duration > threshold) {
        logger.warn('PERFORMANCE', `処理時間警告: ${operation} (${duration}ms > ${threshold}ms)`);
      }
    }
  },

  // システム関連
  system: {
    init: (component) => logger.info('SYSTEM', `${component} 初期化完了`),
    error: (component, error) => logger.critical('SYSTEM', `${component} システムエラー`, { error }),
    memory: (usage) => logger.debug('SYSTEM', 'メモリ使用量', { usage }),
    cleanup: (component) => logger.info('SYSTEM', `${component} クリーンアップ完了`)
  }
};

/**
 * エラーハンドリング用のラッパー関数
 */
export const withErrorHandling = (fn, context = 'Unknown') => {
  return async (...args) => {
    const startTime = voiceLogger.performance.start(context);
    
    try {
      const result = await fn(...args);
      const duration = voiceLogger.performance.end(context, startTime);
      voiceLogger.performance.slow(context, duration);
      return result;
    } catch (error) {
      voiceLogger.system.error(context, error);
      throw error;
    }
  };
};

/**
 * パフォーマンス監視デコレーター
 */
export const withPerformanceMonitoring = (fn, name) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      
      voiceLogger.performance.end(name, startTime);
      
      if (duration > 1000) {
        voiceLogger.performance.slow(name, duration, 1000);
      }
      
      return result;
    } catch (error) {
      voiceLogger.system.error(name, error);
      throw error;
    }
  };
};

/**
 * ログ管理用のユーティリティ
 */
export const logUtils = {
  // ログサマリー取得
  getSummary: () => {
    const totalLogs = logger.logs.length;
    const byLevel = {};
    const byCategory = {};
    
    logger.logs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    });
    
    return {
      total: totalLogs,
      byLevel,
      byCategory,
      sessionId: logger.getSessionId()
    };
  },

  // エラーログのみ取得
  getErrors: () => logger.getLogsByLevel(VoiceToDoLogger.LEVELS.ERROR),

  // 最近のログ取得
  getRecent: (count = 50) => logger.logs.slice(-count),

  // ログエクスポート
  export: (format = 'json') => logger.exportLogs(format),

  // ログクリア
  clear: () => logger.clearLogs()
};

export default logger;