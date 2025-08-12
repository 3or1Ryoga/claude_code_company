#!/usr/bin/env node

/**
 * V0 API統合ホームページ生成のモックテストスクリプト
 * (VERCEL_API_KEY 不要バージョン)
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';

/**
 * モックV0レスポンス生成
 */
function generateMockHomepageCode(options) {
  const { siteName, siteDescription, industry, style } = options;
  
  return `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <h1 className="text-2xl font-bold text-gray-900">${siteName}</h1>
            </div>
            <nav className="hidden md:flex space-x-10">
              <a href="#about" className="text-base font-medium text-gray-500 hover:text-gray-900">About</a>
              <a href="#services" className="text-base font-medium text-gray-500 hover:text-gray-900">Services</a>
              <a href="#contact" className="text-base font-medium text-gray-500 hover:text-gray-900">Contact</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">${siteName}</span>
                  <span className="block text-indigo-600 xl:inline"> for ${industry}</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  ${siteDescription}
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <a href="#contact" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      Get Started
                    </a>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a href="#about" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      Learn More
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">About Us</h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              We specialize in ${industry} solutions with a ${style} approach.
            </p>
          </div>
          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Fast & Efficient</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Quick turnaround times with high-quality results.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Quality Assured</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Professional standards in every project we deliver.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-lg mx-auto md:max-w-none md:grid md:grid-cols-2 md:gap-8">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                Get in Touch
              </h2>
              <div className="mt-3">
                <p className="text-lg text-gray-500">
                  Ready to start your ${industry} project? Contact us today.
                </p>
              </div>
            </div>
            <div className="mt-12 sm:mt-16 md:mt-0">
              <form className="grid grid-cols-1 gap-y-6">
                <div>
                  <input type="text" placeholder="Your Name" className="block w-full shadow-sm py-3 px-4 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <input type="email" placeholder="Email" className="block w-full shadow-sm py-3 px-4 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <textarea rows={4} placeholder="Message" className="block w-full shadow-sm py-3 px-4 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              © 2024 ${siteName}. All rights reserved. Generated with V0 API Integration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}`;
}

/**
 * モック版ホームページ生成関数
 */
async function generateMockHomepage(options) {
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
    console.log(`[Mock V0 Homepage Generator] モック生成開始`);

    // タイムスタンプ付きプロジェクト名を生成
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
    
    const finalDirName = `${projectName}-homepage-mock-${timestamp}`;
    projectPath = path.join(outputDir, finalDirName);

    await fs.mkdir(outputDir, { recursive: true });

    // ステップ1：Next.jsプロジェクトを作成
    console.log(`[ステップ1/3] Next.jsプロジェクトを作成します: ${projectPath}`);
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

    // ステップ2：モックホームページコードを生成
    console.log(`\n[ステップ2/3] モックホームページコードを生成中...`);
    const mockCode = generateMockHomepageCode({
      siteName,
      siteDescription,
      industry,
      style
    });
    console.log('✅ モックホームページコードの生成が完了しました！');

    // ステップ3：生成したコードでページを置換
    console.log('\n[ステップ3/3] ホームページコードをファイルに書き込み...');
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    await fs.writeFile(pagePath, mockCode);
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
      mockGeneration: true,
      v0Model: 'mock-v0-1.5-md'
    };
    
    const infoPath = path.join(projectPath, 'project-info.json');
    await fs.writeFile(infoPath, JSON.stringify(projectInfo, null, 2));

    console.log('\n🎉🎉🎉 モック版V0統合ホームページ生成が完了しました！ 🎉🎉🎉');
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
      generatedCode: mockCode,
      dependencies: [],
      previewUrl: `http://localhost:3000`,
      devCommand: `cd ${projectPath} && npm run dev`,
      mockGeneration: true
    };

  } catch (error) {
    console.error('\n❌ モック版ホームページ生成中にエラーが発生しました。');
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
      mockGeneration: true
    };
  }
}

// テスト実行
async function runMockTest() {
  console.log('🧪 V0統合ホームページ生成モックテスト開始');
  console.log('==========================================\n');

  // テストケース1: ビジネスサイト
  console.log('📋 テストケース1: ビジネスサイト (モック版)');
  try {
    const result1 = await generateMockHomepage({
      projectName: 'test-business-mock',
      siteName: 'ABC コンサルティング',
      siteDescription: 'プロフェッショナルなビジネスコンサルティングサービスを提供',
      industry: 'business',
      style: 'professional',
      features: ['hero section', 'services', 'about us', 'testimonials', 'contact']
    });

    if (result1.success) {
      console.log('✅ ビジネスサイト生成成功 (モック版)');
      console.log(`   プロジェクト: ${result1.projectName}`);
      console.log(`   パス: ${result1.projectPath}`);
      console.log(`   起動コマンド: ${result1.devCommand}\n`);
    } else {
      console.error('❌ ビジネスサイト生成失敗:', result1.error);
    }
  } catch (error) {
    console.error('❌ テストケース1エラー:', error.message);
  }

  console.log('🎯 V0統合ホームページ生成モックテスト完了');
  console.log('==========================================');
}

// 実行
runMockTest().catch(error => {
  console.error('🚨 モックテスト実行エラー:', error);
  process.exit(1);
});