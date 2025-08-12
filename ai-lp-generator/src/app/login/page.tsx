'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getAuthErrorInfo } from '@/lib/error-utils'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const { signIn, signInWithGoogle, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            AI LP Generator にログイン
          </CardTitle>
          <CardDescription className="text-center">
            アカウントにアクセスして、LPプロジェクトを管理しましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="space-y-3">
                {(() => {
                  const errorInfo = getAuthErrorInfo(error)
                  return (
                    <Alert variant={errorInfo.variant}>
                      <AlertTitle>{errorInfo.title}</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>{errorInfo.message}</p>
                        {errorInfo.actionText && errorInfo.actionHref && (
                          <Link href={errorInfo.actionHref}>
                            <Button variant="outline" size="sm" className="mt-2">
                              {errorInfo.actionText}
                            </Button>
                          </Link>
                        )}
                        {errorInfo.troubleshoot && errorInfo.troubleshoot.length > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                              className="text-xs"
                            >
                              {showTroubleshooting ? '解決方法を隠す' : '解決方法を表示'}
                            </Button>
                            {showTroubleshooting && (
                              <div className="mt-2 p-3 bg-muted rounded-lg">
                                <p className="text-xs font-medium mb-2">解決方法：</p>
                                <ul className="text-xs space-y-1">
                                  {errorInfo.troubleshoot.map((tip, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="text-muted-foreground mr-2">•</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )
                })()}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">または</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full"
          >
            Googleでログイン
          </Button>
          
          <div className="text-center text-sm">
            アカウントをお持ちでないですか？{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              サインアップ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}