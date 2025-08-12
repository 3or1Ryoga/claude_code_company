# AI商談支援アプリ - Next.js ページ構成設計書

## 1. アーキテクチャ概要

### 1.1 Next.js 15 App Router 構成
```
ai-sales-todo/
├── app/
│   ├── layout.js                    # ルートレイアウト
│   ├── page.js                      # ホームページ（メインアプリ）
│   ├── loading.js                   # ローディングUI
│   ├── error.js                     # エラーハンドリング
│   ├── not-found.js                 # 404ページ
│   ├── globals.css                  # グローバルスタイル
│   │
│   ├── api/                         # API Routes
│   │   ├── auth/
│   │   │   ├── login/route.js       # ログイン
│   │   │   ├── logout/route.js      # ログアウト
│   │   │   └── register/route.js    # ユーザー登録
│   │   ├── chat/route.js            # BANTチャット
│   │   ├── todos/route.js           # ToDo管理
│   │   ├── speech/route.js          # 音声処理
│   │   ├── projects/route.js        # プロジェクト管理
│   │   └── export/route.js          # データエクスポート
│   │
│   ├── auth/                        # 認証関連ページ
│   │   ├── login/
│   │   │   └── page.js              # ログインページ
│   │   └── register/
│   │       └── page.js              # 登録ページ
│   │
│   ├── dashboard/                   # ダッシュボード
│   │   ├── page.js                  # 商談履歴・管理
│   │   └── [projectId]/
│   │       └── page.js              # 個別プロジェクト詳細
│   │
│   ├── settings/                    # 設定ページ
│   │   └── page.js                  # ユーザー設定
│   │
│   └── components/                  # コンポーネント
│       ├── chat/
│       │   └── ChatInterface.jsx    # BANTチャット
│       ├── todo/
│       │   └── TodoList.jsx         # ToDoリスト
│       ├── audio/
│       │   └── AudioController.jsx  # 音声コントロール
│       ├── meeting/
│       │   └── MeetingDashboard.jsx # 商談ダッシュボード
│       ├── common/
│       │   ├── Header.jsx           # 共通ヘッダー
│       │   ├── Navigation.jsx       # ナビゲーション
│       │   └── LoadingSpinner.jsx   # ローディング
│       └── ui/                      # UIコンポーネント
│           ├── Button.jsx
│           ├── Card.jsx
│           ├── Modal.jsx
│           └── ProgressBar.jsx
├── lib/
│   ├── supabase.js                  # Supabase設定
│   ├── auth-context.js              # 認証コンテキスト
│   ├── gemini.js                    # Google Gemini API
│   ├── speechRecognition.js         # 音声認識
│   └── database.js                  # データベース操作
└── middleware.js                    # 認証ミドルウェア
```

## 2. ページ設計詳細

### 2.1 ルートレイアウト (`app/layout.js`)
**目的**: アプリケーション全体の基本レイアウト

```javascript
// app/layout.js
import { Inter, Noto_Sans_JP } from 'next/font/google'
import { AuthProvider } from '../lib/auth-context'
import Header from './components/common/Header'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  variable: '--font-noto-sans-jp'
})

export const metadata = {
  title: 'AI Sales Assistant - 商談成約率向上支援システム',
  description: 'BANT条件ヒアリング → ToDo自動生成 → リアルタイム音声解析',
  keywords: '営業支援,AI,BANT,商談,Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2.2 ホームページ (`app/page.js`)
**目的**: メインアプリケーション（商談支援フロー）

```javascript
// app/page.js
'use client'

import { useState } from 'react'
import { useAuth } from '../lib/auth-context'
import ChatInterface from './components/chat/ChatInterface'
import TodoList from './components/todo/TodoList'
import AudioController from './components/audio/AudioController'
import MeetingDashboard from './components/meeting/MeetingDashboard'
import AuthGuard from './components/common/AuthGuard'

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState('chat') // chat | todo | meeting
  const [bantAnswers, setBantAnswers] = useState({})
  const [todos, setTodos] = useState([])
  const [projectId, setProjectId] = useState(null)
  
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto">
        {/* Progress Steps Component */}
        <ProgressSteps currentStep={currentStep} />
        
        {/* Main Content Area */}
        {currentStep === 'chat' && (
          <ChatInterface 
            onComplete={handleChatComplete}
            onProjectCreate={setProjectId}
          />
        )}
        
        {currentStep === 'todo' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TodoList 
              bantAnswers={bantAnswers}
              projectId={projectId}
              onTodosGenerated={setTodos}
            />
            <div className="space-y-6">
              <BANTSummary answers={bantAnswers} />
              <MeetingStartButton onClick={() => setCurrentStep('meeting')} />
            </div>
          </div>
        )}
        
        {currentStep === 'meeting' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-3">
              <MeetingDashboard todos={todos} />
            </div>
            <div className="xl:col-span-1">
              <AudioController todos={todos} />
            </div>
            <div className="xl:col-span-2">
              <TodoList 
                bantAnswers={bantAnswers}
                projectId={projectId}
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

function handleChatComplete(answers, projectId) {
  setBantAnswers(answers)
  setProjectId(projectId)
  setCurrentStep('todo')
}
```

### 2.3 認証ページ (`app/auth/login/page.js`)
**目的**: ユーザーログイン

```javascript
// app/auth/login/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import LoginForm from '../../components/auth/LoginForm'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading } = useAuth()
  const [error, setError] = useState('')

  const handleLogin = async (email, password) => {
    setError('')
    const result = await signIn(email, password)
    
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            AI Sales Assistant
          </CardTitle>
          <p className="text-gray-600">商談成約率向上支援システム</p>
        </CardHeader>
        <CardContent>
          <LoginForm 
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2.4 ダッシュボードページ (`app/dashboard/page.js`)
**目的**: 商談プロジェクト履歴・管理

```javascript
// app/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { MeetingProjectService } from '../../lib/database'
import ProjectList from '../components/dashboard/ProjectList'
import ProjectStats from '../components/dashboard/ProjectStats'
import AuthGuard from '../components/common/AuthGuard'

export default function DashboardPage() {
  const { user, supabase } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  
  useEffect(() => {
    loadProjects()
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    
    const projectService = new MeetingProjectService(supabase)
    const result = await projectService.getUserProjects()
    
    if (result.data) {
      setProjects(result.data)
      calculateStats(result.data)
    }
    setLoading(false)
  }

  const calculateStats = (projectData) => {
    const total = projectData.length
    const completed = projectData.filter(p => p.status === 'completed').length
    const avgCompletion = total > 0 ? (completed / total) * 100 : 0
    
    setStats({
      total,
      completed,
      inProgress: projectData.filter(p => p.status === 'in_progress').length,
      avgCompletion: Math.round(avgCompletion)
    })
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            商談プロジェクト管理
          </h1>
          <p className="text-gray-600 mt-2">
            過去の商談履歴とパフォーマンス分析
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <ProjectList 
              projects={projects}
              loading={loading}
              onProjectUpdate={loadProjects}
            />
          </div>
          <div>
            <ProjectStats stats={stats} />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
```

## 3. API Routes 設計

### 3.1 BANT チャット API (`app/api/chat/route.js`)
```javascript
// app/api/chat/route.js
import { NextResponse } from 'next/server'
import { generateBANTQuestions } from '../../../lib/gemini'
import { createServerSupabaseClient } from '../../../lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { message, stage, projectId } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AI応答生成
    const aiResponse = await generateBANTResponse(message, stage)
    
    // プロジェクトデータ更新
    if (projectId) {
      await updateProjectData(supabase, projectId, stage, message)
    }
    
    return NextResponse.json({
      response: aiResponse,
      nextStage: getNextStage(stage),
      progress: calculateProgress(stage)
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Chat processing failed' },
      { status: 500 }
    )
  }
}
```

### 3.2 ToDo 管理 API (`app/api/todos/route.js`)
```javascript
// app/api/todos/route.js
import { NextResponse } from 'next/server'
import { generateTodoList } from '../../../lib/gemini'
import { TodoService } from '../../../lib/database'
import { createServerSupabaseClient } from '../../../lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { projectId, bantAnswers } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // AI ToDo生成
    const generatedTodos = await generateTodoList(bantAnswers)
    
    // データベース保存
    const todoService = new TodoService(supabase)
    const result = await todoService.createTodos(projectId, generatedTodos)
    
    return NextResponse.json({
      success: true,
      todos: result.data
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'ToDo generation failed' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const { todoId, completed, detectedSpeech } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerSupabaseClient(cookieStore)
    
    const todoService = new TodoService(supabase)
    const result = await todoService.updateTodoCompletion(
      todoId, 
      completed, 
      detectedSpeech
    )
    
    return NextResponse.json({
      success: true,
      todo: result.data
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'ToDo update failed' },
      { status: 500 }
    )
  }
}
```

## 4. ミドルウェア設計

### 4.1 認証ミドルウェア (`middleware.js`)
```javascript
// middleware.js
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  
  // Supabase認証クライアント作成
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // 認証が必要なパス
  const protectedPaths = ['/dashboard', '/settings', '/api/todos', '/api/projects']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  // 未認証ユーザーのリダイレクト
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 認証済みユーザーがログインページにアクセスした場合
  if (req.nextUrl.pathname.startsWith('/auth') && session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

## 5. コンポーネント設計パターン

### 5.1 共通UIコンポーネント
```javascript
// app/components/ui/Button.jsx
'use client'

import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'

const Button = forwardRef(({ 
  className, 
  variant = 'default',
  size = 'default',
  children, 
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
  }
  
  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-8 px-3 text-sm',
    lg: 'h-12 px-8'
  }

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
```

### 5.2 認証ガードコンポーネント
```javascript
// app/components/common/AuthGuard.jsx
'use client'

import { useAuth } from '../../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return children
}
```

## 6. パフォーマンス最適化

### 6.1 コード分割戦略
```javascript
// 動的インポートによる遅延読み込み
const AudioController = dynamic(
  () => import('./components/audio/AudioController'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false // 音声機能はクライアントサイドのみ
  }
)

const MeetingDashboard = dynamic(
  () => import('./components/meeting/MeetingDashboard'),
  { loading: () => <LoadingSpinner /> }
)
```

### 6.2 画像最適化
```javascript
// next/image を使用した最適化
import Image from 'next/image'

<Image
  src="/logo.svg"
  alt="AI Sales Assistant"
  width={48}
  height={48}
  priority={true}
  className="rounded-lg"
/>
```

## 7. SEO・メタデータ設定

### 7.3 動的メタデータ
```javascript
// app/dashboard/[projectId]/page.js
export async function generateMetadata({ params }) {
  const projectId = params.projectId
  // プロジェクト情報取得
  const project = await getProject(projectId)
  
  return {
    title: `${project.title} - AI Sales Assistant`,
    description: `商談プロジェクト「${project.title}」の詳細と進捗管理`,
  }
}
```

---

**文書作成日**: 2025年1月8日  
**作成者**: Worker1  
**承認者**: Boss1, President  
**バージョン**: 1.0