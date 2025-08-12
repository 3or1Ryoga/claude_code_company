import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, MessageSquare, Zap, Users, Clock, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'フライター - チャットで簡単ホームページ・プレスリリース作成',
  description: 'デジタルマーケティングの複雑さを解決。チャットと数クリックでホームページとプレスリリースを作成。専門知識不要で事業成長を支援します。',
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#0067C0]">Flighter</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="#features" className="text-gray-700 hover:text-[#0067C0] px-3 py-2 text-sm font-medium">機能</Link>
                <Link href="#pricing" className="text-gray-700 hover:text-[#0067C0] px-3 py-2 text-sm font-medium">料金</Link>
                <Link href="#faq" className="text-gray-700 hover:text-[#0067C0] px-3 py-2 text-sm font-medium">FAQ</Link>
                <Link href="#contact" className="bg-[#0067C0] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">お問い合わせ</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0067C0] to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">フライター</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">チャットと数クリックで、ホームページとプレスリリースを最短最速で作成</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-[#FBB161] text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center">
                今すぐ始める <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-[#0067C0] transition-colors">
                デモを見る
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">こんなお悩みありませんか？</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-red-500 mb-4">
                <Clock className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-4">時間とコストがかかる</h3>
              <p className="text-gray-600">ホームページ制作やプレスリリースだけでも、時間とコストがかかり、専門知識も必要です。</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-red-500 mb-4">
                <Zap className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-4">ツールが多すぎる</h3>
              <p className="text-gray-600">デジタルマーケティングは複雑で、ツールが多すぎて何が最適なのか分かりません。</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-red-500 mb-4">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-4">成果が出ない</h3>
              <p className="text-gray-600">多くのツールを使いこなすのは難しく、結局は成果が出ずに終わってしまう…</p>
            </div>
          </div>
        </div>
      </section>

      {/* Affinity Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">私たちが理解しています</h2>
            <p className="text-lg text-gray-600 mb-8">
              私たちは長年、関西の中小企業様向けに受託開発を行ってきました。その経験から、中小企業様が抱えるデジタルマーケティングの課題を深く理解しています。
            </p>
            <p className="text-lg text-gray-600">
              複雑な作業を簡素化し、本当に必要な機能だけを提供することで、皆様の事業成長を支援します。
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-[#0067C0] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">シンプルな解決策</h2>
            <p className="text-xl text-blue-100 mb-8">チャットと数クリックだけで、ホームページとプレスリリースの作成を完了できます。</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-start">
                  <MessageSquare className="h-8 w-8 text-[#FBB161] mr-4 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">チャットで簡単操作</h3>
                    <p className="text-blue-100">専門知識は一切不要！自然な会話でサイトを作成できます。</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-8 w-8 text-[#FBB161] mr-4 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">数クリックで完了</h3>
                    <p className="text-blue-100">面倒な作業は全てフライターにお任せください。</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Star className="h-8 w-8 text-[#FBB161] mr-4 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">プロ品質の仕上がり</h3>
                    <p className="text-blue-100">効果的なデザインと集客力のあるコンテンツを自動生成。</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 p-8 rounded-lg">
              <div className="bg-white/20 p-6 rounded-lg mb-4">
                <p className="text-sm">💬 どんなホームページを作りたいですか？</p>
              </div>
              <div className="bg-[#FBB161] text-gray-900 p-6 rounded-lg mb-4">
                <p className="text-sm">美容院のホームページを作りたいです。温かみのあるデザインで...</p>
              </div>
              <div className="bg-white/20 p-6 rounded-lg">
                <p className="text-sm">✨ 素敵な美容院サイトを作成しました！</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">デザインが苦手でも大丈夫！</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              フライターは、あなたの事業の「意味」からデザインを考えます。あなたの想いを伝え、集客に繋がる効果的なホームページとプレスリリースを制作します。
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">こんな方に最適</h3>
            <p className="text-gray-600 mb-6">デザインに時間をかけたくない、でも効果的な発信をしたい…そんなあなたに最適なサービスです。</p>
            <button className="bg-[#FBB161] text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-colors">
              無料で試してみる
            </button>
          </div>
        </div>
      </section>

      {/* Narrowing Down Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">こんな方におすすめ</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-[#0067C0] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">新規事業開発中の方</h3>
              <p className="text-gray-600">アイデアを素早く形にして、市場に投入したい方</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-[#0067C0] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">独立予定の方</h3>
              <p className="text-gray-600">これから独立して事業を始めたい方</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-[#0067C0] text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">中小企業経営者</h3>
              <p className="text-gray-600">「早く事業をみんなに見せたい！」と考えている方</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-lg text-gray-600 mb-8">既存の受託会社や様々なツールに時間を奪われている方、今すぐフライターを試してみませんか？</p>
          </div>
        </div>
      </section>

      {/* Action Section */}
      <section className="py-20 bg-gradient-to-r from-[#0067C0] to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">まだ時間とコストをかけていますか？</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            それならフライターで、最短最速でホームページとプレスリリースを作り、事業を加速させましょう！
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#FBB161] text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-400 transition-colors">
              今すぐ始める
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}