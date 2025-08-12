import { NextResponse } from 'next/server';
import { generateHomepage } from '../../../lib/homepage-generator.js';
import { supabase } from '../../../lib/supabase.js';
import path from 'path';

/**
 * POST /api/homepage
 * V0 API統合ホームページ生成エンドポイント
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    // リクエストデータの検証
    const {
      project_name,
      site_name,
      site_description,
      industry = 'general',
      style = 'modern',
      features = [],
      user_id
    } = body;

    // 必須フィールドの検証
    if (!project_name || !site_name) {
      return NextResponse.json(
        { error: 'project_name と site_name は必須です' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id は必須です（認証が必要）' },
        { status: 400 }
      );
    }

    console.log(`[API] V0統合ホームページ生成開始: ${project_name} (ユーザー: ${user_id})`);

    // 出力ディレクトリを指定
    const outputDir = path.join(process.cwd(), 'generated_projects');

    // V0統合ホームページ生成エンジンを起動
    console.log('[API] V0 Homepage Generator を起動中...');
    const generationResult = await generateHomepage({
      projectName: project_name,
      siteName: site_name,
      siteDescription: site_description,
      industry: industry,
      style: style,
      features: features,
      outputDir: outputDir
    });

    if (!generationResult.success) {
      console.error('[API] ホームページ生成に失敗:', generationResult.error);
      return NextResponse.json(
        { error: 'ホームページ生成に失敗しました: ' + generationResult.error },
        { status: 500 }
      );
    }

    console.log('[API] ホームページ生成成功、Supabaseに保存中...');

    // Supabaseにプロジェクトデータを保存
    const projectData = {
      user_id: user_id,
      project_name: project_name,
      project_type: 'homepage',
      site_name: site_name,
      site_description: site_description,
      industry: industry,
      style: style,
      features: features,
      generated_project_path: generationResult.projectPath,
      preview_url: generationResult.previewUrl,
      dev_command: generationResult.devCommand,
      dependencies: generationResult.dependencies,
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

    console.log('[API] ホームページプロジェクト保存完了:', savedProject.id);

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'V0統合ホームページ生成とデータ保存が完了しました',
      project: {
        id: savedProject.id,
        project_name: savedProject.project_name,
        site_name: savedProject.site_name,
        industry: savedProject.industry,
        style: savedProject.style,
        generated_project_path: savedProject.generated_project_path,
        preview_url: savedProject.preview_url,
        dev_command: savedProject.dev_command,
        created_at: savedProject.created_at
      },
      generation_result: {
        projectPath: generationResult.projectPath,
        projectName: generationResult.projectName,
        siteName: generationResult.siteName,
        previewUrl: generationResult.previewUrl,
        devCommand: generationResult.devCommand,
        dependencies: generationResult.dependencies
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
 * GET /api/homepage
 * V0統合ホームページ生成APIの稼働状況確認用
 */
export async function GET() {
  return NextResponse.json({
    message: 'V0統合 Homepage Generator API は稼働中です',
    timestamp: new Date().toISOString(),
    features: {
      v0_integration: 'V0 API統合による高品質コード生成',
      auto_dependency: '依存関係の自動解決',
      industry_templates: '業界別テンプレート対応',
      responsive_design: 'レスポンシブデザイン自動生成',
      supabase_storage: 'Supabaseデータ永続化'
    },
    endpoints: {
      POST: 'ホームページ生成とデータ保存',
      GET: '稼働状況確認'
    },
    supported_industries: [
      'technology',
      'business', 
      'creative',
      'ecommerce',
      'healthcare',
      'general'
    ],
    supported_styles: [
      'modern',
      'modern-tech',
      'professional', 
      'artistic',
      'commercial',
      'clean-medical'
    ]
  });
}