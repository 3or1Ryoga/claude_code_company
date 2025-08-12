'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, MessageSquare, Lightbulb } from 'lucide-react'
import { generateBANTQuestions } from '../../../lib/gemini'

export default function ChatInterface({ onComplete }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState('budget') // budget, authority, need, timeline
  const [bantAnswers, setBantAnswers] = useState({})
  const messagesEndRef = useRef(null)

  const stepLabels = {
    budget: { title: '予算 (Budget)', icon: '💰', description: 'ご予算についてお聞かせください' },
    authority: { title: '決裁権 (Authority)', icon: '👔', description: '決裁権者・意思決定プロセスについて教えてください' },
    need: { title: 'ニーズ (Need)', icon: '🎯', description: '課題・要求事項についてお聞かせください' },
    timeline: { title: '導入時期 (Timeline)', icon: '📅', description: '導入予定時期についてお聞かせください' }
  }

  const stepOrder = ['budget', 'authority', 'need', 'timeline']

  useEffect(() => {
    // 初期メッセージを表示
    const initialMessage = {
      id: Date.now(),
      text: "こんにちは！商談準備のためのBANT条件についてお聞きします。まず、ご予算についてお聞かせください。",
      sender: 'ai',
      timestamp: new Date()
    }
    setMessages([initialMessage])
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    setLoading(true)

    try {
      // 現在のステップの答えを保存
      const newAnswers = { ...bantAnswers, [currentStep]: currentInput }
      setBantAnswers(newAnswers)

      // 次のステップを決定
      const currentIndex = stepOrder.indexOf(currentStep)
      const nextStep = currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null

      let aiResponse = ''
      
      if (nextStep) {
        // 次の質問を生成
        const questions = await generateBANTQuestions(nextStep, newAnswers)
        aiResponse = questions[0] || stepLabels[nextStep].description
        setCurrentStep(nextStep)
      } else {
        // 全て完了
        aiResponse = "BANT条件の聞き取りが完了しました。これらの情報を基に商談用のToDoリストを生成いたします。"
        
        // 少し遅延してからonCompleteを呼ぶ
        setTimeout(() => {
          onComplete(newAnswers)
        }, 1500)
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('BANT質問生成エラー:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: "申し訳ございません。エラーが発生しました。もう一度お試しください。",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getCurrentStepInfo = () => stepLabels[currentStep] || null

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">BANT条件ヒアリング</h3>
            <p className="text-sm text-gray-600">AIがお客様の状況をお聞きします</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {stepOrder.map((step, index) => {
            const isCompleted = bantAnswers[step]
            const isCurrent = step === currentStep
            const stepInfo = stepLabels[step]
            
            return (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isCurrent ? 'bg-blue-500 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isCompleted ? 'text-green-600' :
                  isCurrent ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {stepInfo.title}
                </span>
                {index < stepOrder.length - 1 && (
                  <div className={`mx-4 w-8 h-0.5 ${
                    isCompleted ? 'bg-green-300' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Step Info */}
      {getCurrentStepInfo() && (
        <div className="p-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCurrentStepInfo().icon}</span>
            <span className="font-medium text-blue-800">{getCurrentStepInfo().title}</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">{getCurrentStepInfo().description}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-500 text-white ml-3' 
                    : 'bg-gray-100 text-gray-600 mr-3'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-row">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 mr-3">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力してください..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="2"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            <span>Enter で送信、Shift + Enter で改行</span>
          </div>
          <span>
            {Object.keys(bantAnswers).length} / {stepOrder.length} 完了
          </span>
        </div>
      </div>
    </div>
  )
}