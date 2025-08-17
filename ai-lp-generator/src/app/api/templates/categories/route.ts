import { NextRequest, NextResponse } from 'next/server'
import { TemplateService, templateUtils } from '@/lib/templates'

export async function GET(request: NextRequest) {
  try {
    const templateService = new TemplateService()
    const templatesByCategory = await templateService.getTemplatesByCategory()
    
    // Add category metadata
    const categories = templateUtils.getAvailableCategories().map(categoryKey => {
      const templates = templatesByCategory[categoryKey] || []
      
      return {
        key: categoryKey,
        name: getCategoryDisplayName(categoryKey),
        description: getCategoryDescription(categoryKey),
        templateCount: templates.length,
        templates: templates.slice(0, 3) // Preview templates
      }
    })

    return NextResponse.json({
      success: true,
      data: categories,
      total: categories.length
    })

  } catch (error) {
    console.error('Error in GET /api/templates/categories:', error)
    return NextResponse.json(
      { error: 'カテゴリの取得に失敗しました' },
      { status: 500 }
    )
  }
}

function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    business: 'ビジネス',
    saas: 'SaaS',
    portfolio: 'ポートフォリオ',
    ecommerce: 'Eコマース',
    blog: 'ブログ',
    agency: 'エージェンシー',
    startup: 'スタートアップ',
    nonprofit: '非営利団体',
    education: '教育',
    custom: 'カスタム'
  }
  
  return names[category] || category
}

function getCategoryDescription(category: string): string {
  const descriptions: Record<string, string> = {
    business: '企業・法人向けの信頼性重視のテンプレート',
    saas: 'SaaSプロダクト向けのモダンで機能的なテンプレート',
    portfolio: 'クリエイター・個人向けの作品紹介テンプレート',
    ecommerce: 'オンラインショップ向けの販売促進テンプレート',
    blog: 'ブログ・メディア向けのコンテンツ重視テンプレート',
    agency: '代理店・サービス業向けのプロフェッショナルテンプレート',
    startup: 'スタートアップ向けの革新的でエネルギッシュなテンプレート',
    nonprofit: '非営利団体向けの社会貢献をアピールするテンプレート',
    education: '教育機関向けの学習・成長をサポートするテンプレート',
    custom: 'ユーザーが作成したオリジナルテンプレート'
  }
  
  return descriptions[category] || 'その他のテンプレート'
}