'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getSignupErrorInfo } from '@/lib/error-utils'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const { signUp, signInWithGoogle, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              確認メールを送信しました
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600">
                {email} に確認メールを送信しました。
                メール内のリンクをクリックして、アカウントを有効化してください。
              </p>
              <div className="mt-4">
                <Link href="/login">
                  <Button>ログインページに戻る</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            AI LP Generator に登録
          </CardTitle>
          <CardDescription className="text-center">
            新しいアカウントを作成して、LPプロジェクトを始めましょう
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
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
              <Label htmlFor="password">パスワード（6文字以上）</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            {error && (
              <div className="space-y-3">
                {(() => {
                  const errorInfo = getSignupErrorInfo(error)
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
              {loading ? '登録中...' : 'アカウント作成'}
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
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full"
          >
            Googleで登録
          </Button>
          
          <div className="text-center text-sm">
            すでにアカウントをお持ちですか？{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}