import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIの初期化（開発環境ではモック）
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * POST /api/gemini
 * Gemini APIベクトル化・類似度計算
 */
export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'vectorize':
        return await handleVectorize(data);
      case 'similarity':
        return await handleSimilarity(data);
      case 'generate-todos':
        return await handleGenerateTodos(data);
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Gemini API] エラー:', error);
    return NextResponse.json(
      { error: 'Gemini API処理中にエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * テキストのベクトル化処理
 */
async function handleVectorize({ texts }) {
  if (!Array.isArray(texts)) {
    texts = [texts];
  }

  console.log('[Gemini API] ベクトル化開始:', texts.length, 'テキスト');

  // 本番環境ではGemini Embedding APIを使用
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'embedding-001' });
      const vectors = [];
      
      for (const text of texts) {
        const result = await model.embedContent(text);
        vectors.push({
          text: text,
          vector: result.embedding.values,
          dimension: result.embedding.values.length
        });
      }
      
      return NextResponse.json({
        success: true,
        vectors: vectors,
        count: vectors.length
      });
    } catch (apiError) {
      console.warn('[Gemini API] API呼び出し失敗、モックデータで継続:', apiError.message);
    }
  }

  // 開発環境用モックベクトル生成
  const vectors = texts.map(text => ({
    text: text,
    vector: generateMockVector(text),
    dimension: 768
  }));

  return NextResponse.json({
    success: true,
    vectors: vectors,
    count: vectors.length,
    mock: true
  });
}

/**
 * 類似度計算処理
 */
async function handleSimilarity({ todoVector, speechVector }) {
  console.log('[Gemini API] 類似度計算開始');

  // コサイン類似度計算
  const similarity = calculateCosineSimilarity(todoVector, speechVector);
  
  const result = {
    success: true,
    similarity: similarity,
    threshold: 0.7, // デフォルト閾値
    isMatch: similarity >= 0.7,
    timestamp: new Date().toISOString()
  };

  console.log('[Gemini API] 類似度計算結果:', result);

  return NextResponse.json(result);
}

/**
 * ToDoリスト生成処理
 */
async function handleGenerateTodos({ businessInfo }) {
  console.log('[Gemini API] ToDo生成開始:', businessInfo);

  // 本番環境ではGemini Pro APIを使用してBANT条件に基づくToDo生成
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = createTodoGenerationPrompt(businessInfo);
      const result = await model.generateContent(prompt);
      const todos = parseTodoResponse(result.response.text());
      
      return NextResponse.json({
        success: true,
        todos: todos,
        source: 'gemini-api'
      });
    } catch (apiError) {
      console.warn('[Gemini API] ToDo生成API失敗、モックで継続:', apiError.message);
    }
  }

  // 開発環境用モックToDo生成
  const mockTodos = generateMockTodos(businessInfo);
  
  return NextResponse.json({
    success: true,
    todos: mockTodos,
    source: 'mock',
    businessInfo: businessInfo
  });
}

/**
 * コサイン類似度計算
 */
function calculateCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * モックベクトル生成（開発用）
 */
function generateMockVector(text) {
  const dimension = 768;
  const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = new Array(dimension).fill(0).map((_, i) => 
    Math.sin(seed + i) * 0.1 + Math.cos(seed * 2 + i) * 0.1
  );
  return random;
}

/**
 * BANT条件ベースのToDo生成プロンプト作成
 */
function createTodoGenerationPrompt(businessInfo) {
  return `
商談準備のためのToDoリストを作成してください。

ビジネス情報:
- 業界: ${businessInfo.industry || '未指定'}
- 会社規模: ${businessInfo.companySize || '未指定'}
- 課題: ${businessInfo.challenges || '未指定'}
- 予算: ${businessInfo.budget || '未指定'}

BANT条件（Budget, Authority, Needs, Timeline）に基づいて、
実行可能で具体的なToDo項目を5-7個生成してください。
各項目は商談中に確認すべき要素を含めてください。

形式: シンプルな箇条書きで返答してください。
`;
}

/**
 * Gemini APIレスポンスからToDo解析
 */
function parseTodoResponse(responseText) {
  const lines = responseText.split('\n').filter(line => line.trim());
  return lines
    .filter(line => line.match(/^[\d\-\*\•]/))
    .map((line, index) => ({
      id: `todo-${index + 1}`,
      text: line.replace(/^[\d\-\*\•\s]+/, '').trim(),
      completed: false,
      similarity: 0
    }));
}

/**
 * モックToDo生成（開発用）
 */
function generateMockTodos(businessInfo) {
  const baseTodos = [
    '予算規模と承認プロセスを確認する',
    '決済権限者との面談をセッティングする',
    '現在の課題の詳細とPain Pointを深掘りする',
    '導入時期とスケジュールを具体化する',
    'ROI期待値と成功指標を明確化する',
    '競合他社との比較検討状況を確認する',
    '導入後のサポート体制について説明する'
  ];

  return baseTodos.map((todo, index) => ({
    id: `todo-${index + 1}`,
    text: todo,
    completed: false,
    similarity: 0,
    vector: generateMockVector(todo)
  }));
}

/**
 * GET /api/gemini
 * Gemini API機能確認
 */
export async function GET() {
  return NextResponse.json({
    message: 'Gemini API統合機能稼働中',
    features: {
      vectorize: 'テキストベクトル化',
      similarity: 'コサイン類似度計算',
      'generate-todos': 'BANT条件ベースToDo生成'
    },
    apiStatus: genAI ? 'connected' : 'mock-mode',
    timestamp: new Date().toISOString()
  });
}