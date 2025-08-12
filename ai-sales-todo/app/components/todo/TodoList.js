'use client'

import { useState, useEffect } from 'react'
import { Check, Edit3, Plus, Trash2, CheckSquare, Square, AlertCircle } from 'lucide-react'

export default function TodoList({ bantAnswers, onTodosGenerated }) {
  const [todos, setTodos] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [newTodoText, setNewTodoText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // BANT回答からAIでToDoリストを生成
  const generateTodosFromBANT = async (answers) => {
    setIsGenerating(true)
    
    try {
      // 実際のAI生成ロジックはここに実装
      // 今回はモックデータで代用
      const mockTodos = [
        {
          id: 1,
          text: `予算${String(answers.budget)}の範囲で提案資料を準備する`,
          completed: false,
          priority: 'high',
          category: 'preparation'
        },
        {
          id: 2,
          text: `${String(answers.authority)}への提案アプローチを確認する`,
          completed: false,
          priority: 'high',
          category: 'authority'
        },
        {
          id: 3,
          text: `「${String(answers.need)}」の課題解決策を具体的に説明する`,
          completed: false,
          priority: 'high',
          category: 'solution'
        },
        {
          id: 4,
          text: `${String(answers.timeline)}に合わせた導入スケジュールを提示する`,
          completed: false,
          priority: 'medium',
          category: 'timeline'
        },
        {
          id: 5,
          text: '競合他社との差別化ポイントを明確にする',
          completed: false,
          priority: 'medium',
          category: 'differentiation'
        },
        {
          id: 6,
          text: 'ROI（投資収益率）の試算資料を用意する',
          completed: false,
          priority: 'low',
          category: 'roi'
        }
      ]
      
      setTimeout(() => {
        setTodos(mockTodos)
        setIsGenerating(false)
        onTodosGenerated(mockTodos)
      }, 2000)
    } catch (error) {
      console.error('ToDo生成エラー:', error)
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (bantAnswers && Object.keys(bantAnswers).length > 0) {
      generateTodosFromBANT(bantAnswers)
    }
  }, [bantAnswers])

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const startEdit = (id, text) => {
    setEditingId(id)
    setEditText(text)
  }

  const saveEdit = () => {
    if (editText.trim()) {
      setTodos(todos.map(todo =>
        todo.id === editingId ? { ...todo, text: editText.trim() } : todo
      ))
    }
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const deleteTodo = (id) => {
    if (confirm('このToDoを削除してもよろしいですか？')) {
      setTodos(todos.filter(todo => todo.id !== id))
    }
  }

  const addTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now(),
        text: newTodoText.trim(),
        completed: false,
        priority: 'medium',
        category: 'custom'
      }
      setTodos([...todos, newTodo])
      setNewTodoText('')
      setShowAddForm(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'low': return <AlertCircle className="w-4 h-4 text-green-500" />
      default: return null
    }
  }

  const completedCount = todos.filter(todo => todo.completed).length
  const totalCount = todos.length

  if (isGenerating) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <div className="text-lg font-semibold text-gray-700">
            AIが商談ToDoリストを生成中...
          </div>
          <div className="text-sm text-gray-500 text-center">
            BANT条件の回答を分析し、<br />
            効果的な商談のためのタスクを作成しています
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">商談ToDoリスト</h3>
            <p className="text-sm text-gray-600 mt-1">
              完了: {completedCount}/{totalCount} 項目
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>進捗状況</span>
            <span>{Math.round((completedCount / totalCount) * 100) || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Add Todo Form */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="新しいToDoを入力..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') addTodo()
                if (e.key === 'Escape') setShowAddForm(false)
              }}
              autoFocus
            />
            <button
              onClick={addTodo}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Todo Items */}
      <div className="p-4 space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>ToDoリストがありません</p>
            <p className="text-sm">AIチャットを完了するとToDoが自動生成されます</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className={`border-l-4 ${getPriorityColor(todo.priority)} rounded-lg p-4 transition-all duration-200 ${
                todo.completed ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {todo.completed ? (
                    <CheckSquare className="w-5 h-5 text-green-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {editingId === todo.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            saveEdit()
                          }
                          if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className={`${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {String(todo.text)}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getPriorityIcon(todo.priority)}
                        <span className="text-xs text-gray-500 capitalize">
                          {todo.priority} priority
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {todo.category}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId !== todo.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(todo.id, todo.text)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {todos.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              高優先度: {todos.filter(t => t.priority === 'high').length}件 | 
              中優先度: {todos.filter(t => t.priority === 'medium').length}件 | 
              低優先度: {todos.filter(t => t.priority === 'low').length}件
            </span>
            <span>
              完了率: {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}