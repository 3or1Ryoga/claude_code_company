'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from '@hello-pangea/dnd'
import { 
  GripVertical,
  Plus,
  Edit,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Type,
  Image,
  Square as ButtonIcon,
  Layout,
  Copy,
  Palette
} from 'lucide-react'

interface LPElement {
  id: string
  type: 'hero' | 'text' | 'image' | 'button' | 'section' | 'card'
  content: string
  styles: {
    backgroundColor?: string
    textColor?: string
    fontSize?: string
    padding?: string
    margin?: string
    textAlign?: 'left' | 'center' | 'right'
    borderRadius?: string
    border?: string
    width?: string
    height?: string
  }
  settings: {
    link?: string
    alt?: string
    placeholder?: string
  }
}

interface DragDropEditorProps {
  onPreview?: (elements: LPElement[]) => void
  onSave?: (elements: LPElement[]) => void
  initialElements?: LPElement[]
  className?: string
}

const elementTemplates: Omit<LPElement, 'id'>[] = [
  {
    type: 'hero',
    content: 'ようこそ、革新的なソリューションへ',
    styles: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      fontSize: '48px',
      padding: '80px 20px',
      textAlign: 'center',
      borderRadius: '0px'
    },
    settings: {}
  },
  {
    type: 'text',
    content: 'ここに説明文を入力してください。',
    styles: {
      fontSize: '16px',
      padding: '20px',
      textAlign: 'left',
      textColor: '#374151'
    },
    settings: {}
  },
  {
    type: 'image',
    content: 'https://via.placeholder.com/600x300/3b82f6/ffffff?text=画像をドラッグ',
    styles: {
      width: '100%',
      height: '300px',
      borderRadius: '8px',
      margin: '20px 0'
    },
    settings: {
      alt: '説明画像'
    }
  },
  {
    type: 'button',
    content: '今すぐ始める',
    styles: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      fontSize: '18px',
      padding: '16px 32px',
      borderRadius: '8px',
      textAlign: 'center',
      margin: '20px auto',
      width: 'fit-content'
    },
    settings: {
      link: '#'
    }
  },
  {
    type: 'card',
    content: 'カードタイトル\n\nカードの説明文をここに入力します。',
    styles: {
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      margin: '20px 0'
    },
    settings: {}
  },
  {
    type: 'section',
    content: 'セクションタイトル',
    styles: {
      backgroundColor: '#f9fafb',
      padding: '60px 20px',
      textAlign: 'center',
      fontSize: '32px',
      textColor: '#111827'
    },
    settings: {}
  }
]

export default function DragDropEditor({
  onPreview,
  onSave,
  initialElements = [],
  className = ''
}: DragDropEditorProps) {
  const [elements, setElements] = useState<LPElement[]>(initialElements)
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (onPreview) {
      onPreview(elements)
    }
  }, [elements, onPreview])

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (result.source.droppableId === 'templates' && result.destination.droppableId === 'editor') {
      const template = elementTemplates[sourceIndex]
      const newElement: LPElement = {
        ...template,
        id: generateId()
      }
      
      const newElements = [...elements]
      newElements.splice(destIndex, 0, newElement)
      setElements(newElements)
    } else if (result.source.droppableId === 'editor' && result.destination.droppableId === 'editor') {
      const newElements = [...elements]
      const [removed] = newElements.splice(sourceIndex, 1)
      newElements.splice(destIndex, 0, removed)
      setElements(newElements)
    }
  }, [elements])

  const updateElement = useCallback((id: string, updates: Partial<LPElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement])

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (element) {
      const newElement: LPElement = {
        ...element,
        id: generateId()
      }
      const index = elements.findIndex(el => el.id === id)
      const newElements = [...elements]
      newElements.splice(index + 1, 0, newElement)
      setElements(newElements)
    }
  }, [elements])

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(elements)
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderElement = (element: LPElement, isDragging = false) => {
    const isSelected = selectedElement === element.id
    const isEditingThis = isEditing === element.id

    const elementStyle = {
      ...element.styles,
      cursor: previewMode ? 'default' : 'pointer',
      border: isSelected && !previewMode ? '2px solid #3b82f6' : element.styles.border || 'none',
      position: 'relative' as const,
      opacity: isDragging ? 0.5 : 1
    }

    const handleClick = (e: React.MouseEvent) => {
      if (previewMode) return
      e.stopPropagation()
      setSelectedElement(element.id)
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (previewMode) return
      e.stopPropagation()
      setIsEditing(element.id)
    }

    const handleContentChange = (newContent: string) => {
      updateElement(element.id, { content: newContent })
    }

    const handleBlur = () => {
      setIsEditing(null)
    }

    const renderContent = () => {
      switch (element.type) {
        case 'hero':
        case 'section':
          return (
            <div style={elementStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
              {isEditingThis ? (
                <input
                  type="text"
                  value={element.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={handleBlur}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: element.styles.fontSize,
                    color: element.styles.textColor,
                    textAlign: element.styles.textAlign
                  }}
                />
              ) : (
                <h1 style={{ margin: 0, fontSize: element.styles.fontSize, color: element.styles.textColor }}>
                  {element.content}
                </h1>
              )}
            </div>
          )
        
        case 'text':
          return (
            <div style={elementStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
              {isEditingThis ? (
                <textarea
                  value={element.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={handleBlur}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    minHeight: '60px',
                    resize: 'vertical',
                    fontSize: element.styles.fontSize,
                    color: element.styles.textColor,
                    textAlign: element.styles.textAlign
                  }}
                />
              ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {element.content}
                </p>
              )}
            </div>
          )
        
        case 'image':
          return (
            <div style={elementStyle} onClick={handleClick}>
              <img
                src={element.content}
                alt={element.settings.alt || ''}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: element.styles.borderRadius
                }}
              />
            </div>
          )
        
        case 'button':
          return (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: element.styles.textAlign === 'center' ? 'center' : 
                               element.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
                margin: element.styles.margin 
              }}
            >
              <button
                style={elementStyle}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
              >
                {isEditingThis ? (
                  <input
                    type="text"
                    value={element.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onBlur={handleBlur}
                    autoFocus
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: element.styles.textColor,
                      fontSize: element.styles.fontSize
                    }}
                  />
                ) : (
                  element.content
                )}
              </button>
            </div>
          )
        
        case 'card':
          return (
            <div style={elementStyle} onClick={handleClick} onDoubleClick={handleDoubleClick}>
              {isEditingThis ? (
                <textarea
                  value={element.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={handleBlur}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontSize: element.styles.fontSize,
                    color: element.styles.textColor
                  }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {element.content}
                </div>
              )}
            </div>
          )
        
        default:
          return (
            <div style={elementStyle} onClick={handleClick}>
              {element.content}
            </div>
          )
      }
    }

    return (
      <div className="relative group">
        {renderContent()}
        
        {isSelected && !previewMode && (
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 flex gap-1 bg-white shadow-lg rounded-md p-1 border">
            <button
              onClick={() => duplicateElement(element.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="複製"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditing(element.id)}
              className="p-1 hover:bg-gray-100 rounded"
              title="編集"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteElement(element.id)}
              className="p-1 hover:bg-gray-100 rounded text-red-600"
              title="削除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Element Templates Sidebar */}
        {!previewMode && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="w-5 h-5" />
                  要素テンプレート
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Droppable droppableId="templates" isDropDisabled>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {elementTemplates.map((template, index) => (
                        <Draggable 
                          key={`template-${template.type}-${index}`} 
                          draggableId={`template-${template.type}-${index}`} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing
                                ${snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'} 
                                transition-shadow bg-white`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                {template.type === 'hero' && <Type className="w-4 h-4" />}
                                {template.type === 'text' && <Type className="w-4 h-4" />}
                                {template.type === 'image' && <Image className="w-4 h-4" />}
                                {template.type === 'button' && <ButtonIcon className="w-4 h-4" />}
                                {template.type === 'card' && <Layout className="w-4 h-4" />}
                                {template.type === 'section' && <Layout className="w-4 h-4" />}
                                <span className="text-sm font-medium capitalize">
                                  {template.type}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 truncate">
                                {template.content.slice(0, 30)}...
                              </p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Editor Area */}
        <div className={previewMode ? 'lg:col-span-4' : 'lg:col-span-3'}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {previewMode ? 'プレビューモード' : 'LP エディタ'}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {elements.length} 要素
                  </Badge>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    variant="outline"
                    size="sm"
                  >
                    {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {previewMode ? '編集' : 'プレビュー'}
                  </Button>
                  {onSave && (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="sm"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {isSaving ? '保存中...' : '保存'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                ref={editorRef}
                className={`min-h-[600px] border-2 border-dashed rounded-lg transition-colors
                  ${previewMode ? 'border-transparent' : 'border-gray-300 hover:border-gray-400'}
                  ${elements.length === 0 && !previewMode ? 'flex items-center justify-center' : ''}`}
                onClick={() => !previewMode && setSelectedElement(null)}
              >
                {elements.length === 0 && !previewMode ? (
                  <div className="text-center text-gray-500">
                    <Layout className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">要素をドラッグして開始</p>
                    <p className="text-sm">左側から要素をドラッグ&ドロップしてLPを作成しましょう</p>
                  </div>
                ) : (
                  <Droppable droppableId="editor">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`w-full ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                        style={{ minHeight: elements.length === 0 ? '600px' : 'auto' }}
                      >
                        {elements.map((element, index) => (
                          <Draggable 
                            key={element.id} 
                            draggableId={element.id} 
                            index={index}
                            isDragDisabled={previewMode}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`relative ${!previewMode ? 'group' : ''}`}
                              >
                                {!previewMode && (
                                  <div 
                                    {...provided.dragHandleProps}
                                    className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 
                                             opacity-0 group-hover:opacity-100 transition-opacity z-10
                                             bg-white border rounded-md p-1 shadow-md"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                {renderElement(element, snapshot.isDragging)}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DragDropContext>
    </div>
  )
}