<Thinking>
I need to create a modern, professional landing page based on the PASONA framework with the provided Japanese content. Let me break down the requirements:

1. **Problem (問題提起)**: 時間がない中で効果的にマーケティングしたい (Want to do effective marketing without enough time)
2. **Affinity (親近感)**: 自分も関西で受託会社をしていて、そのような悩みをサポートしてきたし、実際に感じている (I also run a contracting company in Kansai and have supported such concerns and actually feel them)
3. **Solution (解決策)**: AIを活用した自動化ツールによって、チャットだけでLP制作とマーケティングを自動化できる (AI-powered automation tools that can automate LP creation and marketing with just chat)
4. **Offer (提案)**: 年額49800円で受託企業よりも安価で保守運用まで (Annual fee of 49,800 yen, cheaper than contracting companies, including maintenance and operation)
5. **Narrowing down (絞込み)**: 関西にいる中小企業経営者や事業を新しく始めた人で、デジタルマーケティングをしたいけど、難しいかた (Small and medium-sized business owners in Kansai or those who have newly started businesses and want to do digital marketing but find it difficult)
6. **Action (行動)**: いますぐ09066656240に電話して相談予約しましょう (Call 09066656240 right now to schedule a consultation)

I need to create a single React component for Next.js App Router with:
- TypeScript and Tailwind CSS
- Responsive design
- Modern design with proper spacing, colors, and typography
- Following PASONA framework sequence
- Strong call-to-action buttons
- Conversion-optimized layout

The structure should be:
1. Hero section with Problem
2. Affinity section
3. Solution section
4. Offer section
5. Narrowing down section
6. Action section with strong CTA

I'll use a modern color scheme, proper typography hierarchy, and ensure it's mobile-responsive.
</Thinking>

```tsx
'use client'

import { Phone, CheckCircle, Clock, Target, Zap, Users } from 'lucide-react'

export default function LandingPage() {
  const handleCallClick = () => {
    window.location.href = 'tel:09066656240'
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Problem */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Clock className="w-16 h-16 mx-auto mb-6 text-orange-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            時間がない中で<br />
            <span className="text-orange-400">効果的なマーケティング</span><br />
            をしたいあなたへ
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-300 leading-relaxed">
            忙しい経営者が抱える最大の悩み...<br />
            「マーケティングの重要性は分かるけど、時間も知識もない」
          </p>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 max-w-2xl mx-auto">
            <p className="text-lg text-slate-200">
              ✓ LP制作に何ヶ月もかかる<br />
              ✓ 高額な制作費用<br />
              ✓ 効果が出るか分からない不安
            </p>
          </div>
        </div>
      </section>

      {/* Affinity Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              私も同じ悩みを抱えていました
            </h2>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  関西で受託会社を経営する私だからこそ分かる
                </h3>
                <p className="text-lg text-slate-700 leading-relaxed">
                  私自身も関西で受託開発会社を運営しており、多くのクライアント様から同様のご相談を受けてきました。
                  そして実際に、自社のマーケティングでも同じ課題に直面してきたのです。
                </p>
                <div className="mt-6 grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">関西企業の実情を理解</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">同じ悩みを実体験</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              AIが全てを自動化します
            </h2>
            <p className="text-xl text-slate-600">
              チャットするだけで、LP制作からマーケティングまで完全自動化
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">チャットで要望伝達</h3>
              <p className="text-slate-600">
                難しい専門用語は不要。普通の会話でご要望をお聞かせください。
              </p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">AI自動生成</h3>
              <p className="text-slate-600">
                最新のAI技術が、あなたの業界に最適化されたLPを自動生成。
              </p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">📈</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">自動最適化</h3>
              <p className="text-slate-600">
                データに基づいて継続的に改善。常に最高のパフォーマンスを維持。
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-xl">
            <h3 className="text-2xl font-bold mb-4 text-center">従来の方法 vs AI自動化</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-3 text-red-300">❌ 従来の方法</h4>
                <ul className="space-y-2 text-slate-300">
                  <li>• 制作期間：2-3ヶ月</li>
                  <li>• 費用：30-100万円</li>
                  <li>• 修正：追加費用発生</li>
                  <li>• 運用：別途契約必要</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-3 text-green-300">✅ AI自動化</h4>
                <ul className="space-y-2 text-slate-300">
                  <li>• 制作期間：即日〜1週間</li>
                  <li>• 費用：年額49,800円</li>
                  <li>• 修正：無制限対応</li>
                  <li>• 運用：全て込み</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-orange-600" />
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            驚きの価格で全てをご提供
          </h2>
          
          <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-orange-200 max-w-2xl mx-auto mb-8">
            <div className="text-center">
              <div className="text-sm text-slate-500 mb-2">通常価格 300,000円〜</div>
              <div className="text-6xl font-bold text-orange-600 mb-2">
                ¥49,800
                <span className="text-2xl text-slate-600">/年</span>
              </div>
              <div className="text-lg text-slate-700 mb-6">
                月額わずか4,150円で全てコミコミ
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">LP制作・デザイン</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">サーバー・ドメイン管理</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">SEO対策・アクセス解析</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">無制限修正・更新</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700">24時間サポート</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-lg">
            <p className="text-lg">
              <span className="font-bold text-orange-400">受託企業の1/10の価格</span>で、
              制作から運用まで全てをカバー
            </p>
          </div>
        </div>
      </section>

      {/* Narrowing Down Section */}
      <section className="py-16 px-4 bg-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 text-center">
            こんな関西の経営者様におすすめです
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🏢</span>
                中小企業経営者の方
              </h3>
              <ul className="space-y-2 text-slate-700">
                <li>• 大阪、京都、神戸、奈良、和歌山、滋賀在住