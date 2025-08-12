import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Gemini API クライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// モデルインスタンスの作成
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * BANTヒアリング質問を生成する
 * @param {string} step - 現在のステップ (budget, authority, need, timeline)
 * @param {object} answers - これまでの回答
 * @returns {Promise<Array>} BANT条件に基づく質問配列
 */
export async function generateBANTQuestions(step, answers = {}) {
  // ChatInterface.jsx:72行目でオブジェクト直接レンダリングエラーを回避するため
  // 文字列の配列を返すように修正
  
  const stepQuestions = {
    budget: [
      "予算規模についてより詳しく教えてください。どの程度の投資をお考えでしょうか？",
      "予算の承認プロセスはどのようになっていますか？",
      "ROIや投資対効果についてはどの程度の期間で回収をお考えですか？"
    ],
    authority: [
      "最終的な導入の意思決定はどなたが行われますか？",
      "意思決定に関わるメンバーは他にもいらっしゃいますか？",
      "導入決定までのプロセスとタイムラインを教えてください。"
    ],
    need: [
      "現在お困りの課題について詳しく教えてください。",
      "その課題により、どのような影響が出ていますか？",
      "理想的な解決状態はどのような状況でしょうか？"
    ],
    timeline: [
      "導入時期についてお聞きします。いつ頃から利用開始をお考えですか？",
      "その時期に導入したい理由やきっかけはありますか？",
      "導入準備期間はどの程度確保できますか？"
    ]
  };

  // フォールバック用のデフォルト質問
  const defaultQuestion = "詳しく教えてください。";
  
  try {
    // 直接的な文字列配列を返す（JSXレンダリング安全）
    const questions = stepQuestions[step] || [defaultQuestion];
    return questions;
  } catch (error) {
    console.error('BANT質問生成エラー:', error);
    return [defaultQuestion]; // 必ず文字列の配列を返す
  }
}

/**
 * ヒアリング回答からToDoリストを生成する
 * @param {Object} answers - ヒアリング回答データ
 * @returns {Promise<Array>} 商談用ToDoリスト
 */
export async function generateTodoList(answers) {
  const prompt = `
以下の顧客情報に基づいて、営業担当者が商談で実施すべきタスクを、直接的かつ単純な表現のToDoリストとして生成してください。

顧客情報：
${Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

出力形式：
- 各ToDoは具体的で実行可能なアクションにする
- 商談の流れに沿った順序で整理する
- 5-8個程度のToDoにまとめる

以下のJSON形式で回答してください：
[
  {
    "id": 1,
    "task": "具体的なタスク内容",
    "category": "アイスブレイク|ヒアリング|提案|クロージング",
    "completed": false
  }
]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    const cleanText = cleanJsonResponse(rawText);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('ToDoリスト生成エラー:', error);
    console.error('Raw response text:', error.message);
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error - Invalid JSON format from Gemini API');
    }
    // フォールバック用のデフォルトToDo
    return [
      {
        id: 1,
        task: "アイスブレイクで雰囲気作り",
        category: "アイスブレイク",
        completed: false
      },
      {
        id: 2,
        task: "現在の課題をヒアリング",
        category: "ヒアリング",
        completed: false
      },
      {
        id: 3,
        task: "予算感を確認",
        category: "ヒアリング",
        completed: false
      },
      {
        id: 4,
        task: "解決策を提案",
        category: "提案",
        completed: false
      },
      {
        id: 5,
        task: "次回ミーティングの提案",
        category: "クロージング",
        completed: false
      }
    ];
  }
}

/**
 * 音声テキストとToDoの類似度を計算する
 * @param {string} todoText - ToDo項目のテキスト
 * @param {string} speechText - 音声認識されたテキスト
 * @returns {Promise<number>} 類似度スコア (0-1)
 */
export async function calculateSimilarity(todoText, speechText) {
  const prompt = `
以下の2つのテキストの意味的類似度を0から1の間で評価してください。
商談のToDo項目と実際の発言内容を比較し、そのタスクが実行されたかどうかを判定します。

ToDo項目: "${todoText}"
発言内容: "${speechText}"

類似度の判定基準：
- 0.8以上: 明確にタスクが実行された
- 0.5-0.8: 部分的に実行された
- 0.5未満: タスクは実行されていない

以下のJSON形式で回答してください：
{
  "similarity": 数値,
  "explanation": "判定理由"
}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    const cleanText = cleanJsonResponse(rawText);
    const parsed = JSON.parse(cleanText);
    return parsed.similarity;
  } catch (error) {
    console.error('類似度計算エラー:', error);
    console.error('Raw response text:', error.message);
    if (error instanceof SyntaxError) {
      console.error('JSON Parse Error - Invalid JSON format from Gemini API');
    }
    return 0; // エラー時は未完了とする
  }
}

/**
 * APIキーの設定状況を確認する
 * @returns {boolean} APIキーが設定されているかどうか
 */
/**
 * Gemini APIレスポンスからMarkdownコードブロックを除去してclean JSONを抽出
 * @param {string} rawText - Gemini APIからの生のレスポンステキスト
 * @returns {string} クリーンなJSON文字列
 */
function cleanJsonResponse(rawText) {
  try {
    console.log('Raw Gemini response:', rawText.substring(0, 200) + '...');
    
    // 1. Markdownコードブロック囲い（```json ``` や ``` ```）を正規表現で除去
    let cleaned = rawText
      .replace(/```json\s*/gi, '')     // ```json を除去
      .replace(/```javascript\s*/gi, '') // ```javascript を除去  
      .replace(/```\s*/g, '')           // 残りの ``` を除去
      .trim();
    
    // 2. 前後の不要なテキストを除去（JSONの開始 [ または { まで）
    const jsonStartMatch = cleaned.match(/[\[\{]/);
    if (jsonStartMatch) {
      const startIndex = jsonStartMatch.index;
      cleaned = cleaned.substring(startIndex);
    }
    
    // 3. JSONの終了（] または } 以降の不要テキストを除去）
    const jsonEndMatch = cleaned.match(/[\]\}](?=[^\]\}]*$)/);
    if (jsonEndMatch) {
      const endIndex = jsonEndMatch.index + 1;
      cleaned = cleaned.substring(0, endIndex);
    }
    
    // 4. 改行とタブを正規化
    cleaned = cleaned.replace(/\n\s*/g, ' ').replace(/\t/g, ' ');
    
    // 5. 余分な空白を除去
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    console.log('Cleaned JSON:', cleaned.substring(0, 200) + '...');
    
    // 6. JSON形式の基本検証
    if (!cleaned.startsWith('[') && !cleaned.startsWith('{')) {
      throw new Error('Invalid JSON format: does not start with [ or {');
    }
    
    if (!cleaned.endsWith(']') && !cleaned.endsWith('}')) {
      throw new Error('Invalid JSON format: does not end with ] or }');
    }
    
    return cleaned;
    
  } catch (cleanError) {
    console.error('JSON cleaning error:', cleanError.message);
    console.error('Original text:', rawText);
    
    // 7. フォールバック: 最も単純なJSON抽出を試行
    const fallbackMatch = rawText.match(/[\[\{][\s\S]*[\]\}]/);
    if (fallbackMatch) {
      console.log('Using fallback JSON extraction');
      return fallbackMatch[0].trim();
    }
    
    // 8. 最終フォールバック: エラーを再スロー
    throw new Error(`Unable to extract valid JSON from Gemini response: ${cleanError.message}`);
  }
}

export function isGeminiConfigured() {
  return !!(process.env.NEXT_PUBLIC_GEMINI_API_KEY && 
        process.env.NEXT_PUBLIC_GEMINI_API_KEY !== 'your_gemini_api_key_here');
}