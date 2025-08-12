'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, User, Bot } from 'lucide-react'

// BANT条件に基づく質問テンプレート
const BANT_QUESTIONS = [
  {
    id: 'budget',
    category: 'Budget (予算)',
    question: '今回のプロジェクトまたは課題解決にかけられる予算の規模はどの程度でしょうか？',
    placeholder: '例：年間100万円程度、月額5万円以下、予算は未定だが効果次第で検討...'
  },
  {
    id: 'authority',
    category: 'Authority (決裁権)',
    question: '購入や導入の最終決定権をお持ちの方はどなたでしょうか？',
    placeholder: '例：私が決定権者、部長の承認が必要、役員会での決定が必要...'
  },
  {
    id: 'need',
    category: 'Need (ニーズ)',
    question: '現在お困りの課題や解決したい問題について詳しく教えてください。',
    placeholder: '例：営業効率が悪い、顧客管理ができていない、売上が伸び悩んでいる...'
  },
  {
    id: 'timeline',
    category: 'Timeline (導入時期)',
    question: 'いつ頃までに解決策を導入したいとお考えでしょうか？',
    placeholder: '例：来月までに、今四半期中に、来年度から、時期は柔軟...'
  }
]

export default function ChatInterface({ onComplete }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'こんにちは！商談の準備をお手伝いします。BANT条件に基づいて、お客様について教えてください。',
      timestamp: new Date()
    }
  ])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // 最初の質問を自動表示
    if (currentQuestionIndex === 0 && messages.length === 1) {
      setTimeout(() => {
        askNextQuestion()
      }, 1000)
    }
  }, [])

  const askNextQuestion = () => {
    if (currentQuestionIndex < BANT_QUESTIONS.length) {
      const question = BANT_QUESTIONS[currentQuestionIndex]
      const newMessage = {
        id: messages.length + 1,
        type: 'bot',
        content: `**${question.category}**\n\n${question.question}`,
        timestamp: new Date(),
        questionId: question.id
      }
      setMessages(prev => [...prev, newMessage])
    } else {
      // 全質問完了
      completeChat()
    }
  }

  const completeChat = () => {
    const finalMessage = {
      id: messages.length + 1,
      type: 'bot',
      content: 'ありがとうございました！お答えいただいた情報を基に、商談で実施すべきToDoリストを生成します。',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, finalMessage])
    
    setTimeout(() => {
      onComplete(answers)
    }, 2000)
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    setIsLoading(true)
    
    // ユーザーメッセージを追加
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: userInput,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    // 回答を保存
    const currentQuestion = BANT_QUESTIONS[currentQuestionIndex]
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: userInput
    }))

    setUserInput('')
    
    setTimeout(() => {
      setIsLoading(false)
      setCurrentQuestionIndex(prev => prev + 1)
      askNextQuestion()
    }, 1500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getCurrentPlaceholder = () => {
    if (currentQuestionIndex < BANT_QUESTIONS.length) {
      return BANT_QUESTIONS[currentQuestionIndex].placeholder
    }
    return '入力してください...'
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <div className="p-2 bg-blue-100 rounded-full">
          <MessageCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">商談準備AI</h3>
          <p className="text-sm text-gray-600">
            BANT条件ヒアリング ({currentQuestionIndex}/{BANT_QUESTIONS.length})
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${(currentQuestionIndex / BANT_QUESTIONS.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            )}
            
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-lg'
                  : 'bg-gray-100 text-gray-900 rounded-bl-lg'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.content.includes('**') ? (
                  message.content.split('\n').map((line, index) => (
                    <div key={index}>
                      {line.startsWith('**') && line.endsWith('**') ? (
                        <div className="font-bold text-blue-600 mb-2">
                          {line.replace(/\*\*/g, '')}
                        </div>
                      ) : (
                        <div>{line}</div>
                      )}
                    </div>
                  ))
                ) : (
                  message.content
                )}
              </div>
              <div className={`text-xs mt-2 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {currentQuestionIndex <= BANT_QUESTIONS.length && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getCurrentPlaceholder()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px] max-h-[120px]"
                disabled={isLoading}
                rows="2"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[50px]"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Enter で送信、Shift + Enter で改行
          </p>
        </div>
      )}
    </div>
  )
}