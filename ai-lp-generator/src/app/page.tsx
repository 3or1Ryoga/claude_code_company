'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import CodePreview from '@/components/code-preview'
import Link from 'next/link'

export default function Home() {
  const [concept, setConcept] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!concept.trim()) {
      setError('コンセプトを入力してください')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ concept }),
      })

      if (!response.ok) {
        throw new Error('生成に失敗しました')
      }

      const data = await response.json()
      setGeneratedCode(data.code || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveProject = async (projectData: { name: string, code: string }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectData.name,
          concept,
          code: projectData.code,
        }),
      })

      if (!response.ok) {
        throw new Error('プロジェクトの保存に失敗しました')
      }

      alert('プロジェクトを保存しました')
    } catch (error) {
      console.error('Save project error:', error)
      alert('プロジェクトの保存に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI LP Generator</h1>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline">ログイン</Button>
              </Link>
              <Link href="/signup">
                <Button>新規登録</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>LPコンセプト入力</CardTitle>
              <CardDescription>
                作りたいランディングページのコンセプトを入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="concept">コンセプト</Label>
                <Textarea
                  id="concept"
                  placeholder="例：オンライン英会話サービスのランディングページ。初心者向けで、月額制のサブスクリプションモデル。24時間いつでもレッスン可能で、ネイティブ講師とのマンツーマンレッスンが特徴。"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? '生成中...' : 'LP生成'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <div className="space-y-4">
            {generatedCode ? (
              <CodePreview
                code={generatedCode}
                projectName="Generated Landing Page"
                onSave={handleSaveProject}
                className="lg:sticky lg:top-6"
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>プレビュー</CardTitle>
                  <CardDescription>
                    生成されたTSXコードのプレビューが表示されます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-500 text-center py-8">
                    コンセプトを入力してLPを生成してください
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Introduction Section */}
        <div className="px-4 py-6 sm:px-0 mt-8">
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold mb-4">
                PASONAの法則で<br />
                高コンバージョンLPを自動生成
              </CardTitle>
              <CardDescription className="text-lg">
                AI LP Generatorは、PASONAの法則に基づいたヒアリングフォームを通じて、
                あなたのビジネスに最適化された高コンバージョンLPをAIで自動生成します。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">簡単6ステップ</h3>
                  <p className="text-sm text-gray-600">
                    PASONAの各要素に答えるだけで、プロ品質のLPが完成
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold mb-2">プロジェクト管理</h3>
                  <p className="text-sm text-gray-600">
                    作成したLPプロジェクトを永続的に管理・編集可能
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
