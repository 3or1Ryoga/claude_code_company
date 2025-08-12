/**
 * 音声認識ToDo自動完了機能 - デバッグツール
 * Worker3 - 実際の音声入力での動作確認とデバッグ
 */

// import { voiceLogger } from '../lib/logger.js';

// 簡易ロガー（デバッグ用）
const voiceLogger = {
  debug: (category, message, data) => console.log(`[DEBUG][${category}] ${message}`, data || ''),
  info: (category, message, data) => console.log(`[INFO][${category}] ${message}`, data || ''),
  warn: (category, message, data) => console.warn(`[WARN][${category}] ${message}`, data || ''),
  error: (category, message, data) => console.error(`[ERROR][${category}] ${message}`, data || '')
};

/**
 * デバッグセッション管理クラス
 */
export class VoiceDebugSession {
  constructor() {
    this.sessionId = `debug-${Date.now()}`;
    this.startTime = new Date();
    this.events = [];
    this.metrics = {
      totalProcessingTime: 0,
      speechRecognitionAttempts: 0,
      successfulMatches: 0,
      failedMatches: 0,
      apiCalls: 0,
      errors: 0
    };
  }

  /**
   * イベント記録
   */
  recordEvent(type, data) {
    const event = {
      timestamp: new Date().toISOString(),
      type: type,
      data: data,
      sessionTime: Date.now() - this.startTime.getTime()
    };
    
    this.events.push(event);
    voiceLogger.debug('DEBUG', `イベント記録: ${type}`, data);
    
    return event;
  }

  /**
   * メトリクス更新
   */
  updateMetrics(metric, value = 1) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value;
    this.recordEvent('METRICS_UPDATE', { metric, value });
  }

  /**
   * セッションサマリー取得
   */
  getSummary() {
    const duration = Date.now() - this.startTime.getTime();
    
    return {
      sessionId: this.sessionId,
      duration: duration,
      durationFormatted: this.formatDuration(duration),
      totalEvents: this.events.length,
      metrics: this.metrics,
      successRate: this.calculateSuccessRate(),
      performanceScore: this.calculatePerformanceScore()
    };
  }

  /**
   * 成功率計算
   */
  calculateSuccessRate() {
    const total = this.metrics.successfulMatches + this.metrics.failedMatches;
    return total > 0 ? Math.round((this.metrics.successfulMatches / total) * 100) : 0;
  }

  /**
   * パフォーマンススコア計算
   */
  calculatePerformanceScore() {
    const errorRate = this.metrics.errors / Math.max(this.metrics.apiCalls, 1);
    const baseScore = Math.max(0, 100 - (errorRate * 100));
    const speedBonus = this.metrics.totalProcessingTime < 5000 ? 10 : 0;
    
    return Math.min(100, Math.round(baseScore + speedBonus));
  }

  /**
   * 期間フォーマット
   */
  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  }

  /**
   * レポート出力
   */
  generateReport() {
    const summary = this.getSummary();
    
    return {
      ...summary,
      events: this.events,
      analysis: this.analyzeEvents(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * イベント分析
   */
  analyzeEvents() {
    const analysis = {
      speechRecognitionEvents: this.events.filter(e => e.type.includes('SPEECH')).length,
      todoProcessingEvents: this.events.filter(e => e.type.includes('TODO')).length,
      similarityCalculationEvents: this.events.filter(e => e.type.includes('SIMILARITY')).length,
      errorEvents: this.events.filter(e => e.type.includes('ERROR')).length,
      averageProcessingTime: this.calculateAverageProcessingTime()
    };

    return analysis;
  }

  /**
   * 平均処理時間計算
   */
  calculateAverageProcessingTime() {
    const processingEvents = this.events.filter(e => 
      e.type === 'PROCESSING_START' || e.type === 'PROCESSING_END'
    );

    if (processingEvents.length < 2) return 0;

    const pairs = [];
    for (let i = 0; i < processingEvents.length - 1; i += 2) {
      if (processingEvents[i].type === 'PROCESSING_START' && 
          processingEvents[i + 1] && processingEvents[i + 1].type === 'PROCESSING_END') {
        pairs.push(processingEvents[i + 1].sessionTime - processingEvents[i].sessionTime);
      }
    }

    return pairs.length > 0 ? Math.round(pairs.reduce((a, b) => a + b, 0) / pairs.length) : 0;
  }

  /**
   * 改善提案生成
   */
  generateRecommendations() {
    const recommendations = [];
    const summary = this.getSummary();

    if (summary.successRate < 70) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: '音声認識精度が低いです。マイクの位置や環境音を確認してください。',
        action: '類似度閾値を下げることを検討してください（現在値から0.1-0.2下げる）'
      });
    }

    if (this.metrics.errors > 3) {
      recommendations.push({
        type: 'stability',
        priority: 'high',
        message: 'エラーが頻発しています。ネットワーク接続とAPI設定を確認してください。',
        action: 'ログを確認してエラーの根本原因を特定してください'
      });
    }

    if (this.metrics.totalProcessingTime > 10000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: '処理時間が長すぎます。パフォーマンス最適化が必要です。',
        action: 'バッチ処理や並列処理の導入を検討してください'
      });
    }

    if (this.metrics.apiCalls > 50) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        message: 'API呼び出し回数が多いです。キャッシュ機能の導入を検討してください。',
        action: '類似度計算結果のキャッシュを実装してください'
      });
    }

    return recommendations;
  }
}

/**
 * 音声入力シミュレーター
 */
export class VoiceInputSimulator {
  constructor(debugSession) {
    this.debugSession = debugSession;
    this.testScenarios = this.initializeTestScenarios();
  }

  /**
   * テストシナリオ初期化
   */
  initializeTestScenarios() {
    return [
      {
        name: '基本的な挨拶シナリオ',
        inputs: [
          'こんにちは、私の名前は田中です',
          '初めまして、よろしくお願いします',
          '自己紹介をさせていただきます'
        ],
        expectedMatches: ['挨拶と自己紹介']
      },
      {
        name: 'ヒアリングシナリオ',
        inputs: [
          '現在どのような問題でお困りですか',
          'お客様の課題についてお聞かせください',
          '何かご不明な点はございませんか'
        ],
        expectedMatches: ['現在の課題をヒアリング', 'お客様の現状についてヒアリング']
      },
      {
        name: '提案シナリオ',
        inputs: [
          'こちらの新しいソリューションをご提案します',
          '解決策をご提示させていただきます',
          '最適なプランをご案内します'
        ],
        expectedMatches: ['解決策を提案', '具体的なソリューションを提案']
      },
      {
        name: 'クロージングシナリオ',
        inputs: [
          '次回のミーティングを設定しましょう',
          '今後のステップについて確認します',
          'フォローアップの予定を立てましょう'
        ],
        expectedMatches: ['次のステップについて確認', '次回ミーティングの提案']
      }
    ];
  }

  /**
   * シナリオ実行
   */
  async runScenario(scenario, todos, audioController) {
    console.log(`🎭 シナリオ実行開始: ${scenario.name}`);
    this.debugSession.recordEvent('SCENARIO_START', { scenario: scenario.name });

    const results = [];

    for (const input of scenario.inputs) {
      const result = await this.simulateVoiceInput(input, todos, audioController);
      results.push(result);
      
      // 各入力間で少し待機
      await this.delay(1000);
    }

    const scenarioResult = {
      scenario: scenario.name,
      results: results,
      totalMatches: results.filter(r => r.matched).length,
      expectedMatches: scenario.expectedMatches,
      accuracy: this.calculateScenarioAccuracy(results, scenario.expectedMatches)
    };

    this.debugSession.recordEvent('SCENARIO_END', scenarioResult);
    console.log(`✅ シナリオ完了: ${scenario.name} (精度: ${scenarioResult.accuracy}%)`);

    return scenarioResult;
  }

  /**
   * 音声入力シミュレーション
   */
  async simulateVoiceInput(input, todos, audioController) {
    console.log(`🎤 音声入力シミュレーション: "${input}"`);
    
    const startTime = Date.now();
    this.debugSession.recordEvent('VOICE_INPUT_START', { input });

    try {
      // 音声認識結果の処理をシミュレーション
      const processingResult = await this.processVoiceInput(input, todos);
      
      const processingTime = Date.now() - startTime;
      this.debugSession.updateMetrics('totalProcessingTime', processingTime);
      this.debugSession.updateMetrics('speechRecognitionAttempts');

      const result = {
        input: input,
        processingTime: processingTime,
        matched: processingResult.matched,
        matchedTodo: processingResult.matchedTodo,
        similarity: processingResult.similarity,
        success: true
      };

      if (processingResult.matched) {
        this.debugSession.updateMetrics('successfulMatches');
        console.log(`✅ マッチ成功: "${processingResult.matchedTodo}" (類似度: ${processingResult.similarity})`);
      } else {
        this.debugSession.updateMetrics('failedMatches');
        console.log(`❌ マッチ失敗: 類似度閾値未満`);
      }

      this.debugSession.recordEvent('VOICE_INPUT_END', result);
      return result;

    } catch (error) {
      this.debugSession.updateMetrics('errors');
      this.debugSession.recordEvent('VOICE_INPUT_ERROR', { input, error: error.message });
      
      console.error(`❌ 音声処理エラー: ${error.message}`);
      
      return {
        input: input,
        processingTime: Date.now() - startTime,
        matched: false,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * 音声入力処理（シミュレーション）
   */
  async processVoiceInput(input, todos) {
    // テキスト正規化
    const normalizedInput = this.normalizeText(input);
    
    const incompleteTodos = todos.filter(todo => !todo.completed);
    let bestMatch = null;
    let highestSimilarity = 0;

    // 各ToDoとの類似度を計算
    for (const todo of incompleteTodos) {
      const normalizedTodo = this.normalizeText(todo.task);
      const similarity = this.calculateSimpleSimilarity(normalizedInput, normalizedTodo);
      
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = todo;
      }
    }

    const threshold = 0.7; // デフォルト閾値
    const matched = highestSimilarity >= threshold;

    return {
      matched: matched,
      matchedTodo: bestMatch ? bestMatch.task : null,
      similarity: Math.round(highestSimilarity * 100) / 100,
      threshold: threshold
    };
  }

  /**
   * テキスト正規化
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[、。！？]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * シンプルな類似度計算（Jaccardインデックス）
   */
  calculateSimpleSimilarity(text1, text2) {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * シナリオ精度計算
   */
  calculateScenarioAccuracy(results, expectedMatches) {
    const totalInputs = results.length;
    const successfulMatches = results.filter(r => r.matched).length;
    
    return totalInputs > 0 ? Math.round((successfulMatches / totalInputs) * 100) : 0;
  }

  /**
   * 遅延ユーティリティ
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 全シナリオ実行
   */
  async runAllScenarios(todos, audioController) {
    console.log('🚀 全シナリオテスト開始');
    this.debugSession.recordEvent('ALL_SCENARIOS_START', { totalScenarios: this.testScenarios.length });

    const allResults = [];

    for (const scenario of this.testScenarios) {
      const result = await this.runScenario(scenario, todos, audioController);
      allResults.push(result);
      
      // シナリオ間で少し待機
      await this.delay(2000);
    }

    const overallResult = {
      totalScenarios: this.testScenarios.length,
      results: allResults,
      overallAccuracy: this.calculateOverallAccuracy(allResults),
      completionTime: Date.now() - this.debugSession.startTime.getTime()
    };

    this.debugSession.recordEvent('ALL_SCENARIOS_END', overallResult);
    console.log('🏁 全シナリオテスト完了');

    return overallResult;
  }

  /**
   * 全体精度計算
   */
  calculateOverallAccuracy(results) {
    const totalInputs = results.reduce((sum, r) => sum + r.results.length, 0);
    const totalMatches = results.reduce((sum, r) => sum + r.totalMatches, 0);
    
    return totalInputs > 0 ? Math.round((totalMatches / totalInputs) * 100) : 0;
  }
}

/**
 * リアルタイムデバッグモニター
 */
export class RealtimeDebugMonitor {
  constructor(debugSession) {
    this.debugSession = debugSession;
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.metrics = {
      cpuUsage: [],
      memoryUsage: [],
      networkLatency: [],
      processingQueue: 0
    };
  }

  /**
   * 監視開始
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('📊 リアルタイム監視開始');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // 5秒間隔

    this.debugSession.recordEvent('MONITORING_START', {});
  }

  /**
   * 監視停止
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('📊 リアルタイム監視停止');
    this.debugSession.recordEvent('MONITORING_STOP', { metrics: this.getMetricsSummary() });
  }

  /**
   * メトリクス収集
   */
  collectMetrics() {
    const timestamp = Date.now();
    
    // メモリ使用量（利用可能な場合）
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        timestamp,
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      });
    }

    // パフォーマンス測定
    const performanceEntries = performance.getEntriesByType('measure');
    if (performanceEntries.length > 0) {
      const latestEntry = performanceEntries[performanceEntries.length - 1];
      this.metrics.networkLatency.push({
        timestamp,
        duration: latestEntry.duration,
        name: latestEntry.name
      });
    }

    // メトリクス配列のサイズ制限
    Object.keys(this.metrics).forEach(key => {
      if (Array.isArray(this.metrics[key]) && this.metrics[key].length > 100) {
        this.metrics[key] = this.metrics[key].slice(-50);
      }
    });
  }

  /**
   * メトリクスサマリー取得
   */
  getMetricsSummary() {
    return {
      memoryPeakUsage: this.calculatePeakMemoryUsage(),
      averageLatency: this.calculateAverageLatency(),
      totalDataPoints: this.metrics.memoryUsage.length,
      monitoringDuration: this.calculateMonitoringDuration()
    };
  }

  /**
   * ピークメモリ使用量計算
   */
  calculatePeakMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return 0;
    
    return Math.max(...this.metrics.memoryUsage.map(m => m.used));
  }

  /**
   * 平均レイテンシ計算
   */
  calculateAverageLatency() {
    if (this.metrics.networkLatency.length === 0) return 0;
    
    const totalLatency = this.metrics.networkLatency.reduce((sum, l) => sum + l.duration, 0);
    return Math.round(totalLatency / this.metrics.networkLatency.length);
  }

  /**
   * 監視時間計算
   */
  calculateMonitoringDuration() {
    if (this.metrics.memoryUsage.length < 2) return 0;
    
    const firstTimestamp = this.metrics.memoryUsage[0].timestamp;
    const lastTimestamp = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].timestamp;
    
    return lastTimestamp - firstTimestamp;
  }
}

/**
 * デバッグツール統合クラス
 */
export class VoiceToDoDebugTool {
  constructor() {
    this.session = new VoiceDebugSession();
    this.simulator = new VoiceInputSimulator(this.session);
    this.monitor = new RealtimeDebugMonitor(this.session);
  }

  /**
   * 包括的デバッグテスト実行
   */
  async runComprehensiveTest(todos, audioController) {
    console.log('🔧 包括的デバッグテスト開始');
    
    // 監視開始
    this.monitor.startMonitoring();
    
    try {
      // 全シナリオテスト実行
      const testResults = await this.simulator.runAllScenarios(todos, audioController);
      
      // 最終レポート生成
      const finalReport = this.generateFinalReport(testResults);
      
      console.log('📋 デバッグテスト完了 - レポートを確認してください');
      
      return finalReport;
      
    } catch (error) {
      console.error('❌ デバッグテスト中にエラーが発生:', error);
      this.session.recordEvent('TEST_ERROR', { error: error.message });
      
      return {
        success: false,
        error: error.message,
        partialReport: this.session.generateReport()
      };
    } finally {
      // 監視停止
      this.monitor.stopMonitoring();
    }
  }

  /**
   * 最終レポート生成
   */
  generateFinalReport(testResults) {
    const sessionSummary = this.session.getSummary();
    const monitoringMetrics = this.monitor.getMetricsSummary();
    
    return {
      success: true,
      testResults: testResults,
      sessionSummary: sessionSummary,
      monitoringMetrics: monitoringMetrics,
      overallScore: this.calculateOverallScore(testResults, sessionSummary),
      recommendations: this.session.generateRecommendations(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 総合スコア計算
   */
  calculateOverallScore(testResults, sessionSummary) {
    const accuracyScore = testResults.overallAccuracy * 0.4; // 40%
    const performanceScore = sessionSummary.performanceScore * 0.3; // 30%
    const stabilityScore = Math.max(0, 100 - (sessionSummary.metrics.errors * 10)) * 0.3; // 30%
    
    return Math.round(accuracyScore + performanceScore + stabilityScore);
  }

  /**
   * レポート出力
   */
  outputReport(report, format = 'console') {
    switch (format) {
      case 'console':
        this.outputConsoleReport(report);
        break;
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'summary':
        return this.generateSummaryReport(report);
      default:
        console.warn('未サポートの出力形式:', format);
    }
  }

  /**
   * コンソールレポート出力
   */
  outputConsoleReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 音声認識ToDo自動完了機能 - デバッグレポート');
    console.log('='.repeat(60));
    
    console.log('\n📊 テスト結果サマリー:');
    console.log(`  • 総合スコア: ${report.overallScore}/100`);
    console.log(`  • 全体精度: ${report.testResults.overallAccuracy}%`);
    console.log(`  • 成功率: ${report.sessionSummary.successRate}%`);
    console.log(`  • テスト時間: ${report.sessionSummary.durationFormatted}`);
    
    console.log('\n📈 パフォーマンス指標:');
    console.log(`  • 処理時間: ${report.sessionSummary.metrics.totalProcessingTime}ms`);
    console.log(`  • API呼び出し: ${report.sessionSummary.metrics.apiCalls}回`);
    console.log(`  • エラー発生: ${report.sessionSummary.metrics.errors}回`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 改善提案:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        console.log(`     → ${rec.action}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }

  /**
   * サマリーレポート生成
   */
  generateSummaryReport(report) {
    return {
      overallScore: report.overallScore,
      accuracy: report.testResults.overallAccuracy,
      successRate: report.sessionSummary.successRate,
      errors: report.sessionSummary.metrics.errors,
      recommendations: report.recommendations.length,
      status: report.overallScore >= 80 ? 'GOOD' : report.overallScore >= 60 ? 'OK' : 'NEEDS_IMPROVEMENT'
    };
  }
}

// エクスポート
export default {
  VoiceDebugSession,
  VoiceInputSimulator,
  RealtimeDebugMonitor,
  VoiceToDoDebugTool
};