import { createBrowserSupabaseClient } from './supabase'

/**
 * 商談プロジェクト関連のデータベース操作
 */
export class MeetingProjectService {
  constructor(supabase) {
    this.supabase = supabase || createBrowserSupabaseClient()
  }

  /**
   * 新しい商談プロジェクトを作成
   */
  async createProject(projectData) {
    try {
      const { data, error } = await this.supabase
        .from('meeting_projects')
        .insert({
          title: projectData.title,
          client_name: projectData.clientName,
          meeting_date: projectData.meetingDate,
          budget: projectData.budget,
          authority: projectData.authority,
          need: projectData.need,
          timeline: projectData.timeline,
          additional_notes: projectData.additionalNotes
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('プロジェクト作成エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * ユーザーのプロジェクト一覧を取得
   */
  async getUserProjects() {
    try {
      const { data, error } = await this.supabase
        .from('meeting_projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('プロジェクト取得エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * プロジェクトの詳細情報を取得
   */
  async getProject(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('meeting_projects')
        .select(`
          *,
          todo_items(*),
          speech_records(*)
        `)
        .eq('id', projectId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('プロジェクト詳細取得エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * プロジェクトのステータスを更新
   */
  async updateProjectStatus(projectId, status) {
    try {
      const { data, error } = await this.supabase
        .from('meeting_projects')
        .update({ status })
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('プロジェクト更新エラー:', error)
      return { data: null, error: error.message }
    }
  }
}

/**
 * ToDoアイテム関連のデータベース操作
 */
export class TodoService {
  constructor(supabase) {
    this.supabase = supabase || createBrowserSupabaseClient()
  }

  /**
   * プロジェクトのToDoアイテムを一括作成
   */
  async createTodos(projectId, todos) {
    try {
      const todoData = todos.map((todo, index) => ({
        project_id: projectId,
        task_text: todo.task,
        category: todo.category,
        order_index: index,
        completed: todo.completed || false
      }))

      const { data, error } = await this.supabase
        .from('todo_items')
        .insert(todoData)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('ToDo作成エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * ToDoアイテムの完了状態を更新
   */
  async updateTodoCompletion(todoId, completed, detectedSpeech = null) {
    try {
      const updateData = {
        completed,
        completed_at: completed ? new Date().toISOString() : null
      }

      if (detectedSpeech) {
        updateData.detected_speech = detectedSpeech
      }

      const { data, error } = await this.supabase
        .from('todo_items')
        .update(updateData)
        .eq('id', todoId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('ToDo更新エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * プロジェクトのToDoリストを取得
   */
  async getProjectTodos(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('todo_items')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('ToDo取得エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * ToDoアイテムを削除
   */
  async deleteTodo(todoId) {
    try {
      const { error } = await this.supabase
        .from('todo_items')
        .delete()
        .eq('id', todoId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('ToDo削除エラー:', error)
      return { error: error.message }
    }
  }
}

/**
 * 音声記録関連のデータベース操作
 */
export class SpeechRecordService {
  constructor(supabase) {
    this.supabase = supabase || createBrowserSupabaseClient()
  }

  /**
   * 音声認識結果を記録
   */
  async recordSpeech(projectId, transcribedText, confidenceScore = null) {
    try {
      const { data, error } = await this.supabase
        .from('speech_records')
        .insert({
          project_id: projectId,
          transcribed_text: transcribedText,
          confidence_score: confidenceScore,
          processing_duration: null // 将来的にパフォーマンス測定用
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('音声記録エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * プロジェクトの音声記録履歴を取得
   */
  async getProjectSpeechRecords(projectId, limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('speech_records')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('音声記録取得エラー:', error)
      return { data: null, error: error.message }
    }
  }
}

/**
 * ユーザー設定関連のデータベース操作
 */
export class UserSettingsService {
  constructor(supabase) {
    this.supabase = supabase || createBrowserSupabaseClient()
  }

  /**
   * ユーザー設定を取得（存在しない場合はデフォルト値で作成）
   */
  async getUserSettings() {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .single()

      if (error && error.code === 'PGRST116') {
        // 設定が存在しない場合、デフォルト値で作成
        return await this.createDefaultSettings()
      }

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * デフォルトのユーザー設定を作成
   */
  async createDefaultSettings() {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .insert({
          default_similarity_threshold: 0.7,
          speech_language: 'ja-JP',
          theme: 'light',
          email_notifications: true
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('デフォルト設定作成エラー:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * ユーザー設定を更新
   */
  async updateSettings(settings) {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .update(settings)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('設定更新エラー:', error)
      return { data: null, error: error.message }
    }
  }
}