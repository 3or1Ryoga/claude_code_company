import { NextResponse } from 'next/server';

/**
 * POST /api/voice
 * クライアントサイド音声処理API
 * 音声データの文字起こし処理
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json(
        { error: '音声ファイルが必要です' },
        { status: 400 }
      );
    }

    console.log(`[Voice API] 音声ファイル受信: ${audioFile.size}バイト`);
    
    // Web Speech APIによる文字起こし処理のシミュレーション
    // 実際の実装では、Google Speech-to-Text API或いはWeb Speech APIを使用
    const mockTranscription = generateMockTranscription();
    
    const result = {
      success: true,
      transcription: mockTranscription,
      timestamp: new Date().toISOString(),
      audioSize: audioFile.size,
      duration: formData.get('duration') || '30s'
    };

    console.log('[Voice API] 文字起こし完了:', result.transcription);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[Voice API] エラー:', error);
    return NextResponse.json(
      { error: '音声処理中にエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/voice
 * 音声処理機能の状態確認
 */
export async function GET() {
  return NextResponse.json({
    message: 'クライアントサイド音声処理API稼働中',
    features: {
      'audio-recording': '音声録音機能',
      'speech-to-text': '音声文字起こし',
      'real-time-processing': 'リアルタイム処理（30秒間隔）'
    },
    status: 'active',
    timestamp: new Date().toISOString()
  });
}

/**
 * モック文字起こしデータ生成（開発・テスト用）
 */
function generateMockTranscription() {
  const mockPhrases = [
    'それでは予算についてお聞きしたいのですが',
    '導入時期はいつ頃をお考えでしょうか',
    '決済権限はどなたがお持ちでしょうか', 
    '現在お困りの課題について詳しく教えてください',
    '他社との比較検討はされていますか',
    'ROIの期待値はどの程度でしょうか'
  ];
  
  return mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
}