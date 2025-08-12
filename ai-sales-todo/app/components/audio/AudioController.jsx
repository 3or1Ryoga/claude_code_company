'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Settings, AlertTriangle, Volume2, CheckCircle } from 'lucide-react'
import { SpeechRecognitionManager } from '../../../lib/speechRecognition'
import { calculateSimilarity } from '../../../lib/gemini'

export default function AudioController({
  todos = [],
  onTodoComplete,
  similarityThreshold = 0.7,
  onThresholdChange,
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentMatches, setRecentMatches] = useState([])
  const [volume, setVolume] = useState(1)
  const [language, setLanguage] = useState('ja-JP')
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('') // 30秒間の蓄積テキスト

  const speechManagerRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const processingIntervalRef = useRef(null) // 30秒間隔処理用タイマー
  const transcriptBufferRef = useRef([]) // 音声認識結果バッファ

  // 音声認識マネージャーの初期化
  useEffect(() => {
    // インスタンスを生成
    speechManagerRef.current = new SpeechRecognitionManager();
    
    // 初期化（エラーコールバック付き）
    const isInitialized = speechManagerRef.current.initialize({
      onError: handleSpeechError
    });

    if (!isInitialized) {
      setErrorMessage('このブラウザは音声認識に対応していません');
    }

    // コンポーネントがアンマウントされる際のクリーンアップ処理
    return () => {
      if (speechManagerRef.current && typeof speechManagerRef.current.stopRecording === 'function') {
        speechManagerRef.current.stopRecording();
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, []);

  // 音声認識エラーハンドラー
  const handleSpeechError = (error) => {
    console.error('音声認識エラー:', error);
    setErrorMessage(`音声認識エラー: ${error}`);
    setIsRecording(false);
  };

  // 音声認識結果の受信とバッファリング
  const handleSpeechResult = (transcript) => {
    console.log('音声認識結果:', transcript);
    
    // テキストを正規化
    const normalizedText = normalizeTranscript(transcript);
    
    // バッファに追加
    transcriptBufferRef.current.push(normalizedText);
    
    // UI表示用の現在のテキストを更新
    setCurrentTranscript(prev => prev + normalizedText + ' ');
    
    // 蓄積テキストも更新
    setAccumulatedTranscript(prev => prev + normalizedText + ' ');
  };

  // テキスト正規化処理
  const normalizeTranscript = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim() // 前後の空白削除
      .replace(/\s+/g, ' ') // 連続する空白を単一の空白に
      .replace(/[。、！？]/g, '') // 句読点削除
      .toLowerCase() // 小文字に変換（英語部分用）
      .replace(/[\u3000]/g, ' '); // 全角スペースを半角に
  };

  // ToDo照合用テキスト整形
  const formatTextForMatching = (text) => {
    if (!text) return '';
    
    return text
      .replace(/[ですますでしたました]/g, '') // 敬語削除
      .replace(/[をにはがと]/g, '') // 助詞削除
      .replace(/[、。]/g, '') // 句読点削除
      .replace(/\s+/g, '') // 空白削除
      .trim();
  };

  // 30秒間隔でのToDo照合処理
  const processAccumulatedTranscript = async () => {
    if (!accumulatedTranscript.trim() || isProcessing) return;

    setIsProcessing(true);
    console.log('30秒間隔処理開始:', accumulatedTranscript);

    try {
      const incompleteTodos = todos.filter(todo => !todo.completed);
      
      if (incompleteTodos.length === 0) {
        setIsProcessing(false);
        return;
      }

      // 蓄積されたテキストをToDo照合用に整形
      const formattedTranscript = formatTextForMatching(accumulatedTranscript);
      
      // 各未完了ToDoとの類似度を計算
      for (const todo of incompleteTodos) {
        try {
          const formattedTodo = formatTextForMatching(todo.task);
          const similarity = await calculateSimilarity(formattedTranscript, formattedTodo);
          
          console.log(`ToDo: "${todo.task}" vs 音声: "${formattedTranscript}" - 類似度: ${similarity}`);
          
          if (similarity >= similarityThreshold) {
            // マッチした場合
            const match = {
              todoId: todo.id,
              task: todo.task,
              transcript: accumulatedTranscript,
              similarity,
              timestamp: new Date()
            };
            
            // マッチ履歴を更新
            setRecentMatches(prev => [match, ...prev.slice(0, 4)]);
            
            // ToDo完了をコールバック
            if (onTodoComplete) {
              onTodoComplete(todo.id);
            }
            
            // 成功音を再生
            playSuccessSound();
            
            console.log('ToDo自動完了:', todo.task);
            break; // 一つマッチしたら終了
          }
        } catch (error) {
          console.error('類似度計算エラー:', error);
        }
      }
      
      // 蓄積テキストをクリア（30秒分処理完了）
      setAccumulatedTranscript('');
      transcriptBufferRef.current = [];
      
    } catch (error) {
      console.error('音声処理エラー:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 成功音再生
  const playSuccessSound = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('タスクが完了しました');
      utterance.volume = volume;
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  };

  // 録音開始（30秒タイマー付き）
  const startRecording = async () => {
    if (!speechManagerRef.current) {
      setErrorMessage('音声認識が利用できません');
      return;
    }

    try {
      setErrorMessage('');
      
      // 音声認識開始（結果処理コールバック付き）
      const isStarted = speechManagerRef.current.startRecording(handleSpeechResult);

      if (isStarted) {
        setIsRecording(true);
        setRecordingTime(0);
        setCurrentTranscript(''); // テキスト表示リセット
        setAccumulatedTranscript(''); // 蓄積テキストリセット
        transcriptBufferRef.current = []; // バッファリセット
        
        // 録音時間をカウントアップするタイマー
        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        // 30秒間隔でのToDo照合処理タイマー開始
        processingIntervalRef.current = setInterval(() => {
          processAccumulatedTranscript();
        }, 30000); // 30秒間隔
        
        console.log('音声認識開始 - 30秒間隔処理タイマー設定完了');
      } else {
        setErrorMessage('録音の開始に失敗しました。');
      }
      
    } catch (error) {
      console.error('録音開始エラー:', error);
      setErrorMessage('マイクへのアクセス権限が拒否されたか、他の問題が発生しました。');
    }
  };

  // 録音停止
  const stopRecording = async () => {
    if (speechManagerRef.current) {
      speechManagerRef.current.stopRecording();
    }
    setIsRecording(false);
    
    // タイマー停止
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
    }
    
    // 残りの蓄積テキストがあれば最終処理
    if (accumulatedTranscript.trim()) {
      console.log('録音停止時の最終処理実行');
      await processAccumulatedTranscript();
    }
    
    console.log('音声認識停止 - 全タイマー停止完了');
  };

  // 時間をフォーマットするヘルパー関数
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 完了率計算
  const getCompletionRate = () => {
    if (todos.length === 0) return 0;
    const completed = todos.filter(todo => todo.completed).length;
    return Math.round((completed / todos.length) * 100);
  };

  const completionRate = getCompletionRate();

  // 以下、コンポーネントのUI部分
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">音声コントローラー</h3>
              <p className="text-sm text-gray-600">リアルタイム音声解析（30秒間隔）</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                類似度の閾値: {similarityThreshold}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={similarityThreshold}
                onChange={(e) => onThresholdChange && onThresholdChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低感度</span>
                <span>高感度</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音声フィードバック音量: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                音声認識言語
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ja-JP">日本語</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Control */}
      <div className="p-6">
        {/* Recording Status */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl border-2 ${
            isRecording 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {isRecording ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold">録音中</span>
                <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <span className="font-medium">待機中</span>
            )}
          </div>
        </div>

        {/* Record Button */}
        <div className="text-center mb-6">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 scale-110'
                : 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            {isRecording ? 'クリックで停止' : 'クリックで開始'}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">完了率</span>
            <span className="text-sm font-bold text-green-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Current Transcript */}
        {currentTranscript && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">現在の音声テキスト</h4>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">最近のマッチ履歴</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentMatches.map((match, index) => (
                <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      {match.task}
                    </span>
                    <span className="text-xs text-green-600">
                      {Math.round(match.similarity * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1 truncate">
                    「{match.transcript.substring(0, 50)}...」
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {match.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm">音声を解析中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}