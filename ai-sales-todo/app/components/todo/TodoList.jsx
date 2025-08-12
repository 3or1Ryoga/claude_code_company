'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Edit3, Save, X, RefreshCw, Sparkles } from 'lucide-react'
import { generateTodoList } from '../../../lib/gemini'

export default function TodoList({ bantAnswers, onTodosGenerated }) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [newTodo, setNewTodo] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const categories = ['アイスブレイク', 'ヒアリング', '提案', 'クロージング']
  const categoryColors = {
    'アイスブレイク': 'bg-blue-100 text-blue-800 border-blue-200',
    'ヒアリング': 'bg-green-100 text-green-800 border-green-200',
    '提案': 'bg-purple-100 text-purple-800 border-purple-200',
    'クロージング': 'bg-red-100 text-red-800 border-red-200'
  }

  useEffect(() => {
    if (Object.keys(bantAnswers).length === 4) {
      generateTodos()
    }
  }, [bantAnswers])

  const generateTodos = async () => {
    setLoading(true)
    try {
      const generatedTodos = await generateTodoList(bantAnswers)
      const todosWithIds = generatedTodos.map((todo, index) => ({
        id: Date.now() + index,
        ...todo,
        completed: false
      }))
      setTodos(todosWithIds)
      onTodosGenerated(todosWithIds)
    } catch (error) {
      console.error('ToDo生成エラー:', error)
      // フォールバック用のデフォルトToDo
      const fallbackTodos = [
        { id: 1, task: '挨拶と自己紹介', category: 'アイスブレイク', completed: false },
        { id: 2, task: 'お客様の現状についてヒアリング', category: 'ヒアリング', completed: false },
        { id: 3, task: '具体的なソリューションを提案', category: '提案', completed: false },
        { id: 4, task: '次のステップについて確認', category: 'クロージング', completed: false }
      ]
      setTodos(fallbackTodos)
      onTodosGenerated(fallbackTodos)
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const startEditing = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.task)
  }

  const saveEdit = () => {
    setTodos(todos.map(todo =>
      todo.id === editingId ? { ...todo, task: editText } : todo
    ))
    setEditingId(null)
    setEditText('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const addTodo = () => {
    if (!newTodo.trim()) return

    const newTodoItem = {
      id: Date.now(),
      task: newTodo.trim(),
      category: 'ヒアリング', // デフォルトカテゴリ
      completed: false
    }

    setTodos([...todos, newTodoItem])
    setNewTodo('')
    setShowAddForm(false)
  }

  const getCategoryStats = () => {
    const stats = {}
    categories.forEach(category => {
      const categoryTodos = todos.filter(todo => todo.category === category)
      const completed = categoryTodos.filter(todo => todo.completed).length
      stats[category] = { total: categoryTodos.length, completed }
    })
    return stats
  }

  const getOverallProgress = () => {
    if (todos.length === 0) return 0
    const completed = todos.filter(todo => todo.completed).length
    return Math.round((completed / todos.length) * 100)
  }

  const categoryStats = getCategoryStats()
  const overallProgress = getOverallProgress()

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ToDoリストを生成中...</h3>
          <p className="text-gray-600">BANT条件に基づいてAIが最適なToDoリストを作成しています</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">商談ToDoリスト</h3>
              <p className="text-sm text-gray-600">AIが生成した最適化されたタスク</p>
            </div>
          </div>
          <button
            onClick={generateTodos}
            disabled={loading || Object.keys(bantAnswers).length < 4}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            再生成
          </button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">進捗状況</h4>
          <span className="text-2xl font-bold text-purple-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map(category => (
            <div key={category} className="text-center">
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[category]}`}>
                {category}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {categoryStats[category]?.completed || 0} / {categoryStats[category]?.total || 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Todo List */}
      <div className="p-6">
        <div className="space-y-3">
          {todos.map((todo, index) => (
            <div
              key={todo.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                todo.completed
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className={`flex-shrink-0 transition-colors ${
                    todo.completed ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {todo.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1">
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveEdit}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-500 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                        }`}>
                          {index + 1}. {todo.task}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryColors[todo.category]}`}>
                            {todo.category}
                          </span>
                          <button
                            onClick={() => startEditing(todo)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Todo Form */}
        <div className="mt-6">
          {showAddForm ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="新しいタスクを入力..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addTodo()
                    if (e.key === 'Escape') {
                      setShowAddForm(false)
                      setNewTodo('')
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={addTodo}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  追加
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTodo('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              カスタムタスクを追加
            </button>
          )}
        </div>
      </div>
    </div>
  )
}