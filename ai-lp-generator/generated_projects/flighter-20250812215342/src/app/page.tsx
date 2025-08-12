import { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle, Zap, Target, TrendingUp, Users, CheckCircle, Mail, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Flighter - AIチャットでデジタルマーケティングを簡単に',
  description: 'AIとチャットするだけで、保守運用可能な事業ホームページを構築し、デジタルマーケティングを支援するサービス',
}

export default function FlighterLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm z-50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">Flighter</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="#features" className="text-gray-300 hover:text-white transition-colors">機能</Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">料金</Link>
                <Link href="#faq" className="text-gray-300 hover:text-white transition-colors">よくある質問</Link>
                <Link href="#contact" className="text-gray-300 hover:text-white transition-colors">お問い合わせ</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">Flighter</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            AIとチャットするだけで、保守運用可能な事業ホームページを構築し、デジタルマーケティングを支援するサービス
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              今すぐ始める
            </button>
            <button className="border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              詳細を見る
            </button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">こんな課題はありませんか？</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">ツールが多すぎる</h3>
              <p className="text-gray-300">ホームページ作成、SEO対策、広告運用…それぞれに専門知識が必要で使いこなせない</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">時間とコストがかかる</h3>
              <p className="text-gray-300">デジタルマーケティングには多大な時間とコストが必要で、中小企業には大きな負担</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">効果が出ない</h3>
              <p className="text-gray-300">結局、効果が出ずに終わってしまうことも多く、投資が無駄になってしまう</p>
            </div>
          </div>
        </div>
      </section>

      {/* Affinity Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">私たちの想い</h2>
          <p className="text-xl text-gray-300 leading-relaxed">
            関西で受託開発を行い、多くの素晴らしい中小企業と関わってきました。しかし、その素晴らしいプロダクトやサービスが、顧客に十分に届いていないという課題を痛感しました。技術力はあるのに、マーケティングの壁に阻害されている企業が多いのです。
          </p>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Flighterの解決策</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              AIとチャットするだけで、保守運用可能な事業ホームページを構築し、デジタルマーケティングを支援するサービスです
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <MessageCircle className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">AIチャット機能</h3>
              <p className="text-gray-300">専門知識がなくても、AIとチャットするだけで簡単にホームページを作成</p>
            </div>
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <Zap className="w-12 h-12 text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold mb-4">自動保守運用</h3>
              <p className="text-gray-300">作成後の保守運用も自動化され、継続的なメンテナンスが不要</p>
            </div>
            <div className="bg-black p-6 rounded-lg border border-gray-800">
              <Target className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-4">効果的なマーケティング</h3>
              <p className="text-gray-300">SEO対策から広告運用まで、効果的なマーケティング施策を自動実行</p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            チャットだけで、あなたのプロダクトの<br />
            <span className="text-yellow-500">デジタルマーケティング</span>をしませんか？
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Flighterを使えば、複雑な作業を簡素化し、時間とコストを大幅に削減できます。売上アップを目指し、事業を成長させましょう！
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">90%</div>
              <p className="text-gray-300">時間削減</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">70%</div>
              <p className="text-gray-300">コスト削減</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-2">3倍</div>
              <p className="text-gray-300">売上向上</p>
            </div>
          </div>
        </div>
      </section>

      {/* Narrowing Down Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">こんな方におすすめ</h2>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <p className="text-lg text-gray-300">関西圏の中小企業の経営者様</p>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <p className="text-lg text-gray-300">これから独立して事業を始めようとする方</p>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <p className="text-lg text-gray-300">デジタルマーケティングに課題を感じている方</p>
            </div>
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <p className="text-lg text-gray-300">技術力はあるがマーケティングが苦手な方</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">料金プラン</h2>
            <p className="text-xl text-gray-300">あなたのビジネスに最適なプランをお選びください</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
              <h3 className="text-2xl font-bold mb-4">スタータープラン</h3>
              <div className="text-4xl font-bold mb-6">¥29,800<span className="text-lg text-gray-400">/月</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />基本ホームページ作成</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />AIチャットサポート</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" />基本SEO対策</li>
              </ul>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors">
                プランを選択
              </button>
            </div>
            <div className="bg-blue-600 p-8 rounded-lg border-2 border-yellow-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold">
                おすすめ
              </div>
              <h3 className="text-2xl font-bold mb-4">ビジネスプラン</h3>
              <div className="text-4xl font-bold mb-6">¥59,800<span className="text-lg text-blue-200">/月</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-400 mr-2" />高機能ホームページ作成</li>
                <li className="flex items-center