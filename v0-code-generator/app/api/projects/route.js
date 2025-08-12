import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase.js';

/**
 * GET /api/projects?user_id=xxx
 * ユーザーの全プロジェクト一覧を取得
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_idパラメータが必要です' },
        { status: 400 }
      );
    }

    console.log(`[API] プロジェクト一覧取得: ユーザー ${user_id}`);

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] プロジェクト取得エラー:', error);
      return NextResponse.json(
        { error: 'プロジェクトの取得に失敗しました: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      count: projects?.length || 0
    });

  } catch (error) {
    console.error('[API] 予期しないエラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects?id=xxx
 * プロジェクトの削除
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('id');
    
    // Fallback to JSON body if no query parameter
    let user_id = searchParams.get('user_id');
    if (!user_id) {
      try {
        const body = await request.json();
        user_id = body.user_id;
      } catch {
        // No JSON body, continue without user_id
      }
    }

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id (id parameter) が必要です' },
        { status: 400 }
      );
    }
    
    // If no user_id, try to get from auth context or continue for admin delete
    if (!user_id) {
      console.warn('[API] user_id not provided, attempting admin delete');
    }

    console.log(`[API] プロジェクト削除: ${project_id} (ユーザー: ${user_id})`);

    // セキュリティ: 所有者のみ削除可能 (user_idがある場合のみチェック)
    let query = supabase
      .from('projects')
      .select('id, user_id, generated_project_path')
      .eq('id', project_id);
      
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    
    const { data: project, error: fetchError } = await query.single();

    if (fetchError || !project) {
      return NextResponse.json(
        { error: 'プロジェクトが見つからないか、削除権限がありません' },
        { status: 404 }
      );
    }

    // Supabaseからレコードを削除
    let deleteQuery = supabase
      .from('projects')
      .delete()
      .eq('id', project_id);
      
    if (user_id) {
      deleteQuery = deleteQuery.eq('user_id', user_id);
    }
    
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('[API] プロジェクト削除エラー:', deleteError);
      return NextResponse.json(
        { error: 'プロジェクトの削除に失敗しました: ' + deleteError.message },
        { status: 500 }
      );
    }

    // TODO: 物理ファイルの削除（オプション）
    // 本番環境では生成されたプロジェクトファイルも削除することを検討
    // const projectPath = project.generated_project_path;
    // if (projectPath && fs.existsSync(projectPath)) {
    //   await fs.rm(projectPath, { recursive: true, force: true });
    // }

    console.log(`[API] プロジェクト削除完了: ${project_id}`);

    return NextResponse.json({
      success: true,
      message: 'プロジェクトが削除されました',
      deleted_project_id: project_id
    });

  } catch (error) {
    console.error('[API] 予期しないエラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}