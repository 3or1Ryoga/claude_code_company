import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { generateText } from 'ai';
import { vercel } from '@ai-sdk/vercel';
import 'dotenv/config';

/**
 * ホームページ専用のV0プロンプト生成
 * @param {Object} options - ホームページ作成オプション
 * @returns {string} V0 API用のプロンプト
 */
function generateHomepagePrompt(options) {
  const {
    siteName = 'My Website',
    siteDescription = 'Welcome to our website',
    industry = 'general',
    style = 'modern',
    features = []
  } = options;

  return `
You are an expert web developer specializing in creating professional homepage designs.
Create a complete, modern homepage for a ${industry} website with the following specifications:

**Site Name**: ${siteName}
**Description**: ${siteDescription}
**Industry**: ${industry}
**Style**: ${style}
**Features**: ${features.join(', ') || 'hero section, about, services, contact'}

Requirements:
- Create a single React component for a Next.js App Router page
- Use TypeScript and Tailwind CSS exclusively
- Include responsive design optimized for all devices
- Structure should include:
  * Header with navigation
  * Hero section with compelling headline
  * About/Services section
  * Features/Benefits section
  * Contact/CTA section
  * Footer
- Use modern design principles with proper spacing, colors, and typography
- Include hover effects and smooth transitions
- Optimize for conversion and user engagement
- Return only the TSX code without any explanations or markdown blocks

The component should be production-ready and visually appealing for the ${industry} industry.
  `.trim();
}

/**
 * コードから外部ライブラリを抽出するヘルパー関数
 * @param {string} code - 生成されたReactコード
 * @returns {Array} 依存関係のリスト
 */
function extractDependencies(code) {
  const dependencyRegex = /from\s+['"]((?![\.\/@])[^'"]+)['"]/g;
  const dependencies = new Set();
  let match;
  while ((match = dependencyRegex.exec(code)) !== null) {
    if (match[1] !== 'react' && !match[1].startsWith('next/')) {
      dependencies.add(match[1]);
    }
  }
  return Array.from(dependencies);
}

/**
 * V0 API統合ホームページ生成エンジン
 * @param {Object} options - ホームページ生成オプション
 * @returns {Object} 生成結果
 */
export async function generateHomepage(options) {
  const {
    projectName,
    siteName,
    siteDescription,
    industry = 'general',
    style = 'modern',
    features = [],
    outputDir = path.join(process.cwd(), 'generated_projects')
  } = options;

  let projectPath = '';

  try {
    // V0 API有効性チェック
    const v0Enabled = process.env.V0_API_ENABLED === 'true';
    const v0Model = process.env.V0_MODEL || 'v0-1.5-md';
    
    if (!v0Enabled) {
      throw new Error('V0 API が無効です。.env ファイルで V0_API_ENABLED=true に設定してください。');
    }

    console.log(`[V0 Homepage Generator] V0 API統合開始 (モデル: ${v0Model})`);

    // タイムスタンプ付きプロジェクト名を生成
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
    const finalDirName = `${projectName}-homepage-${timestamp}`;
    projectPath = path.join(outputDir, finalDirName);

    await fs.mkdir(outputDir, { recursive: true });

    // ステップ1：Next.jsプロジェクトを作成
    console.log(`[ステップ1/4] Next.jsプロジェクトを作成します: ${projectPath}`);
    await new Promise((resolve, reject) => {
      const childProcess = spawn('npx', [
        'create-next-app', projectPath, 
        '--ts', '--tailwind', '--eslint', '--src-dir', '--app', 
        '--use-npm', '--no-git', '--import-alias', '"@/*"', '--no-turbopack'
      ], { 
        shell: true, 
        stdio: 'inherit' 
      });
      childProcess.on('error', reject);
      childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`create-next-app がエラーコード ${code} で終了しました。`)));
    });
    console.log('✅ Next.jsプロジェクトの骨組みが正常に作成されました！');

    // ステップ2：V0 API統合でホームページコードを生成
    console.log(`\n[ステップ2/4] V0 API (${v0Model}) でホームページコードを生成中...`);
    const v0 = vercel(v0Model);
    const prompt = generateHomepagePrompt({
      siteName,
      siteDescription,
      industry,
      style,
      features
    });
    
    console.log('[V0 API] リクエスト送信中...');
    const { text: rawCode } = await generateText({ model: v0, prompt: prompt });
    
    // Markdownコードブロックを除去
    const cleanedCode = rawCode.replace(/^```tsx?\n?/, '').replace(/\n?```$/, '');
    console.log('✅ V0 API でホームページコードの生成が完了しました！');

    // ステップ3：依存関係の自動解決
    console.log('\n[ステップ3/4] 依存関係の解決とライブラリインストール...');
    const dependencies = extractDependencies(cleanedCode);
    
    if (dependencies.length > 0) {
      console.log(`  検出された追加ライブラリ: ${dependencies.join(', ')}`);
      console.log('  npm install を実行中...');
      await new Promise((resolve, reject) => {
        const childProcess = spawn('npm', ['install', ...dependencies], { 
          cwd: projectPath, 
          shell: true, 
          stdio: 'inherit' 
        });
        childProcess.on('error', reject);
        childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`npm install がエラーコード ${code} で終了しました。`)));
      });
      console.log('✅ 追加ライブラリのインストールが完了しました！');
    } else {
      console.log('  追加の外部ライブラリは不要です。');
    }
    
    // ステップ4：生成したコードでページを置換
    console.log('\n[ステップ4/4] 生成したホームページコードをファイルに書き込み...');
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    await fs.writeFile(pagePath, cleanedCode);
    console.log(`✅ ホームページコードを ${pagePath} に書き込み完了！`);

    // プロジェクト情報ファイルを作成
    const projectInfo = {
      projectName: finalDirName,
      siteName,
      siteDescription,
      industry,
      style,
      features,
      generatedAt: new Date().toISOString(),
      v0Model,
      dependencies
    };
    
    const infoPath = path.join(projectPath, 'project-info.json');
    await fs.writeFile(infoPath, JSON.stringify(projectInfo, null, 2));

    console.log('\n🎉🎉🎉 V0統合ホームページ生成が完了しました！ 🎉🎉🎉');
    console.log(`プロジェクト名: ${finalDirName}`);
    console.log(`サイト名: ${siteName}`);
    console.log(`業界: ${industry} | スタイル: ${style}`);
    console.log(`プロジェクト場所: ${projectPath}`);
    console.log('\n開発サーバーの起動方法:');
    console.log(`cd ${projectPath} && npm run dev`);

    return {
      success: true,
      projectPath,
      projectName: finalDirName,
      siteName,
      siteDescription,
      industry,
      style,
      features,
      generatedCode: cleanedCode,
      dependencies,
      previewUrl: `http://localhost:3000`,
      devCommand: `cd ${projectPath} && npm run dev`
    };

  } catch (error) {
    console.error('\n❌ V0統合ホームページ生成中にエラーが発生しました。');
    console.error('--- エラー詳細 ---');
    console.error(error.message);
    console.error('--------------------');
    
    // エラー時のクリーンアップ
    if (projectPath) {
      try {
        console.log(`作成に失敗したディレクトリをクリーンアップします: ${projectPath}`);
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log('🧹 クリーンアップが完了しました。');
      } catch (cleanupError) {
        console.error('クリーンアップ中に別のエラーが発生しました:', cleanupError);
      }
    }

    return {
      success: false,
      error: error.message,
      details: {
        projectName,
        siteName,
        industry,
        style
      }
    };
  }
}

/**
 * 業界別デフォルト設定
 */
export const industryDefaults = {
  technology: {
    features: ['hero section', 'product showcase', 'tech specs', 'pricing', 'contact'],
    style: 'modern-tech'
  },
  business: {
    features: ['hero section', 'services', 'about us', 'testimonials', 'contact'],
    style: 'professional'
  },
  creative: {
    features: ['hero section', 'portfolio', 'about', 'services', 'contact'],
    style: 'artistic'
  },
  ecommerce: {
    features: ['hero section', 'featured products', 'categories', 'testimonials', 'contact'],
    style: 'commercial'
  },
  healthcare: {
    features: ['hero section', 'services', 'about', 'appointments', 'contact'],
    style: 'clean-medical'
  }
};

export default { generateHomepage, industryDefaults };