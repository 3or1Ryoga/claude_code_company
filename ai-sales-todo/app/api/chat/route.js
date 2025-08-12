import { NextResponse } from 'next/server';

/**
 * POST /api/chat
 * BANT条件ヒアリングチャットAPI
 */
export async function POST(request) {
  try {
    const { message, sessionId, stage } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    console.log(`[Chat API] ユーザーメッセージ: ${message} (ステージ: ${stage || 'unknown'})`);
    
    // BANT条件ヒアリングステージ管理
    const currentStage = stage || 'budget';
    const response = await generateChatResponse(message, currentStage);
    
    return NextResponse.json({
      success: true,
      response: response.message,
      nextStage: response.nextStage,
      progress: response.progress,
      isComplete: response.isComplete,
      sessionId: sessionId || generateSessionId(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Chat API] エラー:', error);
    return NextResponse.json(
      { error: 'チャット処理中にエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * BANT条件ベースチャットレスポンス生成
 */
async function generateChatResponse(userMessage, currentStage) {
  const bantStages = {
    budget: {
      questions: [
        '予算についてお聞きします。今回のプロジェクトでご用意いただける投資額の目安はどのくらいでしょうか？',
        '予算の承認プロセスについて教えてください。どのような稟議フローになりますか？',
        'ROIや投資対効果についてはどの程度の期間で回収をお考えでしょうか？'
      ],
      nextStage: 'authority'
    },
    authority: {
      questions: [
        '決済権限についてお聞きします。最終的な導入の意思決定はどなたが行われますか？',
        '意思決定に関わるメンバーは他にいらっしゃいますか？',
        '導入決定までのプロセスとタイムラインはどのようになっていますか？'
      ],
      nextStage: 'needs'
    },
    needs: {
      questions: [
        '現在お困りの課題について詳しく教えてください。',
        'その課題により、現在どのような影響が出ていますか？',
        '理想的な解決状態はどのような状況でしょうか？'
      ],
      nextStage: 'timeline'
    },
    timeline: {
      questions: [
        '導入時期についてお聞きします。いつ頃から利用開始をお考えでしょうか？',
        'その時期に導入したい理由やきっかけはありますか？',
        '導入準備期間はどの程度確保できますか？'
      ],
      nextStage: 'complete'
    }
  };

  const stageInfo = bantStages[currentStage];
  
  if (!stageInfo) {
    return {
      message: 'ヒアリングが完了しました。ToDoリストを生成いたします。',
      nextStage: 'complete',
      progress: 100,
      isComplete: true
    };
  }

  // ユーザーの回答を分析（本番環境ではGemini APIで詳細分析）
  const analysis = analyzeUserResponse(userMessage, currentStage);
  
  // 次の質問を選択
  const nextQuestion = selectNextQuestion(stageInfo.questions, analysis);
  
  // 進捗計算
  const stageOrder = ['budget', 'authority', 'needs', 'timeline'];
  const currentIndex = stageOrder.indexOf(currentStage);
  const progress = Math.round(((currentIndex + 1) / stageOrder.length) * 100);
  
  return {
    message: `${analysis.acknowledgment}\n\n${nextQuestion}`,
    nextStage: stageInfo.nextStage,
    progress: progress,
    isComplete: currentStage === 'timeline',
    analysis: analysis
  };
}

/**
 * ユーザー回答分析
 */
function analyzeUserResponse(message, stage) {
  const message_lower = message.toLowerCase();
  
  const acknowledgments = {
    budget: [
      'ご予算についてお聞かせいただき、ありがとうございます。',
      '投資規模について理解いたしました。',
      '予算の件、承知いたしました。'
    ],
    authority: [
      '決済プロセスについてご説明いただき、ありがとうございます。',
      '意思決定の体制について理解いたしました。',
      '承認フローについて承知いたしました。'
    ],
    needs: [
      '現在の課題についてお聞かせいただき、ありがとうございます。',
      'お困りの状況について理解いたしました。',
      '課題の詳細について承知いたしました。'
    ],
    timeline: [
      'スケジュールについてお聞かせいただき、ありがとうございます。',
      '導入時期について理解いたしました。',
      'タイムラインについて承知いたしました。'
    ]
  };

  // 簡単なキーワード分析
  let urgency = 'medium';
  if (message_lower.includes('急') || message_lower.includes('すぐ')) {
    urgency = 'high';
  } else if (message_lower.includes('検討') || message_lower.includes('将来')) {
    urgency = 'low';
  }

  return {
    acknowledgment: acknowledgments[stage][Math.floor(Math.random() * acknowledgments[stage].length)],
    urgency: urgency,
    keywords: extractKeywords(message),
    sentiment: analyzeSentiment(message)
  };
}

/**
 * 次の質問選択
 */
function selectNextQuestion(questions, analysis) {
  // 分析結果に基づいて適切な質問を選択
  // シンプルな実装ではランダム選択
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * キーワード抽出
 */
function extractKeywords(text) {
  const keywords = [];
  const businessTerms = ['予算', '投資', '導入', 'ROI', '効果', '課題', '問題', '改善'];
  
  businessTerms.forEach(term => {
    if (text.includes(term)) {
      keywords.push(term);
    }
  });
  
  return keywords;
}

/**
 * 感情分析
 */
function analyzeSentiment(text) {
  const positiveTerms = ['良い', '期待', '効果', '改善', '解決'];
  const negativeTerms = ['困', '問題', '課題', '不安', '難しい'];
  
  let score = 0;
  positiveTerms.forEach(term => {
    if (text.includes(term)) score += 1;
  });
  negativeTerms.forEach(term => {
    if (text.includes(term)) score -= 1;
  });
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * セッションID生成
 */
function generateSessionId() {
  return 'chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * GET /api/chat
 * チャット機能確認
 */
export async function GET() {
  return NextResponse.json({
    message: 'BANT条件ヒアリングチャット稼働中',
    stages: [
      'budget - 予算・投資規模の確認',
      'authority - 意思決定権限の確認', 
      'needs - 課題・ニーズの深掘り',
      'timeline - 導入時期の確認'
    ],
    features: [
      'BANT条件段階的ヒアリング',
      'ユーザー回答分析',
      '進捗管理',
      'セッション管理'
    ],
    status: 'active',
    timestamp: new Date().toISOString()
  });
}