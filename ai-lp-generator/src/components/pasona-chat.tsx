'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ArrowRight, Send, CheckCircle } from 'lucide-react'

interface PasonaChatProps {
  onComplete: (pasonaData: PasonaData) => void
  onBack?: () => void
}

interface PasonaData {
  problem: string
  affinity: string
  solution: string
  offer: string
  narrowingDown: string
  action: string
}

interface ChatStep {
  id: keyof PasonaData
  title: string
  question: string
  placeholder: string
  description: string
}

const CHAT_STEPS: ChatStep[] = [
  {
    id: 'problem',
    title: 'Problem（問題の明確化）',
    question: 'あなたのターゲット顧客が抱えている問題や悩みは何ですか？',
    placeholder: '例：時間がない中で効率的にマーケティングを行いたいが、どこから始めればいいかわからない',
    description: '顧客が直面している具体的な問題や課題を教えてください。'
  },
  {
    id: 'affinity',
    title: 'Affinity（親近感の構築）',
    question: 'その問題について、あなた自身や会社はどのような経験をしましたか？',
    placeholder: '例：私たちも同じ悩みを抱えており、試行錯誤の末に効果的な方法を見つけました',
    description: '顧客との共感を築くエピソードや体験談を教えてください。'
  },
  {
    id: 'solution',
    title: 'Solution（解決策の提示）',
    question: 'その問題に対する具体的な解決策は何ですか？',
    placeholder: '例：AI を活用した自動化ツールにより、わずか 10 分で本格的なマーケティング戦略を策定',
    description: '提供する商品・サービスによる解決方法を具体的に説明してください。'
  },
  {
    id: 'offer',
    title: 'Offer（具体的な提案）',
    question: 'どのような商品・サービスを、どのような条件で提供しますか？',
    placeholder: '例：月額 9,800 円で利用開始、初月無料、解約金なし、24 時間サポート付き',
    description: '価格、条件、特典などの具体的なオファー内容を教えてください。'
  },
  {
    id: 'narrowingDown',
    title: 'Narrowing down（対象の絞り込み）',
    question: 'このサービスは特にどのような人におすすめですか？',
    placeholder: '例：年商 5,000 万円以上の中小企業経営者で、デジタルマーケティングに取り組みたい方',
    description: '理想的な顧客像や、特に効果的な対象者を明確にしてください。'
  },
  {
    id: 'action',
    title: 'Action（行動への誘導）',
    question: '顧客に今すぐ取ってもらいたい行動は何ですか？',
    placeholder: '例：今すぐ無料体験に申し込んで、AI マーケティングツールの威力を実感してください',
    description: '具体的なCTA（Call to Action）を教えてください。'
  }
]

export default function PasonaChat({ onComplete, onBack }: PasonaChatProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [pasonaData, setPasonaData] = useState<PasonaData>({
    problem: '',
    affinity: '',
    solution: '',
    offer: '',
    narrowingDown: '',
    action: ''
  })
  const [inputValue, setInputValue] = useState('')

  const currentChatStep = CHAT_STEPS[currentStep]

  const handleNext = () => {
    if (!inputValue.trim()) return

    // Update PASONA data
    setPasonaData(prev => ({
      ...prev,
      [currentChatStep.id]: inputValue.trim()
    }))

    if (currentStep < CHAT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      setInputValue('')
    } else {
      // Complete the chat
      const finalData = {
        ...pasonaData,
        [currentChatStep.id]: inputValue.trim()
      }
      onComplete(finalData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setInputValue(pasonaData[CHAT_STEPS[currentStep - 1].id])
    } else if (onBack) {
      onBack()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleNext()
    }
  }

  const progress = ((currentStep + 1) / CHAT_STEPS.length) * 100

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            ステップ {currentStep + 1} / {CHAT_STEPS.length}
          </span>
          <span className="text-sm text-gray-600">{Math.round(progress)}% 完了</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            {currentChatStep.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="font-medium text-blue-900 mb-2">
              {currentChatStep.question}
            </p>
            <p className="text-sm text-blue-700">
              {currentChatStep.description}
            </p>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              回答を入力してください
            </label>
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentChatStep.placeholder}
              className="min-h-[120px]"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Ctrl + Enter で次のステップへ進めます
            </p>
          </div>

          {/* Previous Answers Summary */}
          {currentStep > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">これまでの回答:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {CHAT_STEPS.slice(0, currentStep).map((step, index) => (
                  <div key={step.id} className="text-xs bg-gray-50 p-2 rounded">
                    <span className="font-medium">{step.title}:</span>
                    <span className="ml-2 text-gray-600">
                      {pasonaData[step.id].substring(0, 80)}
                      {pasonaData[step.id].length > 80 ? '...' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 0 ? 'ダッシュボードに戻る' : '前へ'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!inputValue.trim()}
              className="flex items-center gap-2"
            >
              {currentStep === CHAT_STEPS.length - 1 ? (
                <>
                  <Send className="w-4 h-4" />
                  LP を生成
                </>
              ) : (
                <>
                  次へ
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}