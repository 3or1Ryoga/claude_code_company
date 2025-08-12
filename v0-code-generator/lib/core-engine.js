import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { generateText } from 'ai';
import { vercel } from '@ai-sdk/vercel';

/**
 * PASONAデータからV0 API用のプロンプトを生成
 */
function generateV0Prompt(pasonaData) {
  const {
    problem,
    affinity,
    solution,
    offer,
    narrowing_down,
    action
  } = pasonaData;

  return `
You are an expert web developer and copywriter specializing in high-conversion landing pages.
Create a modern, professional landing page based on the PASONA framework with the following content:

**Problem (問題提起)**: ${problem}
**Affinity (親近感)**: ${affinity}
**Solution (解決策)**: ${solution}
**Offer (提案)**: ${offer}
**Narrowing down (絞込み)**: ${narrowing_down}
**Action (行動)**: ${action}

Requirements:
- Create a single React component for a Next.js App Router page
- Use TypeScript and Tailwind CSS
- Structure the page following the PASONA framework sequence
- Include responsive design optimized for conversions
- Add proper call-to-action buttons based on the "Action" content
- Use modern design with proper spacing, colors, and typography
- Return only the TSX code without any explanations or markdown

The component should be a complete, production-ready landing page that directly addresses the provided PASONA elements.
  `.trim();
}

/**
 * コードから外部ライブラリを抽出するヘルパー関数
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
 * AI LP生成エンジンのメイン関数
 */
export async function generateLandingPage(options) {
  const {
    projectName,
    pasonaData,
    outputDir = path.join(process.cwd(), 'generated_projects')
  } = options;

  let projectPath = '';

  try {
    // タイムスタンプ付きプロジェクト名を生成
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
    const finalDirName = `${projectName}-${timestamp}`;
    projectPath = path.join(outputDir, finalDirName);

    await fs.mkdir(outputDir, { recursive: true });

    // ステップ1：Next.jsプロジェクトを作成
    console.log(`[ステップ1/3] プロジェクトを作成します: ${projectPath}`);
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
      childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`プロセスがエラーコード ${code} で終了しました。`)));
    });
    console.log('✅ プロジェクトの骨組みが正常に作成されました！');

    // ステップ2：V0 APIを使ってLP用コードを生成
    console.log('\n[ステップ2/3] AIにLPコードの生成を依頼します...');
    const v0 = vercel('v0-1.5-md');
    const prompt = generateV0Prompt(pasonaData);
    const { text: rawCode } = await generateText({ model: v0, prompt: prompt });
    
    // Markdownコードブロックを除去
    const cleanedCode = rawCode.replace(/^```tsx\n?/, '').replace(/\n?```$/, '');
    console.log('✅ AIがLPコードを生成し、クリーンアップしました。');

    // ステップ3：依存関係の解決とファイル書き込み
    console.log('\n[ステップ3/3] 依存関係の解決とファイル書き込み...');
    
    const dependencies = extractDependencies(cleanedCode);
    if (dependencies.length > 0) {
      console.log(`  必要な追加ライブラリを検出しました: ${dependencies.join(', ')}`);
      console.log('  npm install を実行します...');
      await new Promise((resolve, reject) => {
        const childProcess = spawn('npm', ['install', ...dependencies], { 
          cwd: projectPath, 
          shell: true, 
          stdio: 'inherit' 
        });
        childProcess.on('error', reject);
        childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`npm installプロセスがエラーコード ${code} で終了しました。`)));
      });
      console.log('✅ 追加ライブラリのインストールが完了しました。');
    } else {
      console.log('  追加の外部ライブラリは不要です。');
    }
    
    // 生成したコードでpage.tsxを上書き
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    await fs.writeFile(pagePath, cleanedCode);
    console.log(`✅ 生成したコードを ${pagePath} に書き込みました。`);

    console.log('\n🎉🎉🎉 LP生成が完了しました！ 🎉🎉🎉');
    console.log('プロジェクトが完全に準備できました！');
    console.log(`   プロジェクト場所: ${projectPath}`);
    console.log('\n次のコマンドで開発サーバーを起動できます:');
    console.log(`cd ${projectPath} && npm run dev`);

    return {
      success: true,
      projectPath,
      projectName: finalDirName,
      generatedCode: cleanedCode,
      previewUrl: `http://localhost:3000` // 開発サーバー用URL
    };

  } catch (error) {
    console.error('\n❌ LP生成中にエラーが発生しました。');
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
      error: error.message
    };
  }
}

export default { generateLandingPage };