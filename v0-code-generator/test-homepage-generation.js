#!/usr/bin/env node

/**
 * V0 API統合ホームページ生成のテストスクリプト
 */

import { generateHomepage, industryDefaults } from './lib/homepage-generator.js';
import 'dotenv/config';

async function testHomepageGeneration() {
  console.log('🧪 V0統合ホームページ生成テスト開始');
  console.log('=====================================\n');

  // テストケース1: 基本的なビジネスサイト
  console.log('📋 テストケース1: 基本的なビジネスサイト');
  try {
    const result1 = await generateHomepage({
      projectName: 'test-business-site',
      siteName: 'ABC コンサルティング',
      siteDescription: 'プロフェッショナルなビジネスコンサルティングサービスを提供',
      industry: 'business',
      style: 'professional',
      features: ['hero section', 'services', 'about us', 'testimonials', 'contact']
    });

    if (result1.success) {
      console.log('✅ ビジネスサイト生成成功');
      console.log(`   プロジェクト: ${result1.projectName}`);
      console.log(`   パス: ${result1.projectPath}`);
      console.log(`   起動コマンド: ${result1.devCommand}\n`);
    } else {
      console.error('❌ ビジネスサイト生成失敗:', result1.error);
    }
  } catch (error) {
    console.error('❌ テストケース1エラー:', error.message);
  }

  // テストケース2: テクノロジー系サイト
  console.log('📋 テストケース2: テクノロジー系サイト');
  try {
    const result2 = await generateHomepage({
      projectName: 'test-tech-startup',
      siteName: 'TechFlow Solutions',
      siteDescription: '最新のAI技術を活用したソフトウェア開発会社',
      industry: 'technology',
      style: 'modern-tech',
      features: industryDefaults.technology.features
    });

    if (result2.success) {
      console.log('✅ テクノロジーサイト生成成功');
      console.log(`   プロジェクト: ${result2.projectName}`);
      console.log(`   パス: ${result2.projectPath}`);
      console.log(`   依存関係: ${result2.dependencies.join(', ') || 'なし'}\n`);
    } else {
      console.error('❌ テクノロジーサイト生成失敗:', result2.error);
    }
  } catch (error) {
    console.error('❌ テストケース2エラー:', error.message);
  }

  // テストケース3: クリエイティブ系サイト
  console.log('📋 テストケース3: クリエイティブ系サイト');
  try {
    const result3 = await generateHomepage({
      projectName: 'test-creative-studio',
      siteName: 'Creative Canvas Studio',
      siteDescription: 'デザインとアートの力で新しい価値を創造するクリエイティブスタジオ',
      industry: 'creative',
      style: 'artistic',
      features: ['hero section', 'portfolio showcase', 'creative services', 'about artists', 'contact']
    });

    if (result3.success) {
      console.log('✅ クリエイティブサイト生成成功');
      console.log(`   プロジェクト: ${result3.projectName}`);
      console.log(`   サイト名: ${result3.siteName}`);
      console.log(`   業界: ${result3.industry} | スタイル: ${result3.style}\n`);
    } else {
      console.error('❌ クリエイティブサイト生成失敗:', result3.error);
    }
  } catch (error) {
    console.error('❌ テストケース3エラー:', error.message);
  }

  console.log('🎯 V0統合ホームページ生成テスト完了');
  console.log('=====================================');
}

// API エンドポイントテスト
async function testHomepageAPI() {
  console.log('\n🔌 Homepage API エンドポイントテスト開始');
  console.log('=======================================\n');

  const baseUrl = 'http://localhost:3000'; // Next.js dev server
  
  try {
    // GET テスト
    console.log('📡 GET /api/homepage テスト...');
    const getResponse = await fetch(`${baseUrl}/api/homepage`);
    const getResult = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET エンドポイント正常');
      console.log('   サポート業界:', getResult.supported_industries?.join(', '));
      console.log('   サポートスタイル:', getResult.supported_styles?.join(', '));
    } else {
      console.error('❌ GET エンドポイントエラー:', getResult.error);
    }
    
    // POST テスト
    console.log('\n📡 POST /api/homepage テスト...');
    const postData = {
      project_name: 'api-test-site',
      site_name: 'API Test Company',
      site_description: 'API経由で生成されたテストサイト',
      industry: 'technology',
      style: 'modern',
      features: ['hero section', 'about', 'services', 'contact'],
      user_id: 'test-user-123'
    };
    
    const postResponse = await fetch(`${baseUrl}/api/homepage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });
    
    const postResult = await postResponse.json();
    
    if (postResponse.ok) {
      console.log('✅ POST エンドポイント正常');
      console.log('   生成プロジェクト:', postResult.project?.project_name);
      console.log('   プロジェクトID:', postResult.project?.id);
    } else {
      console.error('❌ POST エンドポイントエラー:', postResult.error);
    }
    
  } catch (error) {
    console.error('❌ API テストエラー:', error.message);
    console.log('💡 注意: このテストを実行するには、開発サーバーが起動している必要があります');
    console.log('   起動コマンド: cd ai-lp-generator && npm run dev');
  }
  
  console.log('\n🎯 Homepage API テスト完了');
  console.log('==============================');
}

// メイン実行関数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--api-only')) {
    await testHomepageAPI();
  } else if (args.includes('--generation-only')) {
    await testHomepageGeneration();
  } else {
    // 両方実行
    await testHomepageGeneration();
    await testHomepageAPI();
  }
}

// 実行
main().catch(error => {
  console.error('🚨 テスト実行エラー:', error);
  process.exit(1);
});

console.log('');
console.log('📖 使用方法:');
console.log('  node test-homepage-generation.js            # 全テスト実行');
console.log('  node test-homepage-generation.js --generation-only  # 生成テストのみ');
console.log('  node test-homepage-generation.js --api-only         # API テストのみ');
console.log('');