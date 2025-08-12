import { NextResponse } from 'next/server';
import { generateLandingPage } from '../../../lib/core-engine.js';
import { supabase } from '../../../lib/supabase.js';
import path from 'path';

/**
 * POST /api/generate
 * PASONAデータを受け取ってLP生成 & Supabaseに保存
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストデータの検証
    const {
      project_name,
      user_id,
      pasona_problem,
      pasona_affinity,
      pasona_solution,
      pasona_offer,
      pasona_narrowing_down,
      pasona_action
    } = body;

    // 必須フィールドの検証
    if (!project_name || !user_id) {
      return NextResponse.json(
        { error: 'project_nameとuser_idは必須です' },
        { status: 400 }
      );
    }

    if (!pasona_problem || !pasona_affinity || !pasona_solution || 
        !pasona_offer || !pasona_narrowing_down || !pasona_action) {
      return NextResponse.json(
        { error: '全てのPASONA項目の入力が必要です' },
        { status: 400 }
      );
    }

    console.log(`[API] LP生成開始: ${project_name} (ユーザー: ${user_id})`);

    // PASONAデータをコアエンジン用の形式に整形
    const pasonaData = {
      problem: pasona_problem,
      affinity: pasona_affinity,
      solution: pasona_solution,
      offer: pasona_offer,
      narrowing_down: pasona_narrowing_down,
      action: pasona_action
    };

    // 出力ディレクトリを指定
    const outputDir = path.join(process.cwd(), 'generated_projects');

    // コアエンジンを使ってLP生成
    console.log('[API] コアエンジンを起動中...');
    const generationResult = await generateLandingPage({
      projectName: project_name,
      pasonaData: pasonaData,
      outputDir: outputDir
    });

    if (!generationResult.success) {
      console.error('[API] LP生成に失敗:', generationResult.error);
      return NextResponse.json(
        { error: 'LP生成に失敗しました: ' + generationResult.error },
        { status: 500 }
      );
    }

    console.log('[API] LP生成成功、Supabaseに保存中...');

    // Supabaseにプロジェクトデータを保存
    const projectData = {
      user_id: user_id,
      project_name: project_name,
      pasona_problem: pasona_problem,
      pasona_affinity: pasona_affinity,
      pasona_solution: pasona_solution,
      pasona_offer: pasona_offer,
      pasona_narrowing_down: pasona_narrowing_down,
      pasona_action: pasona_action,
      generated_project_path: generationResult.projectPath,
      preview_url: generationResult.previewUrl,
      created_at: new Date().toISOString()
    };

    const { data: savedProject, error: saveError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (saveError) {
      console.error('[API] Supabase保存エラー:', saveError);
      return NextResponse.json(
        { error: 'データベース保存に失敗しました: ' + saveError.message },
        { status: 500 }
      );
    }

    console.log('[API] プロジェクト保存完了:', savedProject.id);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'LP生成とデータ保存が完了しました',
      project: {
        id: savedProject.id,
        project_name: savedProject.project_name,
        generated_project_path: savedProject.generated_project_path,
        preview_url: savedProject.preview_url,
        created_at: savedProject.created_at
      },
      generation_result: {
        projectPath: generationResult.projectPath,
        projectName: generationResult.projectName,
        previewUrl: generationResult.previewUrl
      }
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
 * GET /api/generate
 * APIの稼働状況確認用
 */
export async function GET() {
  return NextResponse.json({
    message: 'AI LP Generator API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      POST: 'LP生成とデータ保存',
      GET: '稼働状況確認'
    }
  });
}