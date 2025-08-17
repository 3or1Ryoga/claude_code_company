import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 DEBUG: Dummy insert test starting...')
    
    const supabase = await createServerSupabaseClient()
    
    // Test authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Create dummy data
    const dummyData = {
      site_name: `DEBUG_TEST_${Date.now()}`,
      pasona_input: {
        problem: 'デバッグテスト問題',
        affinity: 'デバッグテスト親近感',
        solution: 'デバッグテスト解決策',
        offer: 'デバッグテスト提案',
        narrowing_down: 'デバッグテスト絞り込み',
        action: 'デバッグテストアクション'
      },
      markdown_content: '# DEBUG TEST MARKDOWN\n\nThis is a debug test.',
      brief: 'デバッグテスト用ダミーデータ',
      colors: {
        primary: '#0EA5E9',
        accent: '#9333EA', 
        background: '#0B1221'
      },
      nav: ['Home', 'About', 'Contact'],
      logo_text: 'DEBUG TEST',
      socials: {
        x: '',
        linkedin: '',
        github: ''
      },
      contact: {
        email: 'debug@test.com',
        url: 'https://debug.test'
      },
      file_path: `debug_test_${Date.now()}.md`,
      user_id: user.id
    }
    
    console.log('🚨 DEBUG: Inserting dummy data:', dummyData)
    
    // Try to insert dummy data
    const { data: insertedData, error: insertError } = await supabase
      .from('concepts')
      .insert(dummyData)
      .select()
      .single()
    
    console.log('🚨 DEBUG: Insert result:', { insertedData, insertError })
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert failed',
        details: insertError,
        dummyData
      }, { status: 500 })
    }
    
    // Clean up: delete the dummy data
    const { error: deleteError } = await supabase
      .from('concepts')
      .delete()
      .eq('id', insertedData.id)
    
    if (deleteError) {
      console.log('🚨 DEBUG: Cleanup failed, but insert was successful')
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dummy insert test successful',
      insertedData,
      cleanedUp: !deleteError
    })
    
  } catch (error: any) {
    console.error('🚨 DEBUG: Dummy insert test error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}