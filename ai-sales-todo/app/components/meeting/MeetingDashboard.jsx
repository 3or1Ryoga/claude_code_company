'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Users,
  Mic,
  MicOff,
  Activity,
  Calendar
} from 'lucide-react'

export default function MeetingDashboard({ 
  todos = [], 
  completedTodos = [], 
  isRecording = false, 
  recordingTime = 0 
}) {
  const [meetingStartTime, setMeetingStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [realTimeStats, setRealTimeStats] = useState({
    completionVelocity: 0,
    averageCompletionTime: 0,
    estimatedFinishTime: null
  })

  useEffect(() => {
    if (isRecording && !meetingStartTime) {
      setMeetingStartTime(new Date())
    }
  }, [isRecording, meetingStartTime])

  useEffect(() => {
    if (meetingStartTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - meetingStartTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [meetingStartTime])

  useEffect(() => {
    calculateRealTimeStats()
  }, [completedTodos, elapsedTime])

  const calculateRealTimeStats = () => {
    if (completedTodos.length === 0 || elapsedTime === 0) return

    const completionVelocity = (completedTodos.length / elapsedTime) * 3600 // タスク/時間
    const averageCompletionTime = elapsedTime / completedTodos.length // 秒/タスク
    const remainingTasks = todos.length - completedTodos.length
    const estimatedRemainingTime = remainingTasks * averageCompletionTime
    const estimatedFinishTime = new Date(Date.now() + estimatedRemainingTime * 1000)

    setRealTimeStats({
      completionVelocity,
      averageCompletionTime,
      estimatedFinishTime
    })
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompletionRate = () => {
    if (todos.length === 0) return 0
    return Math.round((completedTodos.length / todos.length) * 100)
  }

  const getCategoryProgress = () => {
    const categories = ['アイスブレイク', 'ヒアリング', '提案', 'クロージング']
    return categories.map(category => {
      const categoryTodos = todos.filter(todo => todo.category === category)
      const categoryCompleted = completedTodos.filter(todo => todo.category === category)
      return {
        name: category,
        total: categoryTodos.length,
        completed: categoryCompleted.length,
        percentage: categoryTodos.length > 0 ? Math.round((categoryCompleted.length / categoryTodos.length) * 100) : 0
      }
    })
  }

  const getSuccessMetrics = () => {
    const totalTasks = todos.length
    const completedCount = completedTodos.length
    const completionRate = getCompletionRate()
    
    let status = 'danger'
    let statusText = '要改善'
    
    if (completionRate >= 80) {
      status = 'success'
      statusText = '優秀'
    } else if (completionRate >= 60) {
      status = 'warning'
      statusText = '良好'
    }

    return { totalTasks, completedCount, completionRate, status, statusText }
  }

  const completionRate = getCompletionRate()
  const categoryProgress = getCategoryProgress()
  const successMetrics = getSuccessMetrics()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stats Card */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">商談ダッシュボード</h3>
                <p className="text-sm text-gray-600">リアルタイム進捗モニタリング</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              successMetrics.status === 'success' ? 'bg-green-100 text-green-800' :
              successMetrics.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {successMetrics.statusText}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedTodos.length}</div>
              <div className="text-sm text-gray-600">完了タスク</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{todos.length - completedTodos.length}</div>
              <div className="text-sm text-gray-600">残りタスク</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completionRate}%</div>
              <div className="text-sm text-gray-600">完了率</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatTime(elapsedTime)}</div>
              <div className="text-sm text-gray-600">経過時間</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">全体進捗</span>
              <span className="text-sm text-gray-500">{completedTodos.length}/{todos.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>

          {/* Category Progress */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryProgress.map((category, index) => (
              <div key={category.name} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">{category.name}</span>
                  <span className="text-xs text-gray-500">{category.completed}/{category.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">{category.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        {/* Recording Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              録音ステータス
            </h4>
          </div>
          <div className="p-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              isRecording ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
            }`}>
              {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <Mic className="w-5 h-5" />
                  <div>
                    <div className="font-medium">録音中</div>
                    <div className="text-sm">{formatTime(recordingTime)}</div>
                  </div>
                </>
              ) : (
                <>
                  <MicOff className="w-5 h-5" />
                  <div>
                    <div className="font-medium">待機中</div>
                    <div className="text-sm">録音を開始してください</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              パフォーマンス指標
            </h4>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">完了速度</span>
              <span className="font-medium text-purple-600">
                {realTimeStats.completionVelocity > 0 
                  ? `${realTimeStats.completionVelocity.toFixed(1)}/h`
                  : '測定中...'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">平均完了時間</span>
              <span className="font-medium text-blue-600">
                {realTimeStats.averageCompletionTime > 0 
                  ? formatTime(Math.round(realTimeStats.averageCompletionTime))
                  : '測定中...'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">予想終了時刻</span>
              <span className="font-medium text-green-600">
                {realTimeStats.estimatedFinishTime 
                  ? realTimeStats.estimatedFinishTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '計算中...'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              クイックアクション
            </h4>
          </div>
          <div className="p-4 space-y-2">
            <button className="w-full px-4 py-2 text-left text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
              進捗レポートをエクスポート
            </button>
            <button className="w-full px-4 py-2 text-left text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors">
              商談メモを追加
            </button>
            <button className="w-full px-4 py-2 text-left text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
              次回アクションを設定
            </button>
          </div>
        </div>

        {/* Meeting Info */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              商談情報
            </h4>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">開始時刻</span>
              <span className="font-medium">
                {meetingStartTime 
                  ? meetingStartTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })
                  : '未開始'
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">経過時間</span>
              <span className="font-medium">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">ステータス</span>
              <span className={`font-medium ${
                completionRate >= 80 ? 'text-green-600' :
                completionRate >= 50 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {completionRate >= 80 ? '順調' :
                 completionRate >= 50 ? '進行中' :
                 '要注意'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}