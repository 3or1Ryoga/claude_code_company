'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Target, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'

export default function MeetingDashboard({ todos, completedTodos, isRecording, recordingTime }) {
  const [meetingPhase, setMeetingPhase] = useState('preparation') // preparation, active, review
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    completedHighPriority: 0,
    completedMediumPriority: 0,
    completedLowPriority: 0,
    totalCompleted: 0
  })

  useEffect(() => {
    if (todos.length > 0) {
      const completed = todos.filter(todo => todo.completed)
      const rate = (completed.length / todos.length) * 100
      setCompletionRate(rate)
      
      setPerformanceMetrics({
        completedHighPriority: completed.filter(todo => todo.priority === 'high').length,
        completedMediumPriority: completed.filter(todo => todo.priority === 'medium').length,
        completedLowPriority: completed.filter(todo => todo.priority === 'low').length,
        totalCompleted: completed.length
      })
    }
  }, [todos])

  useEffect(() => {
    let interval
    if (meetingPhase === 'active') {
      interval = setInterval(() => {
        setMeetingDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [meetingPhase])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'preparation': return 'bg-blue-500'
      case 'active': return 'bg-green-500'
      case 'review': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getPhaseLabel = (phase) => {
    switch (phase) {
      case 'preparation': return '準備中'
      case 'active': return '商談中'
      case 'review': return 'レビュー'
      default: return '未開始'
    }
  }

  const getCompletionStatusColor = (rate) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    if (rate >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const startMeeting = () => {
    setMeetingPhase('active')
    setMeetingDuration(0)
  }

  const endMeeting = () => {
    setMeetingPhase('review')
  }

  const resetMeeting = () => {
    setMeetingPhase('preparation')
    setMeetingDuration(0)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">商談進行ダッシュボード</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPhaseColor(meetingPhase)}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {getPhaseLabel(meetingPhase)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  {meetingPhase === 'active' ? formatTime(meetingDuration) : '00:00'}
                </div>
              </div>
            </div>
          </div>

          {/* Phase Control Buttons */}
          <div className="flex gap-2">
            {meetingPhase === 'preparation' && (
              <button
                onClick={startMeeting}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                商談開始
              </button>
            )}
            {meetingPhase === 'active' && (
              <button
                onClick={endMeeting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                商談終了
              </button>
            )}
            {meetingPhase === 'review' && (
              <button
                onClick={resetMeeting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                新しい商談
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">総ToDo数</p>
                <p className="text-2xl font-bold text-blue-900">{todos.length}</p>
              </div>
              <div className="p-2 bg-blue-500 rounded-full">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">完了数</p>
                <p className="text-2xl font-bold text-green-900">{performanceMetrics.totalCompleted}</p>
              </div>
              <div className="p-2 bg-green-500 rounded-full">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">完了率</p>
                <p className={`text-2xl font-bold ${getCompletionStatusColor(completionRate)}`}>
                  {completionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-full">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">商談時間</p>
                <p className="text-2xl font-bold text-orange-900">
                  {meetingPhase === 'active' ? formatTime(meetingDuration) : 
                   meetingPhase === 'review' ? formatTime(meetingDuration) : '00:00'}
                </p>
              </div>
              <div className="p-2 bg-orange-500 rounded-full">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">全体の進捗状況</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>完了状況</span>
                <span>{performanceMetrics.totalCompleted}/{todos.length} 項目</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    completionRate >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    completionRate >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    completionRate >= 40 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                    'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                高優先度
              </h4>
              <div className="text-2xl font-bold text-red-900">
                {performanceMetrics.completedHighPriority}/{todos.filter(t => t.priority === 'high').length}
              </div>
              <p className="text-sm text-red-600">完了済み</p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                中優先度
              </h4>
              <div className="text-2xl font-bold text-yellow-900">
                {performanceMetrics.completedMediumPriority}/{todos.filter(t => t.priority === 'medium').length}
              </div>
              <p className="text-sm text-yellow-600">完了済み</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                低優先度
              </h4>
              <div className="text-2xl font-bold text-green-900">
                {performanceMetrics.completedLowPriority}/{todos.filter(t => t.priority === 'low').length}
              </div>
              <p className="text-sm text-green-600">完了済み</p>
            </div>
          </div>

          {/* Meeting Phase Specific Content */}
          {meetingPhase === 'preparation' && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">商談準備チェックリスト</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>BANT条件ヒアリング完了</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>商談ToDoリスト生成済み</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-sm" />
                  <span>マイク音声テスト（商談開始前に確認推奨）</span>
                </div>
              </div>
            </div>
          )}

          {meetingPhase === 'active' && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">商談進行中</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">録音状態:</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-sm">{isRecording ? '録音中' : '停止中'}</span>
                  </div>
                </div>
                <div className="text-sm text-green-700">
                  💡 ヒント: 話した内容がToDoと一致すると自動的に完了マークがつきます
                </div>
              </div>
            </div>
          )}

          {meetingPhase === 'review' && (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">商談結果サマリー</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">パフォーマンス</h4>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• 商談時間: {formatTime(meetingDuration)}</li>
                    <li>• 完了率: {completionRate.toFixed(1)}%</li>
                    <li>• 高優先度完了: {performanceMetrics.completedHighPriority}件</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-800 mb-2">次回への改善点</h4>
                  <ul className="space-y-1 text-sm text-purple-700">
                    {completionRate < 50 && <li>• より詳細な事前準備を検討</li>}
                    {performanceMetrics.completedHighPriority < todos.filter(t => t.priority === 'high').length && 
                     <li>• 高優先度項目への集中を強化</li>}
                    <li>• 顧客のニーズをより深く理解する</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}