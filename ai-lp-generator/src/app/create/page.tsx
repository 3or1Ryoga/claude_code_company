'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PasonaForm from '@/components/pasona-form'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import Link from 'next/link'

interface PasonaData {
  problem: string
  affinity: string
  solution: string
  offer: string
  narrowingDown: string
  action: string
}

export default function CreateProjectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleFormSubmit = async (pasonaData: PasonaData) => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Submitting PASONA data:', pasonaData)

      // Generate project name with timestamp
      const projectName = `lp-project-${Date.now()}`

      const requestData = {
        project_name: projectName,
        user_id: user.id,
        pasona_problem: pasonaData.problem,
        pasona_affinity: pasonaData.affinity,
        pasona_solution: pasonaData.solution,
        pasona_offer: pasonaData.offer,
        pasona_narrowing_down: pasonaData.narrowingDown,
        pasona_action: pasonaData.action
      }

      console.log('Sending request to /api/generate:', requestData)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()
      
      console.log('API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'LP生成に失敗しました')
      }

      if (result.success) {
        setSuccess('LPプロジェクトが正常に作成されました！')
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } else {
        throw new Error(result.error || '不明なエラーが発生しました')
      }

    } catch (err) {
      console.error('LP generation error:', err)
      setError(err instanceof Error ? err.message : 'LP生成中にエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">AI LP Generator</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">ダッシュボードに戻る</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <p>{error}</p>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <p className="text-green-800">{success}</p>
            </Alert>
          )}

          <PasonaForm
            onSubmit={handleFormSubmit}
            isLoading={isGenerating}
          />
        </div>
      </main>
    </div>
  )
}