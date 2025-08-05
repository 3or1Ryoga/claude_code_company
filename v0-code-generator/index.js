// import { spawn } from 'child_process';
// import fs from 'fs/promises';
// import path from 'path';
// // ★ V0 API連携のために必要なライブラリをインポート
// import { generateText } from 'ai';
// import { vercel } from '@ai-sdk/vercel';
// import 'dotenv/config';

// async function main() {
//   let projectPath = ''; 

//   try {
//     const baseName = process.argv[2];
//     if (!baseName) {
//       throw new Error('プロジェクトのコンセプト名を指定してください。例: node index.js retro-cafe');
//     }

//     const now = new Date();
//     const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
//     const finalDirName = `${baseName}-${timestamp}`;
//     const generatedDir = path.join(process.cwd(), 'generated_projects');
//     projectPath = path.join(generatedDir, finalDirName);

//     await fs.mkdir(generatedDir, { recursive: true });

//     // --- ステップ1：プロジェクトの自動生成 ---
//     console.log(`[ステップ1/2] プロジェクトを作成します: ${projectPath}`);
//     console.log('create-next-app を実行中...');

//     const command = 'npx';
//     const args = [
//       'create-next-app', projectPath,
//       '--ts', '--tailwind', '--eslint', '--src-dir', '--app',
//       '--use-npm', '--no-git', '--import-alias', '"@/*"', '--no-turbopack',
//     ];

//     await new Promise((resolve, reject) => {
//       const childProcess = spawn(command, args, { shell: true, stdio: 'inherit' });
//       childProcess.on('error', reject);
//       childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`プロセスがエラーコード ${code} で終了しました。`)));
//     });

//     console.log('✅ プロジェクトの骨組みが正常に作成されました！');


//     // --- ★ステップ2：AIによるコード生成とファイル書き込み ---
//     console.log('\n[ステップ2/2] AIにUIコードの生成を依頼します...');

//     // V0モデルを初期化
//     const v0 = vercel('v0-1.5-md');

//     // 引数で渡されたコンセプトをプロンプトに埋め込む
//     const prompt = `
//       You are an expert web developer. Based on the concept "${baseName}", 
//       generate a single React component for a Next.js App Router page.
//       The code should be a single TSX file content. Do not include any explanation, just the code.
//       Use TypeScript and Tailwind CSS.
//     `;

//     // V0 APIを呼び出してコードを生成
//     const { text: aiGeneratedCode } = await generateText({ model: v0, prompt: prompt });
//     console.log('✅ AIがコードを生成しました。');

//     // 生成されたプロジェクトのpage.tsxのパスを特定
//     const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');

//     // AIが生成したコードでpage.tsxを上書き
//     await fs.writeFile(pagePath, aiGeneratedCode);
//     console.log(`✅ 生成したコードを ${pagePath} に書き込みました。`);


//     // --- 完了 ---
//     console.log('\n🎉🎉🎉 すべての処理が完了しました！ 🎉🎉🎉');
//     console.log('プロジェクトの作成とコードの組み込みに成功しました！');
//     console.log(`   プロジェクト場所: ${projectPath}`);

//   } catch (error) {
//     console.error('\n❌ プロジェクトの作成中にエラーが発生しました。');
//     console.error('--- エラー詳細 ---');
//     console.error(error.message);
//     console.error('--------------------');

//     if (projectPath) {
//       try {
//         console.log(`作成に失敗したディレクトリをクリーンアップします: ${projectPath}`);
//         await fs.rm(projectPath, { recursive: true, force: true });
//         console.log('🧹 クリーンアップが完了しました。');
//       } catch (cleanupError) {
//         console.error('クリーンアップ中に別のエラーが発生しました:', cleanupError);
//       }
//     }
//   }
// }

// main();


import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { generateText } from 'ai';
import { vercel } from '@ai-sdk/vercel';
import 'dotenv/config';

// ★問題2解決：コードから外部ライブラリを抽出するヘルパー関数
function extractDependencies(code) {
  // `import ... from 'package-name'` のパターンにマッチする正規表現
  // 相対パス(./, ../)やエイリアス(@/)で始まるものは除外する
  const dependencyRegex = /from\s+['"]((?![\.\/@])[^'"]+)['"]/g;
  const dependencies = new Set();
  let match;
  while ((match = dependencyRegex.exec(code)) !== null) {
    // ReactとNext.js関連のパッケージは元からあるので除外
    if (match[1] !== 'react' && !match[1].startsWith('next/')) {
      dependencies.add(match[1]);
    }
  }
  return Array.from(dependencies);
}


async function main() {
  let projectPath = ''; 

  try {
    const baseName = process.argv[2];
    if (!baseName) {
      throw new Error('プロジェクトのコンセプト名を指定してください。例: node index.js modern-portfolio');
    }

    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
    const finalDirName = `${baseName}-${timestamp}`;
    const generatedDir = path.join(process.cwd(), 'generated_projects');
    projectPath = path.join(generatedDir, finalDirName);

    await fs.mkdir(generatedDir, { recursive: true });

    // --- ステップ1：プロジェクトの自動生成 ---
    console.log(`[ステップ1/3] プロジェクトを作成します: ${projectPath}`);
    await new Promise((resolve, reject) => {
      const childProcess = spawn('npx', ['create-next-app', projectPath, '--ts', '--tailwind', '--eslint', '--src-dir', '--app', '--use-npm', '--no-git', '--import-alias', '"@/*"', '--no-turbopack'], { shell: true, stdio: 'inherit' });
      childProcess.on('error', reject);
      childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`プロセスがエラーコード ${code} で終了しました。`)));
    });
    console.log('✅ プロジェクトの骨組みが正常に作成されました！');

    // --- ステップ2：AIによるコード生成 ---
    console.log('\n[ステップ2/3] AIにUIコードの生成を依頼します...');
    const v0 = vercel('v0-1.5-md');
    const prompt = `You are an expert web developer. Based on the concept "${baseName}", generate a single React component for a Next.js App Router page. The code should be a single TSX file content. Do not include any explanation, just the code. Use TypeScript and Tailwind CSS.`;
    const { text: rawCode } = await generateText({ model: v0, prompt: prompt });
    
    // ★問題1解決：Markdownコードブロックを除去
    const cleanedCode = rawCode.replace(/^```tsx\n?/, '').replace(/\n?```$/, '');
    console.log('✅ AIがコードを生成し、クリーンアップしました。');

    // --- ★ステップ3：依存関係の自動インストールとファイル書き込み ---
    console.log('\n[ステップ3/3] 依存関係の解決とファイル書き込み...');
    
    // ★問題2解決：依存関係を抽出
    const dependencies = extractDependencies(cleanedCode);
    if (dependencies.length > 0) {
      console.log(`  必要な追加ライブラリを検出しました: ${dependencies.join(', ')}`);
      console.log('  npm install を実行します...');
      await new Promise((resolve, reject) => {
        // `cwd`オプションで、生成されたプロジェクト内でコマンドを実行する
        const childProcess = spawn('npm', ['install', ...dependencies], { cwd: projectPath, shell: true, stdio: 'inherit' });
        childProcess.on('error', reject);
        childProcess.on('close', code => code === 0 ? resolve() : reject(new Error(`npm installプロセスがエラーコード ${code} で終了しました。`)));
      });
      console.log('✅ 追加ライブラリのインストールが完了しました。');
    } else {
      console.log('  追加の外部ライブラリは不要です。');
    }
    
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    await fs.writeFile(pagePath, cleanedCode);
    console.log(`✅ 生成したコードを ${pagePath} に書き込みました。`);

    // --- 完了 ---
    console.log('\n🎉🎉🎉 すべての処理が完了しました！ 🎉🎉🎉');
    console.log('プロジェクトが完全に準備できました！');
    console.log(`   プロジェクト場所: ${projectPath}`);
    console.log('\n次のコマンドで開発サーバーを起動できます:');
    console.log(`cd ${projectPath} && npm run dev`);


  } catch (error) {
    console.error('\n❌ プロジェクトの作成中にエラーが発生しました。');
    // (エラー処理は変更なし)
    console.error('--- エラー詳細 ---');
    console.error(error.message);
    console.error('--------------------');
    if (projectPath) {
      try {
        console.log(`作成に失敗したディレクトリをクリーンアップします: ${projectPath}`);
        await fs.rm(projectPath, { recursive: true, force: true });
        console.log('🧹 クリーンアップが完了しました。');
      } catch (cleanupError) {
        console.error('クリーンアップ中に別のエラーが発生しました:', cleanupError);
      }
    }
  }
}

main();