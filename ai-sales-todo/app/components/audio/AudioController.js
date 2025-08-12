'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, Square, Volume2, Settings, AlertTriangle } from 'lucide-react'

export default function AudioController({ todos, onTodoComplete, similarityThreshold, onThresholdChange }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [transcription, setTranscription] = useState('')
  const [recentMatches, setRecentMatches] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const mediaRecorder = useRef(null)
  const audioContext = useRef(null)
  const analyzer = useRef(null)
  const dataArray = useRef(null)
  const animationFrame = useRef(null)
  const recordingTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current)
      }
      if (audioContext.current) {
        audioContext.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Audio Context for visualization
      audioContext.current = new AudioContext()
      const source = audioContext.current.createMediaStreamSource(stream)
      analyzer.current = audioContext.current.createAnalyser()
      analyzer.current.fftSize = 256
      
      source.connect(analyzer.current)
      dataArray.current = new Uint8Array(analyzer.current.frequencyBinCount)
      
      // MediaRecorder for recording
      mediaRecorder.current = new MediaRecorder(stream)
      const audioChunks = []
      
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        await processAudio(audioBlob)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        if (audioContext.current) {
          audioContext.current.close()
        }
      }
      
      mediaRecorder.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Start audio visualization
      visualizeAudio()
      
    } catch (error) {
      console.error('録音開始エラー:', error)
      alert('マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop()
    }
    setIsRecording(false)
    setAudioLevel(0)
    
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current)
    }
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current)
    }
  }

  const visualizeAudio = () => {
    if (!analyzer.current || !dataArray.current) return
    
    analyzer.current.getByteFrequencyData(dataArray.current)
    
    // Calculate average audio level
    const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length
    setAudioLevel(Math.min(100, (average / 255) * 100))
    
    if (isRecording) {
      animationFrame.current = requestAnimationFrame(visualizeAudio)
    }
  }

  const processAudio = async (audioBlob) => {
    setIsProcessing(true)
    setTranscription('')
    
    try {
      // Web Speech API または Google Gemini APIによる実際の音声認識処理
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('duration', recordingTime + 's')
      
      const response = await fetch('/api/voice', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`音声処理API エラー: ${response.status}`)
      }
      
      const result = await response.json()
      const transcribedText = result.transcription
      
      setTranscription(transcribedText)
      console.log('[AudioController] 音声認識結果:', transcribedText)
      
      // 高精度な類似度計算を使用してToDo項目とのマッチングを実行
      await checkTodoMatches(transcribedText)
      setIsProcessing(false)
      
    } catch (error) {
      console.error('音声処理エラー:', error)
      setTranscription('音声処理中にエラーが発生しました')
      setIsProcessing(false)
    }
  }

  const checkTodoMatches = async (text) => {
    if (!text || !todos || todos.length === 0) {
      return
    }
    
    const incompleteTodos = todos.filter(todo => !todo.completed)
    if (incompleteTodos.length === 0) {
      console.log('[AudioController] 未完了のToDoがありません')
      return
    }
    
    console.log(`[AudioController] リアルタイムToDo照合開始: "${text}"`)
    
    try {
      // リアルタイム更新システムを使用
      const { processVoiceCompletion } = await import('../../../lib/realtimeUpdater')
      
      await processVoiceCompletion(
        text,
        incompleteTodos,
        similarityThreshold,
        (todoId, result) => {
          // 完了コールバック処理
          console.log(`[AudioController] ToDo #${todoId} がリアルタイム更新により完了しました`)
          
          // UIコールバック
          if (onTodoComplete) {
            onTodoComplete(todoId)
          }
          
          // マッチ履歴更新
          const matchData = {
            todo: incompleteTodos.find(t => t.id === todoId),
            similarity: result.apiResult?.metadata?.similarity || 0,
            matchedAt: new Date(),
            transcribedText: text,
            method: 'realtime_voice_completion'
          }
          
          setRecentMatches(prev => [matchData, ...prev.slice(0, 4)])
        }
      )
      
    } catch (error) {
      console.error('[AudioController] リアルタイム照合処理エラー:', error)
      
      // フォールバック: 従来の処理
      await fallbackTodoMatching(text, incompleteTodos)
    }
  }
  
  // フォールバック用の従来処理
  const fallbackTodoMatching = async (text, incompleteTodos) => {
    console.log('[AudioController] フォールバック照合処理実行')
    
    try {
      // 高精度な類似度計算（Google Gemini API使用）
      const matchPromises = incompleteTodos.map(async (todo) => {
        try {
          // Google Gemini APIを使用した意味的類似度計算
          const { calculateSimilarity } = await import('../../../lib/gemini')
          const similarity = await calculateSimilarity(todo.text, text)
          
          return {
            todo,
            similarity,
            matched: similarity >= similarityThreshold
          }
        } catch (error) {
          console.error(`ToDo #${todo.id} の類似度計算エラー:`, error)
          // フォールバック: キーワードベースの簡易計算
          const fallbackSimilarity = calculateFallbackSimilarity(todo.text, text)
          return {
            todo,
            similarity: fallbackSimilarity,
            matched: fallbackSimilarity >= similarityThreshold,
            fallback: true
          }
        }
      })
      
      const results = await Promise.all(matchPromises)
      const matches = results.filter(result => result.matched)
      
      if (matches.length > 0) {
        console.log(`[AudioController] ${matches.length}個のマッチを発見（フォールバック処理）`)
        
        // 類似度順にソート
        matches.sort((a, b) => b.similarity - a.similarity)
        
        // マッチしたToDo項目を自動完了
        for (const match of matches) {
          console.log(`  - ToDo #${match.todo.id}: "${match.todo.text}" (類似度: ${(match.similarity * 100).toFixed(1)}%${match.fallback ? ' - fallback' : ''})`)
          
          // API経由でToDo完了処理
          await updateTodoCompletion(match.todo.id, text, match.similarity)
          
          // UIコールバック
          if (onTodoComplete) {
            onTodoComplete(match.todo.id)
          }
        }
        
        // 最近のマッチ履歴を更新
        const matchHistory = matches.map(match => ({
          todo: match.todo,
          similarity: match.similarity,
          matchedAt: new Date(),
          transcribedText: text,
          fallback: match.fallback || false,
          method: 'fallback_matching'
        }))
        
        setRecentMatches(prev => [...matchHistory, ...prev.slice(0, 4)])
      } else {
        console.log('[AudioController] マッチするToDoが見つかりませんでした（フォールバック処理）')
      }
      
    } catch (error) {
      console.error('[AudioController] フォールバック照合処理エラー:', error)
    }
  }
  
  // フォールバック用の簡易類似度計算
  const calculateFallbackSimilarity = (todoText, transcribedText) => {
    if (!todoText || !transcribedText) return 0
    
    const todoLower = todoText.toLowerCase()
    const transcribedLower = transcribedText.toLowerCase()
    
    // 完全一致チェック
    if (transcribedLower.includes(todoLower) || todoLower.includes(transcribedLower)) {
      return 0.9
    }
    
    // キーワードマッチング
    const todoWords = todoLower.split(/[\s、。]+/).filter(word => word.length > 1)
    const transcribedWords = transcribedLower.split(/[\s、。]+/).filter(word => word.length > 1)
    
    let matchCount = 0
    todoWords.forEach(todoWord => {
      if (transcribedWords.some(transWord => 
        transWord.includes(todoWord) || todoWord.includes(transWord)
      )) {
        matchCount++
      }
    })
    
    return todoWords.length > 0 ? Math.min(1, matchCount / todoWords.length) : 0
  }
  
  // API経由でToDo完了処理
  const updateTodoCompletion = async (todoId, transcribedText, similarity) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          todoId: todoId,
          completed: true,
          completedBy: 'voice_recognition',
          transcribedText: transcribedText,
          similarity: similarity,
          completedAt: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error(`ToDo完了API エラー: ${response.status}`)
      }
      
      const result = await response.json()
      console.log(`[AudioController] ToDo #${todoId} 完了処理成功:`, result)
      return result
      
    } catch (error) {
      console.error(`[AudioController] ToDo #${todoId} 完了処理エラー:`, error)
      throw error
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Volume2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">音声処理コントロール</h3>
              <p className="text-sm text-gray-600">
                商談中の音声をリアルタイム解析
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                類似度判定の閾値: {(similarityThreshold * 100).toFixed(0)}%
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">厳格</span>
                <input
                  type="range"
                  min="0.3"
                  max="0.9"
                  step="0.1"
                  value={similarityThreshold}
                  onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-xs text-gray-500">緩い</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                値が小さいほど、より厳密にマッチングします
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="p-6 space-y-6">
        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
            
            {/* Audio Level Indicator */}
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-red-300"
                style={{
                  transform: `scale(${1 + audioLevel / 200})`
                }}
              />
            )}
          </div>

          <div className="text-center">
            {isRecording ? (
              <div>
                <div className="text-lg font-semibold text-red-600">
                  録音中... {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-gray-500">
                  クリックで停止
                </div>
              </div>
            ) : isProcessing ? (
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  音声処理中...
                </div>
                <div className="text-sm text-gray-500">
                  文字起こしとToDo判定を実行中
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-gray-700">
                  録音開始
                </div>
                <div className="text-sm text-gray-500">
                  クリックで録音を開始
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Level Visualization */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>音声レベル</span>
              <span>{audioLevel.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-3 rounded-full transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        )}

        {/* Recent Transcription */}
        {transcription && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">最新の文字起こし:</h4>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-800">{String(transcription)}</p>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-green-500" />
              最近完了したToDo:
            </h4>
            <div className="space-y-2">
              {recentMatches.slice(0, 3).map((match, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {String(match.todo.text)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600">
                          類似度: {(match.similarity * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {match.matchedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <p>🎤 30秒間隔で自動的に音声を処理します</p>
          <p>🤖 AIがToDo項目との類似度を自動判定します</p>
          <p>⚙️ 設定ボタンで判定感度を調整できます</p>
        </div>
      </div>
    </div>
  )
}