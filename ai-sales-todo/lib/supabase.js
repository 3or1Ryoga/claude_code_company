import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * ブラウザ用Supabaseクライアントを作成
 */
export const createBrowserSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase環境変数が設定されていません')
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * サーバー用Supabaseクライアントを作成
 */
export const createServerSupabaseClient = (cookieStore) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase環境変数が設定されていません')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

/**
 * 認証状態の確認
 */
export async function getCurrentUser(supabase) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return null
  }
}

/**
 * メールアドレスでサインアップ
 */
export async function signUp(supabase, email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('サインアップエラー:', error)
    return { user: null, error: error.message }
  }
}

/**
 * メールアドレスでサインイン
 */
export async function signIn(supabase, email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { user: data.user, error: null }
  } catch (error) {
    console.error('サインインエラー:', error)
    return { user: null, error: error.message }
  }
}

/**
 * サインアウト
 */
export async function signOut(supabase) {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('サインアウトエラー:', error)
    return { error: error.message }
  }
}

/**
 * Supabaseの設定状況を確認
 */
export function isSupabaseConfigured() {
  return !!(supabaseUrl && 
           supabaseAnonKey && 
           supabaseUrl !== 'your_supabase_url_here' &&
           supabaseAnonKey !== 'your_supabase_anon_key_here')
}