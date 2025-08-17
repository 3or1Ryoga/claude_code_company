'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import PasonaForm from '@/components/pasona-form'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface PasonaData {
  problem: string
  affinity: string
  solution: string
  offer: string
  narrowingDown: string
  action: string
}

interface GenerationResult {
  success: boolean
  code?: string
  dependencies?: string[]
  error?: string
  project?: any
}

export default function CreateProjectPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user) {
      // Redirect to the new concept-based workflow
      router.push('/concept')
    }
  }, [user, loading, router])

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">ページが移動しました</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            新しいコンセプトベースのワークフローに自動的にリダイレクトします...
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push('/concept')}>
              コンセプト作成へ
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              ダッシュボードへ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}