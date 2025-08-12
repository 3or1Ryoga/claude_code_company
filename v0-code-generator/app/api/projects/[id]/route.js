import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

/**
 * GET /api/projects/[id]?user_id=xxx
 * 特定プロジェクトの詳細情報を取得
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_idパラメータが必要です' },
        { status: 400 }
      );
    }

    console.log(`[API] プロジェクト詳細取得: ${id} (ユーザー: ${user_id})`);

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'プロジェクトが見つかりません' },
          { status: 404 }
        );
      }
      console.error('[API] プロジェクト取得エラー:', error);
      return NextResponse.json(
        { error: 'プロジェクトの取得に失敗しました: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: project
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
 * PUT /api/projects/[id]
 * プロジェクトの更新（再生成）
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const {
      user_id,
      project_name,
      pasona_problem,
      pasona_affinity,
      pasona_solution,
      pasona_offer,
      pasona_narrowing_down,
      pasona_action
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_idが必要です' },
        { status: 400 }
      );
    }

    console.log(`[API] プロジェクト更新: ${id} (ユーザー: ${user_id})`);

    // セキュリティ: 所有者のみ更新可能
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingProject) {
      return NextResponse.json(
        { error: 'プロジェクトが見つからないか、更新権限がありません' },
        { status: 404 }
      );
    }

    // 更新データを準備
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // 各フィールドが提供されている場合のみ更新
    if (project_name !== undefined) updateData.project_name = project_name;
    if (pasona_problem !== undefined) updateData.pasona_problem = pasona_problem;
    if (pasona_affinity !== undefined) updateData.pasona_affinity = pasona_affinity;
    if (pasona_solution !== undefined) updateData.pasona_solution = pasona_solution;
    if (pasona_offer !== undefined) updateData.pasona_offer = pasona_offer;
    if (pasona_narrowing_down !== undefined) updateData.pasona_narrowing_down = pasona_narrowing_down;
    if (pasona_action !== undefined) updateData.pasona_action = pasona_action;

    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('[API] プロジェクト更新エラー:', updateError);
      return NextResponse.json(
        { error: 'プロジェクトの更新に失敗しました: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log(`[API] プロジェクト更新完了: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'プロジェクトが更新されました',
      project: updatedProject
    });

  } catch (error) {
    console.error('[API] 予期しないエラー:', error);
    return NextResponse.json(
      { error: '内部サーバーエラーが発生しました: ' + error.message },
      { status: 500 }
    );
  }
}