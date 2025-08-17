'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Plus, 
  X, 
  RefreshCw,
  FileWarning,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ErrorHandlerProps {
  errors: string[]
  onAddError: (error: string) => void
  onRemoveError: (index: number) => void
  onFixErrors: () => void
  isFixing: boolean
  fixSuccess?: boolean
}

export default function ErrorHandler({
  errors,
  onAddError,
  onRemoveError,
  onFixErrors,
  isFixing,
  fixSuccess
}: ErrorHandlerProps) {
  const [newError, setNewError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const commonErrors = [
    { 
      type: 'TypeScript', 
      message: 'TypeScriptの型エラーを修正してください',
      icon: <FileWarning className="w-4 h-4" />
    },
    { 
      type: 'Import', 
      message: 'インポート文が不足しています',
      icon: <AlertCircle className="w-4 h-4" />
    },
    { 
      type: 'Syntax', 
      message: '構文エラーがあります',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    { 
      type: 'Style', 
      message: 'スタイリングの問題を修正してください',
      icon: <AlertCircle className="w-4 h-4" />
    },
    { 
      type: 'API', 
      message: 'API接続エラーまたはレスポンス処理の問題',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    { 
      type: 'Auth', 
      message: '認証エラーまたはセッション管理の問題',
      icon: <FileWarning className="w-4 h-4" />
    }
  ]

  const handleAddError = () => {
    if (newError.trim()) {
      onAddError(newError.trim())
      setNewError('')
    }
  }

  const handleQuickAdd = (message: string) => {
    onAddError(message)
    setShowSuggestions(false)
  }

  const getErrorSeverity = (error: string) => {
    if (error.toLowerCase().includes('critical') || error.toLowerCase().includes('fatal') || 
        error.toLowerCase().includes('認証エラー') || error.toLowerCase().includes('auth session missing')) {
      return 'critical'
    }
    if (error.toLowerCase().includes('warning') || error.toLowerCase().includes('注意') ||
        error.toLowerCase().includes('timeout') || error.toLowerCase().includes('タイムアウト')) {
      return 'warning'
    }
    return 'normal'
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">重大</Badge>
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">警告</Badge>
      default:
        return <Badge variant="secondary">通常</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            エラー修正管理
          </CardTitle>
          {fixSuccess && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              修正完了
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          検出されたエラーや修正が必要な項目を管理します
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* エラーリスト */}
        {errors.length > 0 ? (
          <div className="space-y-2">
            <Label>登録済みエラー ({errors.length}件)</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {errors.map((error, index) => {
                const severity = getErrorSeverity(error)
                return (
                  <div 
                    key={index} 
                    className={`
                      flex items-start gap-2 p-3 rounded-lg border
                      ${severity === 'critical' ? 'bg-red-50 border-red-200' :
                        severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(severity)}
                        <span className="text-xs text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-sm">{error}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveError(index)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">
              まだエラーが登録されていません。エラーを追加してAI修正を実行してください。
            </p>
          </Alert>
        )}

        {/* エラー追加フォーム */}
        <div className="space-y-2">
          <Label htmlFor="new-error">新しいエラーを追加</Label>
          <div className="flex gap-2">
            <Input
              id="new-error"
              value={newError}
              onChange={(e) => setNewError(e.target.value)}
              placeholder="エラーメッセージや修正内容を入力..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddError()
                }
              }}
            />
            <Button
              onClick={handleAddError}
              disabled={!newError.trim()}
            >
              <Plus className="w-4 h-4 mr-1" />
              追加
            </Button>
          </div>
        </div>

        {/* クイック追加サジェスト */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>よくあるエラー</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? '隠す' : '表示'}
            </Button>
          </div>
          
          {showSuggestions && (
            <div className="grid grid-cols-2 gap-2">
              {commonErrors.map((error, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(error.message)}
                  className="justify-start"
                >
                  {error.icon}
                  <span className="ml-2 text-xs">{error.type}</span>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 修正実行ボタン */}
        {errors.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={onFixErrors}
              disabled={isFixing || errors.length === 0}
              className="w-full"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  AI修正を実行中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  AIで{errors.length}件のエラーを修正
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              AIが自動的にコードを分析し、エラーを修正します
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}