'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import GenerationStatus from '@/components/generation-status'
import ErrorHandler from '@/components/error-handler'

type FormState = {
  siteName: string
  brief: string
  problem: string
  affinity: string
  solution: string
  offer: string
  narrowingDown: string
  action: string
  primary: string
  accent: string
  background: string
  nav: string
  logoText: string
  x: string
  linkedin: string
  github: string
  email: string
  url: string
  skipAiFix: boolean
}

type Step = {
  id: string
  title: string
  subtitle?: string
  fields: (keyof FormState)[]
  required?: (keyof FormState)[]
}

const steps: Step[] = [
  {
    id: 'basic',
    title: '基本情報',
    subtitle: 'サイトの基本的な情報を入力してください',
    fields: ['siteName', 'brief'],
    required: ['siteName']
  },
  {
    id: 'pasona',
    title: 'PASONAフレームワーク',
    subtitle: '顧客の課題と解決策を明確にしましょう',
    fields: ['problem', 'affinity', 'solution', 'offer', 'narrowingDown', 'action']
  },
  {
    id: 'design',
    title: 'デザイン設定',
    subtitle: 'ブランドカラーを選択してください',
    fields: ['primary', 'accent', 'background']
  },
  {
    id: 'navigation',
    title: 'ナビゲーション',
    subtitle: 'サイトの構成を設定します',
    fields: ['nav', 'logoText']
  },
  {
    id: 'social',
    title: 'ソーシャル・連絡先',
    subtitle: 'SNSと連絡先情報を設定します',
    fields: ['x', 'linkedin', 'github', 'email', 'url']
  },
  {
    id: 'options',
    title: '生成オプション',
    subtitle: '追加の設定を行います',
    fields: ['skipAiFix']
  }
]

const fieldLabels: Record<keyof FormState, string> = {
  siteName: 'サイト名',
  brief: '概要・補足',
  problem: 'Problem（問題提起）',
  affinity: 'Affinity（親近感）',
  solution: 'Solution（解決策）',
  offer: 'Offer（提案）',
  narrowingDown: 'Narrowing Down（絞り込み）',
  action: 'Action（行動喚起）',
  primary: 'プライマリカラー',
  accent: 'アクセントカラー',
  background: '背景色',
  nav: 'ナビゲーション項目',
  logoText: 'ロゴテキスト',
  x: 'X (Twitter) URL',
  linkedin: 'LinkedIn URL',
  github: 'GitHub URL',
  email: 'メールアドレス',
  url: 'WebサイトURL',
  skipAiFix: '生成直後の自動修復をスキップ'
}

const fieldPlaceholders: Partial<Record<keyof FormState, string>> = {
  siteName: '例: AI営業支援ツール',
  brief: '例: 営業活動を効率化するAIアシスタント',
  problem: '例: 営業活動に時間がかかりすぎて、本来の顧客対応に集中できない',
  affinity: '例: 多くの営業担当者が日々の業務に追われています',
  solution: '例: AIが営業タスクを自動化し、効率を3倍に',
  offer: '例: 14日間の無料トライアルを実施中',
  narrowingDown: '例: 月間100件以上の商談を抱える営業チーム向け',
  action: '例: 今すぐ無料で始める',
  nav: '例: Features,Pricing,FAQ,Contact',
  logoText: '例: CloudSync Pro',
  email: '例: contact@example.com',
  url: '例: https://example.com'
}

export default function ConceptPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    siteName: '',
    brief: '',
    problem: '',
    affinity: '',
    solution: '',
    offer: '',
    narrowingDown: '',
    action: '',
    primary: '#0EA5E9',
    accent: '#9333EA',
    background: '#0B1221',
    nav: 'Features,Pricing,FAQ,Contact',
    logoText: '',
    x: '',
    linkedin: '',
    github: '',
    email: '',
    url: '',
    skipAiFix: false,
  })
  const [suggestions, setSuggestions] = useState<Partial<Record<keyof FormState, string[]>>>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState<string | null>(null)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  
  // デバッグ用：suggestions state変更を監視
  useEffect(() => {
    console.log('🔄 [DEBUG] suggestions state変更検出:', suggestions)
  }, [suggestions])
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [conceptPath, setConceptPath] = useState<string>('')
  const [projectPath, setProjectPath] = useState<string>('')
  const [conceptId, setConceptId] = useState<string>('')
  const [archiveUrl, setArchiveUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [fixErrors, setFixErrors] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [projectMeta, setProjectMeta] = useState<{
    conceptId?: string
    archiveSize?: number
    checksum?: string
    version?: number
  }>({})

  // フォールバックサジェスト機能
  const provideFallbackSuggestions = (type: string) => {
    const fallbackSuggestions: Partial<Record<keyof FormState, string[]>> = {}
    
    if (type === 'colors') {
      fallbackSuggestions.primary = ['#0EA5E9', '#3B82F6', '#8B5CF6', '#EF4444', '#10B981']
      fallbackSuggestions.accent = ['#9333EA', '#F59E0B', '#EF4444', '#10B981', '#6366F1']
      fallbackSuggestions.background = ['#0B1221', '#1F2937', '#374151', '#FFFFFF', '#F9FAFB']
    } else if (type === 'pasona') {
      fallbackSuggestions.problem = [
        '現在の業務プロセスが非効率で、時間と労力を無駄にしている',
        '競合他社に差をつけられ、市場での地位が危うくなっている',
        '従来の方法では限界があり、新しいアプローチが必要'
      ]
      fallbackSuggestions.affinity = [
        '多くの企業が同じ課題に直面しています',
        'あなたと同じ悩みを抱える経営者が増えています',
        'この問題は業界全体の共通課題となっています'
      ]
      fallbackSuggestions.solution = [
        '最新のAI技術により、効率を3倍向上させます',
        '独自のアルゴリズムで、これまでにない成果を実現',
        '実績のあるソリューションで確実な改善を保証'
      ]
    }
    
    setSuggestions(prev => ({ ...prev, ...fallbackSuggestions }))
    setSuggestionError(`APIからの取得に失敗したため、デフォルトのサジェストを表示しています`)
  }

  useEffect(() => {
    if (currentStep === 2 && form.siteName && !suggestions.primary) {
      // デザインステップに入ったら色のサジェストを取得
      getSuggestions('colors')
    }
  }, [currentStep, form.siteName])

  if (loading) return null
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">ログインが必要です</h1>
        <p>このページにアクセスするにはログインしてください。</p>
      </div>
    )
  }

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const update = (name: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const getSuggestions = async (type: string) => {
    console.log('🔍 [DEBUG] getSuggestions開始:', { type, siteName: form.siteName, currentSuggestions: suggestions })
    
    if (!form.siteName) {
      console.warn('⚠️ [DEBUG] サイト名が未入力のため、サジェストをスキップします')
      return
    }
    
    setLoadingSuggestions(type)
    console.log('🔄 [DEBUG] ローディング状態設定:', type)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒タイムアウト
      
      const requestBody = { 
        type,
        siteName: form.siteName,
        brief: form.brief,
        problem: form.problem,
        context: form
      }
      console.log('📤 [DEBUG] API リクエスト送信:', requestBody)
      
      const res = await fetch('/api/concepts/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('📥 [DEBUG] API レスポンス受信:', { status: res.status, ok: res.ok })
      
      if (res.ok) {
        const data = await res.json()
        console.log('📊 [DEBUG] レスポンスデータ:', data)
        
        if (data.success && data.suggestions) {
          console.log('✅ [DEBUG] サジェストデータ有効、state更新前:', { 
            newSuggestions: data.suggestions,
            currentSuggestions: suggestions
          })
          
          setSuggestions(prev => {
            const updated = { ...prev, ...data.suggestions }
            console.log('🔄 [DEBUG] state更新実行:', { prev, new: data.suggestions, result: updated })
            return updated
          })
          
          console.log('✅ [DEBUG] サジェストstate更新完了')
        } else {
          console.warn('⚠️ [DEBUG] サジェストデータが不正です:', data)
          // フォールバック処理
          provideFallbackSuggestions(type)
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'レスポンス解析エラー' }))
        console.error('❌ [DEBUG] サジェストAPI エラー:', res.status, errorData)
        // フォールバック処理
        provideFallbackSuggestions(type)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('⏰ [DEBUG] サジェスト取得がタイムアウトしました')
      } else {
        console.error('❌ [DEBUG] サジェスト取得エラー:', error)
      }
      // フォールバック処理
      provideFallbackSuggestions(type)
    } finally {
      setLoadingSuggestions(null)
      console.log('🏁 [DEBUG] getSuggestions終了、ローディングクリア')
    }
  }

  const handleNext = () => {
    // 必須フィールドのチェック
    const required = currentStepData.required || []
    for (const field of required) {
      if (!form[field]) {
        alert(`${fieldLabels[field]}は必須です`)
        return
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async () => {
    if (!form.siteName.trim()) {
      alert('サイト名は必須です。')
      return
    }
    
    setSaving(true)
    setIsGenerating(true)
    setGenerationError(null)
    setGenerationSuccess(null)
    setLog(['コンセプトを保存しています...'])
    
    try {
      // 1) 概念Markdownを保存
      console.log('🔥 EMERGENCY DEBUG: Sending to /api/concepts:', form)
      const res = await fetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      console.log('🔥 EMERGENCY DEBUG: Response status:', res.status, res.statusText)
      const data = await res.json()
      console.log('🔥 EMERGENCY DEBUG: Response data:', data)
      if (!res.ok || !data?.filePath) throw new Error(data?.error || 'Failed to save concept')
      setConceptPath(data.filePath)
      
      // Set conceptId if available from the response
      if (data.conceptId) {
        setConceptId(data.conceptId)
      }
      
      setLog((l) => [...l, `Markdown を作成しました: ${data.filePath}`])

      // 2) 生成
      setLog((l) => [...l, 'プロジェクトを生成します...'])
      
      const generatePayload = { 
        name: form.siteName, 
        file: data.filePath, 
        skipAiFix: form.skipAiFix, 
        useCliMode: true,
        conceptId: data.conceptId || conceptId
      }
      console.log('🔥 DEBUG: Sending to /api/generate:', generatePayload)
      
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatePayload),
      })
      
      console.log('🔥 DEBUG: Generate response status:', genRes.status, genRes.statusText)
      const genData = await genRes.json()
      console.log('🔥 DEBUG: Generate response data:', genData)
      if (!genRes.ok || !genData?.project?.projectPath) throw new Error(genData?.error || 'Failed to generate project')
      setProjectPath(genData.project.projectPath)
      
      // Set archiveUrl if available
      if (genData.archive?.downloadUrl) {
        setArchiveUrl(genData.archive.downloadUrl)
      }
      
      // Set generated code if available
      if (genData.code) {
        setGeneratedCode(genData.code)
      }

      // Set project metadata
      if (genData.archive) {
        setProjectMeta({
          conceptId: data.conceptId || conceptId,
          archiveSize: genData.archive.size,
          checksum: genData.archive.checksum,
          version: 1
        })
      }
      
      setLog((l) => [...l, '生成が完了しました'])
      setGenerationSuccess('LPプロジェクトが正常に生成されました！編集ページにリダイレクトします...')
      
      // V0エディターにリダイレクト
      const projectName = genData.project?.projectName || genData.project?.name || genData.projectName
      if (projectName) {
        const redirectProjectId = projectName
        setIsRedirecting(true)
        setTimeout(() => {
          router.push(`/v0-editor?archive=${redirectProjectId}`)
        }, 2000) // 2秒後にリダイレクト（成功メッセージを見せるため）
      } else {
        // プロジェクト名がない場合は完了画面を表示
        setCurrentStep(steps.length)
      }
    } catch (err: any) {
      const errorMessage = err?.message || err
      setLog((l) => [...l, `エラー: ${errorMessage}`])
      setGenerationError(errorMessage)
    } finally {
      setSaving(false)
      setIsGenerating(false)
      setIsRedirecting(false)
    }
  }

  const handleAddError = (error: string) => {
    setFixErrors(prev => [...prev, error])
  }

  const handleRemoveError = (index: number) => {
    setFixErrors(prev => prev.filter((_, i) => i !== index))
  }

  const handleFixErrors = async () => {
    if (!generatedCode || fixErrors.length === 0) return
    
    setIsFixing(true)
    setGenerationError(null)
    
    try {
      const response = await fetch('/api/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: generatedCode,
          errors: fixErrors,
          projectId: conceptId
        }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'AI修正に失敗しました')
      }
      
      if (result.fixedCode) {
        setGeneratedCode(result.fixedCode)
        setFixErrors([])
        setGenerationSuccess('コードが正常に修正されました！')
      }
    } catch (err: any) {
      setGenerationError(err.message || 'AI修正中にエラーが発生しました')
    } finally {
      setIsFixing(false)
    }
  }

  const handleDownload = async () => {
    if (!conceptId) {
      setDownloadError('プロジェクトIDが見つかりません')
      return
    }

    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/projects/${conceptId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'ダウンロードに失敗しました')
      }

      // 署名URLでファイルをダウンロード
      const link = document.createElement('a')
      link.href = result.signedUrl
      link.download = `${result.projectName || 'project'}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setGenerationSuccess('ファイルのダウンロードを開始しました')
    } catch (error: any) {
      setDownloadError(error.message || 'ダウンロード中にエラーが発生しました')
    } finally {
      setIsDownloading(false)
    }
  }

  // 完了画面
  if (currentStep >= steps.length) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🎉 生成完了！</h1>
          <p className="text-gray-600">LPの生成が完了しました</p>
        </div>

        {/* Generation Status Component */}
        <div className="mb-6">
          <GenerationStatus
            isGenerating={isGenerating}
            isFixing={isFixing}
            error={generationError}
            success={generationSuccess}
            generatedCode={generatedCode}
            onRetry={onSubmit}
            onFix={handleFixErrors}
            onDownload={handleDownload}
            isDownloading={isDownloading}
            downloadError={downloadError}
            projectMeta={projectMeta}
            onPreview={() => {
              if (projectPath) {
                window.open(`/preview/${projectPath}`, '_blank')
              }
            }}
          />
        </div>

        {/* Error Handler Component */}
        {generatedCode && (
          <div className="mb-6">
            <ErrorHandler
              errors={fixErrors}
              onAddError={handleAddError}
              onRemoveError={handleRemoveError}
              onFixErrors={handleFixErrors}
              isFixing={isFixing}
              fixSuccess={generationSuccess?.includes('修正') || false}
            />
          </div>
        )}

        <div className="space-y-6">
          {conceptId && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">🆔 コンセプトID</h3>
              <code className="bg-purple-100 px-2 py-1 rounded text-sm">{conceptId}</code>
            </div>
          )}
          
          {conceptPath && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📄 Markdown ファイル</h3>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{conceptPath}</code>
            </div>
          )}
          
          {projectPath && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📁 生成されたプロジェクト</h3>
              <code className="bg-blue-100 px-2 py-1 rounded text-sm block mb-3">{projectPath}</code>
              
              <h3 className="font-semibold mb-2">🚀 起動コマンド</h3>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                <div>cd {projectPath}</div>
                <div>npm install</div>
                <div>npm run dev</div>
              </div>
            </div>
          )}
          
          {archiveUrl && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📦 プロジェクトアーカイブ</h3>
              <div className="flex items-center gap-4">
                <code className="bg-green-100 px-2 py-1 rounded text-sm flex-1">{archiveUrl}</code>
                <button
                  onClick={() => window.open(archiveUrl, '_blank')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                >
                  ダウンロード
                </button>
              </div>
            </div>
          )}

          {log.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📝 実行ログ</h3>
              <ul className="space-y-1 text-sm">
                {log.map((line, idx) => (
                  <li key={idx} className="text-gray-700">{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              ダッシュボードへ
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              新しいLPを作成
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">対話型コンセプト作成</h1>
        <p className="text-gray-600">質問に答えながら、最適なLPを生成します</p>
      </div>

      {/* プログレスバー */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                  ${idx < currentStep ? 'bg-green-500 text-white' : 
                    idx === currentStep ? 'bg-blue-600 text-white' : 
                    'bg-gray-200 text-gray-600'}`}
              >
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 
                    ${idx < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
          {currentStepData.subtitle && (
            <p className="text-sm text-gray-600 mt-1">{currentStepData.subtitle}</p>
          )}
        </div>
      </div>

      {/* フォーム */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="space-y-6">
          {currentStepData.fields.map((field) => {
            const label = fieldLabels[field]
            const placeholder = fieldPlaceholders[field]
            const value = form[field]
            const fieldSuggestions = suggestions[field]
            
            if (field === 'skipAiFix') {
              return (
                <div key={field} className="flex items-center gap-2">
                  <input
                    id={field}
                    type="checkbox"
                    checked={value as boolean}
                    onChange={(e) => update(field, e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor={field} className="text-sm">{label}</label>
                </div>
              )
            }

            // カラーフィールドの特別処理
            if (['primary', 'accent', 'background'].includes(field)) {
              return (
                <div key={field}>
                  <label className="block text-sm font-medium mb-2">{label}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={value as string}
                      onChange={(e) => update(field, e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 border rounded px-3 py-2"
                    />
                    <input
                      type="color"
                      value={value as string}
                      onChange={(e) => update(field, e.target.value)}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                  </div>
                  {fieldSuggestions && fieldSuggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">💡 おすすめ:</p>
                      <div className="flex gap-2">
                        {fieldSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => update(field, suggestion)}
                            className="px-3 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: suggestion }}
                            />
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            // PASONAフィールドの特別処理
            if (['problem', 'affinity', 'solution', 'offer', 'narrowingDown', 'action'].includes(field)) {
              return (
                <div key={field}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">{label}</label>
                    {field === 'problem' && form.siteName && !loadingSuggestions && (
                      <button
                        onClick={() => getSuggestions('pasona')}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        💡 AIでサジェスト
                      </button>
                    )}
                  </div>
                  <textarea
                    value={value as string}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full border rounded px-3 py-2 h-24"
                  />
                  {fieldSuggestions && fieldSuggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 mb-1">
                        💡 AIサジェスト ({fieldSuggestions.length}件):
                      </p>
                      <div className="space-y-1">
                        {fieldSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              console.log(`🔄 [DEBUG] サジェスト適用: ${field} = "${suggestion}"`)
                              update(field, suggestion)
                            }}
                            className="block w-full text-left px-3 py-2 text-sm border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <span className="text-blue-600 font-medium">#{idx + 1}</span> {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* デバッグ情報表示 */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-1 text-xs text-gray-400">
                      [DEBUG] field: {field}, suggestions: {fieldSuggestions?.length || 0}件, 
                      all suggestions keys: {Object.keys(suggestions).join(', ')}
                    </div>
                  )}
                </div>
              )
            }

            // 通常のテキストフィールド
            return (
              <div key={field}>
                <label className="block text-sm font-medium mb-2">
                  {label}
                  {currentStepData.required?.includes(field) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full border rounded px-3 py-2"
                  required={currentStepData.required?.includes(field)}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={isFirstStep}
          className={`px-6 py-2 rounded ${
            isFirstStep
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          前へ
        </button>

        {isLastStep ? (
          <button
            onClick={onSubmit}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {saving ? 'LPを生成中...' : 'LPを生成する'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            次へ
          </button>
        )}
      </div>

      {/* ローディング表示 */}
      {loadingSuggestions && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full h-5 w-5 border-2 border-transparent border-t-blue-600 animate-pulse"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">AIサジェスト生成中</p>
              <p className="text-xs text-gray-600">{loadingSuggestions}の候補を作成しています...</p>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      )}

      {/* サジェストエラー通知 */}
      {suggestionError && (
        <div className="fixed bottom-20 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 z-50 max-w-sm">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-yellow-800">{suggestionError}</p>
            </div>
            <button
              onClick={() => setSuggestionError(null)}
              className="flex-shrink-0"
            >
              <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 生成中オーバーレイ */}
      {(saving || isRedirecting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-2xl">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-pulse w-8 h-8 bg-blue-600 rounded-full opacity-20"></div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">
                {isRedirecting ? '✅ 完了！プレビューページへ移動中...' : '🚀 LPを生成中...'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {isRedirecting 
                  ? 'プレビューページにリダイレクトしています。しばらくお待ちください...'
                  : 'AIがあなたのコンセプトを基に最適なランディングページを作成しています'
                }
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className={`bg-gradient-to-r h-2 rounded-full ${
                    isRedirecting 
                      ? 'from-green-500 to-blue-600 w-full' 
                      : 'from-blue-500 to-purple-600 animate-pulse'
                  }`} 
                  style={{width: isRedirecting ? '100%' : '45%'}}
                ></div>
              </div>
              {log.length > 0 && (
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs font-medium text-gray-700">処理状況</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto border">
                    {log.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-2 mb-1">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-xs text-gray-700 leading-relaxed">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-4">
                この処理には数分かかる場合があります
              </p>
            </div>
          </div>
        </div>
      )}

      {/* エラー通知 */}
      {generationError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold">エラーが発生しました</p>
              <p className="text-sm mt-1">{generationError}</p>
            </div>
            <button
              onClick={() => setGenerationError(null)}
              className="flex-shrink-0 ml-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 成功通知 */}
      {generationSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold">成功</p>
              <p className="text-sm mt-1">{generationSuccess}</p>
            </div>
            <button
              onClick={() => setGenerationSuccess(null)}
              className="flex-shrink-0 ml-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}