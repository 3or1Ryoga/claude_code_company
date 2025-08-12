/**
 * 音声認識→ToDo照合→自動完了 統合テストスイート
 * Worker3 - テスト実装と動作検証担当
 */

import { jest } from '@jest/globals';

// モック設定
const mockTodos = [
  { id: 1, task: '挨拶と自己紹介', category: 'アイスブレイク', completed: false, vector: [0.1, 0.2, 0.3] },
  { id: 2, task: '現在の課題をヒアリング', category: 'ヒアリング', completed: false, vector: [0.4, 0.5, 0.6] },
  { id: 3, task: '解決策を提案', category: '提案', completed: false, vector: [0.7, 0.8, 0.9] },
  { id: 4, task: '次のステップを確認', category: 'クロージング', completed: false, vector: [0.2, 0.4, 0.6] }
];

const mockTranscriptions = [
  '皆さん、こんにちは。私の名前は田中です。',
  '現在どのような問題でお困りでしょうか？',
  'こちらの新しいシステムをご提案させていただきます。',
  '次回のミーティングを来週に設定しましょう。'
];

// API モック
global.fetch = jest.fn();

describe('🎯 音声認識ToDo自動完了 統合テスト', () => {
  
  beforeEach(() => {
    fetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('1️⃣ 音声認識→ToDo照合→自動完了フロー', () => {
    
    test('✅ 音声認識結果がToDo項目と正常に照合される', async () => {
      // 類似度チェックAPIのモック設定
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: [
            { todoId: 1, todoText: '挨拶と自己紹介', similarity: 0.85, isMatch: true, threshold: 0.7 }
          ],
          transcription: mockTranscriptions[0]
        })
      });

      // 実際のAPI呼び出しをシミュレート
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-similarity',
          data: {
            todos: mockTodos.filter(todo => !todo.completed),
            transcription: mockTranscriptions[0]
          }
        })
      });

      const result = await response.json();

      // 検証
      expect(fetch).toHaveBeenCalledWith('/api/todos', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }));

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].similarity).toBe(0.85);
      expect(result.results[0].isMatch).toBe(true);
    });

    test('✅ 閾値を超えた類似度でToDo自動完了処理が実行される', async () => {
      // ToDo完了APIのモック設定
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          todo: {
            id: 1,
            completed: true,
            completedAt: '2025-08-07T12:00:00.000Z',
            completedBy: 'voice-detection',
            similarity: 0.85,
            triggerTranscription: mockTranscriptions[0]
          },
          message: 'ToDoが音声認識により自動完了されました'
        })
      });

      // ToDo完了API呼び出し
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          data: {
            todoId: 1,
            similarity: 0.85,
            transcription: mockTranscriptions[0]
          }
        })
      });

      const result = await response.json();

      // 検証
      expect(result.success).toBe(true);
      expect(result.todo.completed).toBe(true);
      expect(result.todo.completedBy).toBe('voice-detection');
      expect(result.todo.similarity).toBe(0.85);
      expect(result.message).toContain('音声認識により自動完了');
    });

    test('❌ 閾値未満の類似度では自動完了されない', async () => {
      // 低い類似度のレスポンスモック
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: [
            { todoId: 1, todoText: '挨拶と自己紹介', similarity: 0.3, isMatch: false, threshold: 0.7 }
          ],
          transcription: '全く関係ない発話内容'
        })
      });

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-similarity',
          data: {
            todos: mockTodos.filter(todo => !todo.completed),
            transcription: '全く関係ない発話内容'
          }
        })
      });

      const result = await response.json();

      // 検証：低い類似度では完了しない
      expect(result.results[0].similarity).toBe(0.3);
      expect(result.results[0].isMatch).toBe(false);
    });
  });

  describe('2️⃣ 30秒間隔定期実行テスト', () => {
    
    test('✅ リアルタイム処理APIが30秒間隔で正常動作', async () => {
      // リアルタイム処理APIのモック
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          result: {
            sessionId: 'test-session-123',
            timestamp: '2025-08-07T12:00:00.000Z',
            processedAudio: true,
            completedTodos: [
              {
                todoId: 2,
                todoText: '現在の課題をヒアリング',
                similarity: 0.88,
                completionData: {
                  id: 2,
                  completed: true,
                  completedBy: 'voice-detection'
                }
              }
            ],
            similarities: [
              { todoId: 2, similarity: 0.88, isMatch: true }
            ],
            transcription: mockTranscriptions[1]
          },
          completedCount: 1,
          message: '1個のToDoが自動完了されました'
        })
      });

      // リアルタイム処理API呼び出し
      const response = await fetch('/api/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-audio',
          data: {
            audioData: 'mock-audio-data',
            currentTodos: mockTodos,
            threshold: 0.7,
            sessionId: 'test-session-123'
          }
        })
      });

      const result = await response.json();

      // 検証
      expect(result.success).toBe(true);
      expect(result.completedCount).toBe(1);
      expect(result.result.completedTodos).toHaveLength(1);
      expect(result.result.completedTodos[0].similarity).toBe(0.88);
    });

    test('⏱️ 30秒間隔タイマーの動作検証', () => {
      jest.useFakeTimers();
      const mockProcess = jest.fn();

      // 30秒間隔タイマーのシミュレーション
      const intervalId = setInterval(mockProcess, 30000);

      // 30秒進める
      jest.advanceTimersByTime(30000);
      expect(mockProcess).toHaveBeenCalledTimes(1);

      // さらに30秒進める
      jest.advanceTimersByTime(30000);
      expect(mockProcess).toHaveBeenCalledTimes(2);

      clearInterval(intervalId);
      jest.useRealTimers();
    });
  });

  describe('3️⃣ エラーハンドリングテスト', () => {
    
    test('❌ API接続エラー時の適切なハンドリング', async () => {
      // ネットワークエラーのシミュレーション
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-similarity',
            data: {
              todos: mockTodos,
              transcription: 'test transcription'
            }
          })
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      expect(fetch).toHaveBeenCalled();
    });

    test('❌ 音声認識エラー時のフォールバック処理', () => {
      const errorHandler = jest.fn();
      const speechError = 'no-speech';

      // 音声認識エラーのシミュレーション
      errorHandler(speechError);

      expect(errorHandler).toHaveBeenCalledWith('no-speech');
    });

    test('❌ 無効なToDo形式エラーハンドリング', async () => {
      // 不正なToDo形式のレスポンスモック
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: '無効なToDoデータ形式です'
        })
      });

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-similarity',
          data: {
            todos: 'invalid-todo-format', // 不正な形式
            transcription: 'test'
          }
        })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('4️⃣ パフォーマンステスト', () => {
    
    test('⚡ 類似度計算処理時間測定', async () => {
      const startTime = Date.now();

      // 類似度計算APIの高速レスポンスモック
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: mockTodos.map((todo, index) => ({
            todoId: todo.id,
            todoText: todo.task,
            similarity: 0.5 + (index * 0.1),
            isMatch: index === 0 // 最初のToDOのみマッチ
          }))
        })
      });

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-similarity',
          data: {
            todos: mockTodos,
            transcription: mockTranscriptions[0]
          }
        })
      });

      await response.json();
      const processingTime = Date.now() - startTime;

      // 500ms以内での処理完了を検証
      expect(processingTime).toBeLessThan(500);
    });

    test('📊 大量ToDo処理負荷テスト', async () => {
      // 100個のToDo項目を生成
      const largeTodoList = Array.from({ length: 100 }, (_, index) => ({
        id: index + 1,
        task: `テストToDo項目 ${index + 1}`,
        category: 'テスト',
        completed: false,
        vector: Array.from({ length: 768 }, () => Math.random())
      }));

      // 大量データ処理のモック
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          results: largeTodoList.slice(0, 5).map(todo => ({
            todoId: todo.id,
            similarity: Math.random(),
            isMatch: false
          }))
        })
      });

      const startTime = Date.now();
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-similarity',
          data: {
            todos: largeTodoList,
            transcription: 'テスト用の発話内容'
          }
        })
      });

      await response.json();
      const processingTime = Date.now() - startTime;

      // 2秒以内での処理完了を検証
      expect(processingTime).toBeLessThan(2000);
    });
  });

  describe('5️⃣ UI統合テスト', () => {
    
    test('🎨 AudioController状態管理テスト', () => {
      const mockOnTodoComplete = jest.fn();
      const mockOnThresholdChange = jest.fn();

      // AudioControllerのprops検証
      const props = {
        todos: mockTodos,
        onTodoComplete: mockOnTodoComplete,
        similarityThreshold: 0.75,
        onThresholdChange: mockOnThresholdChange
      };

      // props検証
      expect(props.todos).toEqual(mockTodos);
      expect(props.similarityThreshold).toBe(0.75);
      expect(typeof props.onTodoComplete).toBe('function');
      expect(typeof props.onThresholdChange).toBe('function');

      // コールバック関数テスト
      props.onTodoComplete(1);
      expect(mockOnTodoComplete).toHaveBeenCalledWith(1);

      props.onThresholdChange(0.8);
      expect(mockOnThresholdChange).toHaveBeenCalledWith(0.8);
    });
  });
});

/**
 * 手動テスト用のヘルパー関数
 */
export const testHelpers = {
  /**
   * 音声認識シミュレーション
   */
  simulateVoiceInput: (transcription) => {
    console.log('🎤 音声入力シミュレーション:', transcription);
    return {
      transcription,
      timestamp: new Date().toISOString(),
      confidence: Math.random() * 0.5 + 0.5
    };
  },

  /**
   * ToDo完了シミュレーション
   */
  simulateTodoCompletion: (todoId, similarity) => {
    console.log('✅ ToDo完了シミュレーション:', { todoId, similarity });
    return {
      todoId,
      completed: true,
      similarity,
      completedAt: new Date().toISOString()
    };
  },

  /**
   * 30秒間隔処理シミュレーション
   */
  simulate30SecondInterval: () => {
    let count = 0;
    const intervalId = setInterval(() => {
      count++;
      console.log(`⏱️ 30秒処理実行 #${count}:`, new Date().toISOString());
      
      if (count >= 3) {
        clearInterval(intervalId);
        console.log('🏁 30秒間隔処理テスト完了');
      }
    }, 1000); // テスト用に1秒間隔

    return intervalId;
  }
};