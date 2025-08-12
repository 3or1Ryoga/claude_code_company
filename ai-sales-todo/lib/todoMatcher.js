/**
 * 音声認識テキストとToDoリストの高精度照合システム
 * Google Gemini APIを使用した意味的類似度計算
 */

import { calculateSimilarity } from './gemini';

/**
 * 音声認識結果とToDo項目の照合を行う
 * @param {string} transcribedText - 音声認識されたテキスト
 * @param {Array} todos - ToDo項目の配列
 * @param {number} threshold - 類似度の閾値 (0-1)
 * @returns {Promise<Array>} マッチしたToDo項目とその類似度
 */
export async function matchTodosWithTranscription(transcribedText, todos, threshold = 0.7) {
  if (!transcribedText || !todos || todos.length === 0) {
    return [];
  }

  const matches = [];
  const incompleteTodos = todos.filter(todo => !todo.completed);

  console.log(`[TodoMatcher] 照合開始: "${transcribedText}" vs ${incompleteTodos.length}個の未完了ToDo`);

  // 並列処理で全ToDoとの類似度を計算
  const similarityPromises = incompleteTodos.map(async (todo) => {
    try {
      // Gemini APIを使用した高精度な意味的類似度計算
      const similarity = await calculateSimilarity(todo.text, transcribedText);
      
      return {
        todo,
        similarity,
        matched: similarity >= threshold
      };
    } catch (error) {
      console.error(`[TodoMatcher] ToDo #${todo.id} の類似度計算エラー:`, error);
      // エラー時はフォールバック処理
      const fallbackSimilarity = calculateFallbackSimilarity(todo.text, transcribedText);
      return {
        todo,
        similarity: fallbackSimilarity,
        matched: fallbackSimilarity >= threshold,
        fallback: true
      };
    }
  });

  // 全ての類似度計算結果を待つ
  const results = await Promise.all(similarityPromises);

  // マッチしたToDoを類似度順にソート
  const matchedTodos = results
    .filter(result => result.matched)
    .sort((a, b) => b.similarity - a.similarity);

  console.log(`[TodoMatcher] ${matchedTodos.length}個のマッチを発見`);
  
  matchedTodos.forEach(match => {
    console.log(`  - ToDo #${match.todo.id}: "${match.todo.text}" (類似度: ${(match.similarity * 100).toFixed(1)}%)`);
    matches.push({
      todoId: match.todo.id,
      todoText: match.todo.text,
      similarity: match.similarity,
      transcribedText: transcribedText,
      matchedAt: new Date().toISOString(),
      method: match.fallback ? 'fallback' : 'gemini'
    });
  });

  return matches;
}

/**
 * フォールバック用の簡易類似度計算
 * Gemini APIが利用できない場合の代替処理
 * @param {string} todoText - ToDo項目のテキスト
 * @param {string} transcribedText - 音声認識されたテキスト
 * @returns {number} 類似度スコア (0-1)
 */
function calculateFallbackSimilarity(todoText, transcribedText) {
  if (!todoText || !transcribedText) {
    return 0;
  }

  const todoLower = todoText.toLowerCase();
  const transcribedLower = transcribedText.toLowerCase();

  // 1. 完全一致チェック
  if (transcribedLower.includes(todoLower) || todoLower.includes(transcribedLower)) {
    return 0.9;
  }

  // 2. キーワードベースの類似度計算
  const todoWords = extractKeywords(todoLower);
  const transcribedWords = extractKeywords(transcribedLower);
  
  let matchCount = 0;
  let totalKeywords = todoWords.length;

  todoWords.forEach(todoWord => {
    if (transcribedWords.some(transWord => 
      transWord.includes(todoWord) || todoWord.includes(transWord)
    )) {
      matchCount++;
    }
  });

  // 3. 部分一致の重み付け
  let similarity = totalKeywords > 0 ? matchCount / totalKeywords : 0;

  // 4. 重要キーワードの追加重み付け
  const importantKeywords = ['予算', '承認', '決裁', '導入', '課題', '解決', '提案', 'デモ', '価格', '契約'];
  
  importantKeywords.forEach(keyword => {
    if (todoLower.includes(keyword) && transcribedLower.includes(keyword)) {
      similarity += 0.1;
    }
  });

  // 5. 類似度を0-1の範囲に正規化
  return Math.min(1, similarity);
}

/**
 * テキストから重要なキーワードを抽出
 * @param {string} text - 入力テキスト
 * @returns {Array<string>} キーワード配列
 */
function extractKeywords(text) {
  // 助詞や接続詞を除外
  const stopWords = ['は', 'が', 'を', 'に', 'で', 'と', 'の', 'から', 'まで', 'より', 'へ', 'や', 'か', 'も', 'など', 'について', 'ます', 'です', 'する', 'います', 'いる', 'ある', 'こと', 'もの'];
  
  // 単語分割（簡易版）
  const words = text
    .split(/[\s、。！？,.\s]+/)
    .filter(word => word.length > 1)
    .filter(word => !stopWords.includes(word));

  return words;
}

/**
 * マッチング結果を評価して最適な候補を選択
 * @param {Array} matches - マッチング結果の配列
 * @param {number} maxMatches - 返す最大マッチ数
 * @returns {Array} 最適化されたマッチング結果
 */
export function optimizeMatches(matches, maxMatches = 3) {
  if (!matches || matches.length === 0) {
    return [];
  }

  // 1. 類似度でソート
  const sorted = matches.sort((a, b) => b.similarity - a.similarity);

  // 2. 上位N件を選択
  const topMatches = sorted.slice(0, maxMatches);

  // 3. 信頼度スコアを追加
  return topMatches.map(match => ({
    ...match,
    confidence: calculateConfidence(match)
  }));
}

/**
 * マッチング結果の信頼度を計算
 * @param {Object} match - マッチング結果
 * @returns {string} 信頼度レベル ('high', 'medium', 'low')
 */
function calculateConfidence(match) {
  if (match.similarity >= 0.8) {
    return 'high';
  } else if (match.similarity >= 0.6) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * バッチ処理用: 複数の音声認識結果を一度に処理
 * @param {Array<string>} transcriptions - 音声認識結果の配列
 * @param {Array} todos - ToDo項目の配列
 * @param {number} threshold - 類似度の閾値
 * @returns {Promise<Object>} バッチ処理結果
 */
export async function batchMatchTodos(transcriptions, todos, threshold = 0.7) {
  const allMatches = [];
  const processedTodoIds = new Set();

  for (const transcription of transcriptions) {
    const matches = await matchTodosWithTranscription(transcription, todos, threshold);
    
    matches.forEach(match => {
      if (!processedTodoIds.has(match.todoId)) {
        allMatches.push(match);
        processedTodoIds.add(match.todoId);
      }
    });
  }

  return {
    matches: allMatches,
    totalProcessed: transcriptions.length,
    uniqueMatchedTodos: processedTodoIds.size,
    averageSimilarity: allMatches.length > 0 
      ? allMatches.reduce((sum, m) => sum + m.similarity, 0) / allMatches.length 
      : 0
  };
}

/**
 * リアルタイム処理用のデバウンス付きマッチング
 * @param {string} transcribedText - 音声認識されたテキスト
 * @param {Array} todos - ToDo項目の配列
 * @param {Function} callback - マッチング完了時のコールバック
 * @param {number} debounceMs - デバウンス時間（ミリ秒）
 */
let debounceTimer = null;

export function debouncedMatch(transcribedText, todos, callback, debounceMs = 1000) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(async () => {
    const matches = await matchTodosWithTranscription(transcribedText, todos);
    callback(matches);
  }, debounceMs);
}

export default {
  matchTodosWithTranscription,
  optimizeMatches,
  batchMatchTodos,
  debouncedMatch
};