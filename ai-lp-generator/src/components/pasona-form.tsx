'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

interface PasonaData {
  problem: string
  affinity: string
  solution: string
  offer: string
  narrowingDown: string
  action: string
}

interface PasonaFormProps {
  onSubmit: (data: PasonaData) => void
  isLoading?: boolean
  initialData?: PasonaData
}

const formFields = [
  {
    key: 'problem' as keyof PasonaData,
    title: 'Problem (問題提起)',
    description: '顧客が抱える悩みや痛みは何か？',
    placeholder: '例：「毎日の業務で時間管理に悩んでいませんか？」\n「売上が伸び悩み、どう改善すれば良いか分からない」',
    guide: '具体的な痛みや問題を明確にしましょう。ターゲットが「そうそう、それ！」と思える内容を記載してください。'
  },
  {
    key: 'affinity' as keyof PasonaData,
    title: 'Affinity (親近感)',
    description: 'その痛みに寄り添い、共感を示すメッセージは？',
    placeholder: '例：「私も同じ悩みを抱えていました」\n「多くの経営者が同じ課題で困っています」',
    guide: '読み手との距離を縮め、信頼関係を築くためのメッセージを入力してください。'
  },
  {
    key: 'solution' as keyof PasonaData,
    title: 'Solution (解決策)',
    description: 'その問題を具体的にどう解決するのか？',
    placeholder: '例：「独自の時間管理システムで効率を3倍向上」\n「データ分析による売上改善手法」',
    guide: '問題に対する具体的で実現可能な解決策を提示してください。'
  },
  {
    key: 'offer' as keyof PasonaData,
    title: 'Offer (提案)',
    description: '商品やサービスの具体的な内容、価格、特典は？',
    placeholder: '例：「月額9,800円で全機能利用可能」\n「初回限定50%OFF + 30日間返金保証」',
    guide: '価格、サービス内容、特典など具体的なオファーを記載してください。'
  },
  {
    key: 'narrowingDown' as keyof PasonaData,
    title: 'Narrowing down (絞込)',
    description: 'なぜ「今」買うべきなのか？（限定性、緊急性）',
    placeholder: '例：「先着100名様限定」\n「キャンペーン終了まであと3日」',
    guide: '今すぐ行動を起こすべき理由を明確に示してください。'
  },
  {
    key: 'action' as keyof PasonaData,
    title: 'Action (行動)',
    description: '顧客に取ってほしい最終的な行動は？',
    placeholder: '例：「今すぐ無料体験に申し込む」\n「詳細資料をダウンロードする」',
    guide: '具体的で明確なアクションを指示してください。'
  }
]

export default function PasonaForm({ onSubmit, isLoading = false, initialData }: PasonaFormProps) {
  const [formData, setFormData] = useState<PasonaData>(initialData || {
    problem: '',
    affinity: '',
    solution: '',
    offer: '',
    narrowingDown: '',
    action: ''
  })

  const [expandedGuides, setExpandedGuides] = useState<Set<string>>(new Set())

  const handleInputChange = (key: keyof PasonaData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleGuide = (key: string) => {
    setExpandedGuides(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const isFormValid = Object.values(formData).every(value => value.trim().length > 0)

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            PASONAヒアリングフォーム
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            高コンバージョンLPを生成するための6つの要素を入力してください
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map((field, index) => (
              <div key={field.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key} className="text-base font-semibold">
                    {index + 1}. {field.title}
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGuide(field.key)}
                    className="p-1"
                  >
                    <InfoIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {field.description}
                </p>

                {expandedGuides.has(field.key) && (
                  <div className="bg-blue-50 p-3 rounded-md border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800">{field.guide}</p>
                  </div>
                )}

                <Textarea
                  id={field.key}
                  placeholder={field.placeholder}
                  value={formData[field.key]}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  rows={4}
                  className="resize-none"
                  required
                />
              </div>
            ))}

            <Button 
              type="submit" 
              disabled={!isFormValid || isLoading}
              className="w-full py-3 text-lg font-semibold"
            >
              {isLoading ? 'LP生成中...' : 'LPを生成する'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}