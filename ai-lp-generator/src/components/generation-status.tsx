'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Code, 
  AlertTriangle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react'

interface GenerationStatusProps {
  isGenerating: boolean
  isFixing: boolean
  error: string | null
  success: string | null
  generatedCode: string | null
  onRetry?: () => void
  onFix?: () => void
  onDownload?: () => void
  onPreview?: () => void
  isDownloading?: boolean
  downloadError?: string | null
  projectMeta?: {
    conceptId?: string
    archiveSize?: number
    checksum?: string
    version?: number
  }
}

export default function GenerationStatus({
  isGenerating,
  isFixing,
  error,
  success,
  generatedCode,
  onRetry,
  onFix,
  onDownload,
  onPreview,
  isDownloading = false,
  downloadError = null,
  projectMeta
}: GenerationStatusProps) {
  const [showCode, setShowCode] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const getStatusBadge = () => {
    if (isGenerating || isFixing) {
      return (
        <Badge className="bg-blue-500 text-white">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          {isGenerating ? '生成中' : '修正中'}
        </Badge>
      )
    }
    if (error) {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          エラー
        </Badge>
      )
    }
    if (success && generatedCode) {
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          完了
        </Badge>
      )
    }
    return null
  }

  const getProgressSteps = () => {
    const steps = [
      { 
        name: 'PASONAデータ入力', 
        status: generatedCode || isGenerating || error ? 'completed' : 'pending' 
      },
      { 
        name: 'コード生成', 
        status: generatedCode ? 'completed' : isGenerating ? 'in_progress' : error ? 'error' : 'pending' 
      },
      { 
        name: 'エラー修正', 
        status: isFixing ? 'in_progress' : 'pending' 
      }
    ]
    return steps
  }

  return (
    <div className="space-y-4">
      {/* ステータスヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">生成ステータス</h3>
          {getStatusBadge()}
        </div>
        <div className="flex gap-2">
          {generatedCode && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCode(!showCode)}
                aria-expanded={showCode}
                aria-controls="generated-code-display"
                aria-label={showCode ? 'コードを隠す' : 'コードを表示'}
              >
                <Code className="w-4 h-4 mr-1" />
                {showCode ? 'コードを隠す' : 'コードを表示'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyCode}
                aria-label="生成されたコードをクリップボードにコピーする"
              >
                {copySuccess ? 'コピー済み!' : 'コピー'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* プログレスステップ */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            {getProgressSteps().map((step, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2
                    ${step.status === 'completed' ? 'bg-green-500 text-white' : 
                      step.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                      step.status === 'error' ? 'bg-red-500 text-white' :
                      'bg-gray-200 text-gray-400'}
                  `}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : step.status === 'in_progress' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : step.status === 'error' ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600">{step.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-semibold">エラーが発生しました</p>
            <p className="text-sm mt-1">{error}</p>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                再試行
              </Button>
            )}
          </div>
        </Alert>
      )}

      {/* 成功メッセージ */}
      {success && !error && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="ml-2">
            <p className="font-semibold text-green-800">成功</p>
            <p className="text-sm mt-1 text-green-700">{success}</p>
          </div>
        </Alert>
      )}

      {/* ダウンロードエラー */}
      {downloadError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div className="ml-2">
            <p className="font-semibold">ダウンロードエラー</p>
            <p className="text-sm mt-1">{downloadError}</p>
          </div>
        </Alert>
      )}

      {/* コード表示 */}
      {showCode && generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">生成されたコード</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              id="generated-code-display"
              className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto"
              role="region"
              aria-label="生成されたコード"
              tabIndex={0}
            >
              <pre className="text-xs text-gray-100">
                <code>{generatedCode}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      {generatedCode && (
        <div className="flex gap-2 justify-end">
          {onFix && (
            <Button
              variant="outline"
              onClick={onFix}
              disabled={isFixing}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              AIで修正
            </Button>
          )}
          {onPreview && (
            <Button
              variant="outline"
              onClick={onPreview}
            >
              <Eye className="w-4 h-4 mr-1" />
              プレビュー
            </Button>
          )}
          {onDownload && (
            <Button
              onClick={onDownload}
              disabled={isDownloading}
              aria-label={`プロジェクトをダウンロード${projectMeta?.archiveSize ? ` (${formatFileSize(projectMeta.archiveSize)})` : ''}`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ダウンロード中...
                </>
              ) : (
                <div className="flex items-center">
                  <Download className="w-4 h-4 mr-1" />
                  <div className="flex flex-col items-start">
                    <span>ダウンロード</span>
                    {projectMeta?.archiveSize && (
                      <span className="text-xs opacity-75">
                        {formatFileSize(projectMeta.archiveSize)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}