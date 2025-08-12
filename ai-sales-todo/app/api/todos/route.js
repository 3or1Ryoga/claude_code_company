import { NextResponse } from 'next/server';

/**
 * POST /api/todos
 * ToDoリスト生成・管理API
 */
export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'generate':
        return await handleGenerateTodos(data);
      case 'update':
        return await handleUpdateTodo(data);
      case 'complete':
        return await handleCompleteTodo(data);
      case 'check-similarity':
        return await handleCheckSimilarity(data);
      default:
        return NextResponse.json(
          { error: '無効なアクションです' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ToDos API] エラー:', error);
    return NextResponse.json(
      { error: 'ToDo処理中にエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * ToDo生成処理
 */
async function handleGenerateTodos({ businessInfo, chatHistory }) {
  console.log('[ToDos API] ToDo生成開始:', businessInfo);
  
  // BANT条件分析
  const bantAnalysis = analyzeBantConditions(businessInfo, chatHistory);
  
  // Gemini APIと連携してToDo生成
  try {
    const geminiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate-todos',
        data: { businessInfo: bantAnalysis }
      })
    });
    
    if (geminiResponse.ok) {
      const geminiResult = await geminiResponse.json();
      
      if (geminiResult.success) {
        // 各ToDoにベクトル化を実行
        const todosWithVectors = await vectorizeTodos(geminiResult.todos);
        
        return NextResponse.json({
          success: true,
          todos: todosWithVectors,
          bantAnalysis: bantAnalysis,
          source: 'generated',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (apiError) {
    console.warn('[ToDos API] Gemini API連携失敗、フォールバック実行:', apiError.message);
  }
  
  // フォールバック: ローカル生成
  const fallbackTodos = generateFallbackTodos(bantAnalysis);
  const todosWithVectors = await vectorizeTodos(fallbackTodos);
  
  return NextResponse.json({
    success: true,
    todos: todosWithVectors,
    bantAnalysis: bantAnalysis,
    source: 'fallback',
    timestamp: new Date().toISOString()
  });
}

/**
 * ToDo更新処理
 */
async function handleUpdateTodo({ todoId, updates }) {
  console.log('[ToDos API] ToDo更新:', todoId, updates);
  
  // 実際の実装では永続化ストレージ（DB）に保存
  const updatedTodo = {
    id: todoId,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  return NextResponse.json({
    success: true,
    todo: updatedTodo
  });
}

/**
 * ToDo完了処理
 */
async function handleCompleteTodo({ todoId, similarity, transcription }) {
  console.log('[ToDos API] ToDo完了処理:', todoId, similarity);
  
  const completedTodo = {
    id: todoId,
    completed: true,
    completedAt: new Date().toISOString(),
    completedBy: 'voice-detection',
    similarity: similarity,
    triggerTranscription: transcription
  };
  
  return NextResponse.json({
    success: true,
    todo: completedTodo,
    message: 'ToDoが音声認識により自動完了されました'
  });
}

/**
 * 類似度チェック処理
 */
async function handleCheckSimilarity({ todos, transcription }) {
  console.log('[ToDos API] 類似度チェック:', transcription);
  
  const results = [];
  
  // 発話内容をベクトル化
  const speechVectorResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'vectorize',
      data: { texts: [transcription] }
    })
  });
  
  if (speechVectorResponse.ok) {
    const speechVectorResult = await speechVectorResponse.json();
    
    if (speechVectorResult.success && speechVectorResult.vectors.length > 0) {
      const speechVector = speechVectorResult.vectors[0].vector;
      
      // 各ToDoとの類似度計算
      for (const todo of todos) {
        if (!todo.completed && todo.vector) {
          const similarityResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gemini`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'similarity',
              data: {
                todoVector: todo.vector,
                speechVector: speechVector
              }
            })
          });
          
          if (similarityResponse.ok) {
            const similarityResult = await similarityResponse.json();
            
            results.push({
              todoId: todo.id,
              todoText: todo.text,
              similarity: similarityResult.similarity,
              isMatch: similarityResult.isMatch,
              threshold: similarityResult.threshold
            });
          }
        }
      }
    }
  }
  
  return NextResponse.json({
    success: true,
    results: results,
    transcription: transcription,
    timestamp: new Date().toISOString()
  });
}

/**
 * BANT条件分析
 */
function analyzeBantConditions(businessInfo, chatHistory = []) {
  return {
    budget: businessInfo.budget || 'unknown',
    authority: businessInfo.authority || 'unknown',
    needs: businessInfo.needs || businessInfo.challenges || 'unknown',
    timeline: businessInfo.timeline || 'unknown',
    industry: businessInfo.industry || 'unknown',
    companySize: businessInfo.companySize || 'unknown',
    chatSummary: chatHistory.slice(-5).map(chat => chat.message).join('; ')
  };
}

/**
 * ToDosベクトル化
 */
async function vectorizeTodos(todos) {
  try {
    const texts = todos.map(todo => todo.text);
    const vectorResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'vectorize',
        data: { texts: texts }
      })
    });
    
    if (vectorResponse.ok) {
      const vectorResult = await vectorResponse.json();
      
      if (vectorResult.success) {
        return todos.map((todo, index) => ({
          ...todo,
          vector: vectorResult.vectors[index]?.vector || null
        }));
      }
    }
  } catch (error) {
    console.warn('[ToDos API] ベクトル化失敗:', error.message);
  }
  
  return todos;
}

/**
 * フォールバック ToDo生成
 */
function generateFallbackTodos(bantAnalysis) {
  const baseTodos = [
    '予算規模と承認フローを明確化する',
    '決済権限者との面談をアレンジする', 
    '具体的な課題とペインポイントを深掘りする',
    '導入スケジュールと優先度を確認する',
    'ROI期待値と成功KPIを設定する',
    '他社検討状況と差別化要因を把握する'
  ];
  
  // BANT条件に基づいてカスタマイズ
  if (bantAnalysis.industry !== 'unknown') {
    baseTodos.push(`${bantAnalysis.industry}業界特有の課題を確認する`);
  }
  
  if (bantAnalysis.companySize !== 'unknown') {
    baseTodos.push(`${bantAnalysis.companySize}規模に適した導入プランを提案する`);
  }
  
  return baseTodos.map((todo, index) => ({
    id: `fallback-todo-${index + 1}`,
    text: todo,
    completed: false,
    similarity: 0,
    source: 'fallback-generation'
  }));
}

/**
 * GET /api/todos
 * ToDo管理機能確認
 */
export async function GET() {
  return NextResponse.json({
    message: 'ToDo生成・管理システム稼働中',
    features: {
      generate: 'BANT条件ベースToDo生成',
      update: 'ToDo更新機能',
      complete: '音声認識完了処理',
      'check-similarity': 'リアルタイム類似度チェック'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
}