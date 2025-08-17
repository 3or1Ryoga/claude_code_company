import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// CORS handler
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}

// AI Suggestion Templates based on PASONA Framework
const PASONA_TEMPLATES = {
  problem: [
    "多くの人が{siteName}に関する問題を抱えています",
    "{siteName}分野で困っている人が増加しています", 
    "従来の{siteName}では解決できない課題があります"
  ],
  affinity: [
    "{siteName}でお困りの方なら、きっと共感いただけるはずです",
    "同じ{siteName}の悩みを持つ多くの方が感じていることです",
    "{siteName}に携わる方なら、この気持ちを理解していただけるでしょう"
  ],
  solution: [
    "私たちの{siteName}ソリューションが、その問題を根本から解決します",
    "革新的な{siteName}アプローチで、課題を効率的に解決できます",
    "最新技術を活用した{siteName}で、問題を素早く解決します"
  ],
  offer: [
    "今なら{siteName}サービスを特別価格でご提供いたします",
    "期間限定で{siteName}の無料トライアルをご利用いただけます",
    "{siteName}専門コンサルタントによる無料相談を実施中です"
  ],
  narrowingDown: [
    "{siteName}に真剣に取り組む、意欲的な方に限定させていただきます",
    "本気で{siteName}を改善したい企業様のみ対象とさせていただきます",
    "{siteName}分野で成果を求める、本格的な方向けのサービスです"
  ],
  action: [
    "今すぐ{siteName}の無料相談にお申し込みください",
    "まずは{siteName}の資料をダウンロードして、詳細をご確認ください",
    "下記ボタンから{siteName}の無料トライアルを開始してください"
  ]
}

function generateSuggestion(type: string, siteName: string): string[] {
  const templates = (PASONA_TEMPLATES as any)[type] || []
  return templates.map((template: string) => 
    template.replace(/{siteName}/g, siteName || "あなたのサービス")
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, siteName, brief } = body

    if (!type || !siteName) {
      return NextResponse.json(
        { success: false, error: "タイプとサイト名は必須です" },
        { status: 400 }
      )
    }

    // Generate suggestions for the requested type
    const requestedSuggestions = generateSuggestion(type, siteName)
    
    // Also generate all PASONA suggestions if type is 'pasona'
    let allSuggestions = {}
    
    if (type === 'pasona') {
      // Generate all PASONA framework suggestions
      const pasonaTypes = ['problem', 'affinity', 'solution', 'offer', 'narrowingDown', 'action']
      allSuggestions = pasonaTypes.reduce((acc: any, pasonaType) => {
        acc[pasonaType] = generateSuggestion(pasonaType, siteName)
        return acc
      }, {})
    } else {
      // Single type suggestion
      allSuggestions = { [type]: requestedSuggestions }
    }
    
    return NextResponse.json({
      success: true,
      suggestions: allSuggestions,
      metadata: { type, siteName, generatedAt: new Date().toISOString() }
    })
    
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "サジェスト生成中にエラーが発生しました" },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: "AI Suggestion API is running",
    version: "1.0.0",
    available_types: Object.keys(PASONA_TEMPLATES)
  })
}
