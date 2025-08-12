'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import PasonaChat from '@/components/pasona-chat'

// react-live と UIコンポーネントをインポート
import { LiveProvider, LivePreview, LiveError } from 'react-live'
import * as LucideReact from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'


interface PasonaData {
  problem: string;
  affinity: string;
  solution: string;
  offer: string;
  narrowingDown: string;
  action: string;
}


export default function ChatCreatePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [showNameInput, setShowNameInput] = useState(false)
  const [pasonaData, setPasonaData] = useState<PasonaData | null>(null)

  // ★ 生成されたコードを保存するStateを追加
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handlePasonaComplete = (data: PasonaData) => {
    setPasonaData(data)
    setShowNameInput(true)
    setGeneratedCode(null); // 新しいセッションのためにクリア
  }

  // ★ handleGenerateLP を修正
  const handleGenerateLP = async () => {
    if (!pasonaData || !projectName.trim() || !user) {
        setError("プロジェクト名が入力されていないか、PASONAデータが不足しています。");
        return;
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedCode(null) // 生成開始時にクリア

    try {
      // APIが期待する形式にデータを整形
      const requestBody = {
        concept: projectName.trim(),
        description: `PASONAの法則に基づき、以下の要素を盛り込んでください。
        - 問題提起 (Problem): ${pasonaData.problem}
        - 親近感 (Affinity): ${pasonaData.affinity}
        - 解決策 (Solution): ${pasonaData.solution}
        - 提案 (Offer): ${pasonaData.offer}
        - 絞り込み (Narrowing Down): ${pasonaData.narrowingDown}
        - 行動喚起 (Action): ${pasonaData.action}
        `
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'LP生成に失敗しました')
      }

      // ★★★ フロントエンド側でコードをクリーンアップする処理を追加 ★★★
      let rawCode = result.code || '';
      
      // 'use client' ディレクティブを除去 (引用符の種類に対応)
      rawCode = rawCode.replace(/^'use client'|^"use client"|^`use client`\s*;?\s*/, '').trim();
      
      // Markdownのコードブロック構文を除去
      const cleanedCode = rawCode.replace(/^```tsx\n?|^```\n?/, '').replace(/\n?```$/, '').trim();

      // ★ クリーンアップしたコードをStateに保存
      setGeneratedCode(cleanedCode);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'LP生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  const handleBackToChat = () => {
    setShowNameInput(false)
    setGeneratedCode(null);
  }

  // react-liveに渡すコンポーネントのスコープ
  const scope = {
    ...LucideReact,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Alert,
    AlertDescription,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null
  }

  // ★ 生成されたコードがある場合にプレビューを表示する
  if (generatedCode) {
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800">{projectName}</h1>
                    <Button onClick={() => setGeneratedCode(null)}>新しいLPを作成する</Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>プレビュー</CardTitle>
                        <CardDescription>AIによって生成されたLPのプレビューです。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LiveProvider code={generatedCode} scope={scope}>
                            <div className="mb-4 p-4 border rounded-lg bg-red-50 border-red-200 text-red-800">
                                <LiveError />
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <LivePreview />
                            </div>
                        </LiveProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold">LP を生成中...</h3>
                <p className="text-sm text-gray-600 mt-2">
                  AI があなたの PASONA データから最適なランディングページを作成しています。
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-left">
                <p className="text-xs text-blue-800 font-medium mb-1">生成中のプロジェクト:</p>
                <p className="text-sm text-blue-900">{projectName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showNameInput && pasonaData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                PASONA ヒアリング完了
              </CardTitle>
              <CardDescription>
                プロジェクト名を入力して、LP の生成を開始してください。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-3">入力されたPASONAデータ:</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Problem:</span> {pasonaData.problem.substring(0, 100)}...</div>
                  <div><span className="font-medium">Affinity:</span> {pasonaData.affinity.substring(0, 100)}...</div>
                  <div><span className="font-medium">Solution:</span> {pasonaData.solution.substring(0, 100)}...</div>
                  <div><span className="font-medium">Offer:</span> {pasonaData.offer.substring(0, 100)}...</div>
                  <div><span className="font-medium">Narrowing Down:</span> {pasonaData.narrowingDown.substring(0, 100)}...</div>
                  <div><span className="font-medium">Action:</span> {pasonaData.action.substring(0, 100)}...</div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="projectName" className="text-sm font-medium text-gray-700">
                  プロジェクト名 *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="例：新商品ローンチLP、サービス紹介ページ"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleBackToChat}
                >
                  ヒアリングに戻る
                </Button>

                <Button
                  onClick={handleGenerateLP}
                  disabled={!projectName.trim() || isGenerating}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  LP を生成する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <PasonaChat 
        onComplete={handlePasonaComplete}
        onBack={handleBackToDashboard}
      />
    </div>
  )
}