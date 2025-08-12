'use client'

import { useState } from 'react'
import { Users, MessageSquare, ClipboardList, Mic, BarChart3, ArrowRight } from 'lucide-react'
import ChatInterface from './components/chat/ChatInterface'
import TodoList from './components/todo/TodoList'
import AudioController from './components/audio/AudioController'
import MeetingDashboard from './components/meeting/MeetingDashboard'

export default function Home() {
  const [currentStep, setCurrentStep] = useState('chat') // chat, todo, meeting
  const [bantAnswers, setBantAnswers] = useState({})
  const [todos, setTodos] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5)

  const handleChatComplete = (answers) => {
    setBantAnswers(answers)
    setCurrentStep('todo')
  }

  const handleTodosGenerated = (generatedTodos) => {
    setTodos(generatedTodos)
  }

  const handleTodoComplete = (todoId) => {
    setTodos(todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: true } : todo
    ))
  }

  const startMeeting = () => {
    setCurrentStep('meeting')
  }

  const resetFlow = () => {
    setCurrentStep('chat')
    setBantAnswers({})
    setTodos([])
    setIsRecording(false)
    setRecordingTime(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Sales Assistant</h1>
                <p className="text-sm text-gray-600">商談成約率向上支援システム</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={resetFlow}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-8 mb-8">
          <div className={`flex items-center gap-3 ${
            currentStep === 'chat' ? 'text-blue-600' : 
            currentStep === 'todo' || currentStep === 'meeting' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === 'chat' ? 'bg-blue-100 border-2 border-blue-500' :
              currentStep === 'todo' || currentStep === 'meeting' ? 'bg-green-100 border-2 border-green-500' :
              'bg-gray-100 border-2 border-gray-300'
            }`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-medium">BANT ヒアリング</span>
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400" />

          <div className={`flex items-center gap-3 ${
            currentStep === 'todo' ? 'text-blue-600' : 
            currentStep === 'meeting' ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === 'todo' ? 'bg-blue-100 border-2 border-blue-500' :
              currentStep === 'meeting' ? 'bg-green-100 border-2 border-green-500' :
              'bg-gray-100 border-2 border-gray-300'
            }`}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="font-medium">ToDo 生成</span>
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400" />

          <div className={`flex items-center gap-3 ${
            currentStep === 'meeting' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep === 'meeting' ? 'bg-blue-100 border-2 border-blue-500' :
              'bg-gray-100 border-2 border-gray-300'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <span className="font-medium">商談実行</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {currentStep === 'chat' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">商談準備を始めましょう</h2>
                <p className="text-lg text-gray-600">
                  AIがBANT条件に基づいて質問します。お客様の情報を教えてください。
                </p>
              </div>
              <div className="h-[600px]">
                <ChatInterface onComplete={handleChatComplete} />
              </div>
            </div>
          )}

          {currentStep === 'todo' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">商談ToDoリスト</h2>
                <p className="text-lg text-gray-600">
                  AIが生成したToDoリストを確認し、必要に応じて編集してください。
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
                <TodoList 
                  bantAnswers={bantAnswers} 
                  onTodosGenerated={handleTodosGenerated}
                />
                
                <div className="space-y-6">
                  {/* BANT Summary */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">BANT条件サマリー</h3>
                    <div className="space-y-4">
                      {Object.entries(bantAnswers).map(([key, value]) => (
                        <div key={key} className="border-l-4 border-blue-500 pl-4">
                          <div className="font-medium text-gray-700 capitalize">
                            {key === 'budget' ? '予算 (Budget)' :
                             key === 'authority' ? '決裁権 (Authority)' :
                             key === 'need' ? 'ニーズ (Need)' :
                             key === 'timeline' ? '導入時期 (Timeline)' : key}
                          </div>
                          <div className="text-gray-600 text-sm mt-1">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Start Meeting Button */}
                  {todos.length > 0 && (
                    <div className="text-center">
                      <button
                        onClick={startMeeting}
                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-3 mx-auto"
                      >
                        <Mic className="w-6 h-6" />
                        オンライン商談を開始する
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        音声録音とリアルタイム解析が開始されます
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'meeting' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">商談実行中</h2>
                <p className="text-lg text-gray-600">
                  音声をリアルタイムで解析し、ToDoの完了を自動判定します。
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Meeting Dashboard - Full width on top */}
                <div className="xl:col-span-3">
                  <MeetingDashboard
                    todos={todos}
                    completedTodos={todos.filter(todo => todo.completed)}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                  />
                </div>

                {/* Audio Controller */}
                <div className="xl:col-span-1">
                  <AudioController
                    todos={todos}
                    onTodoComplete={handleTodoComplete}
                    similarityThreshold={similarityThreshold}
                    onThresholdChange={setSimilarityThreshold}
                  />
                </div>

                {/* Todo List - Live View */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                        リアルタイム進捗
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        音声解析により自動的に更新されます
                      </p>
                    </div>
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      <TodoList 
                        bantAnswers={bantAnswers} 
                        onTodosGenerated={handleTodosGenerated}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>🎯 AI Sales Assistant - 商談成約率向上支援システム</p>
            <p>BANT条件ヒアリング → ToDo自動生成 → リアルタイム音声解析</p>
          </div>
        </div>
      </footer>
    </div>
  )
}