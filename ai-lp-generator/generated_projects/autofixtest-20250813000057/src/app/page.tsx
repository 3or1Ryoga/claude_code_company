import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AutoFixTest - 酒井涼雅のホームページ',
  description: 'ウェブサイト制作やデジタルマーケティングで成果が出ず、お困りではありませんか？10年以上の経験を持つプロフェッショナルがワンストップでサポートします。',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-sky-400">酒井涼雅のホームページ</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">ホーム</Link>
                <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">サービス</Link>
                <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">ポートフォリオ</Link>
                <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">ブログ</Link>
                <Link href="#" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">お問い合わせ</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
            AutoFixTest
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            デジタルマーケティングのプロフェッショナルが<br />
            あなたのビジネスを次のステージへ導きます
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#contact" className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg">
              無料相談を予約する
            </Link>
            <Link href="#solution" className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
              詳しく見る
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-red-400">
            こんなお悩みはありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold mb-3">集客に繋がらない</h3>
              <p className="text-gray-300">ウェブサイトはあるが、思うような集客効果が得られていない</p>
            </div>
            <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
              <div className="text-red-400 text-4xl mb-4">💸</div>
              <h3 className="text-xl font-semibold mb-3">費用対効果が悪い</h3>
              <p className="text-gray-300">マーケティングに投資しているが、期待した成果が出ない</p>
            </div>
            <div className="bg-slate-700/50 p-6 rounded-lg border border-slate-600">
              <div className="text-red-400 text-4xl mb-4">📉</div>
              <h3 className="text-xl font-semibold mb-3">時代遅れになっている</h3>
              <p className="text-gray-300">最新の技術や手法が分からず、競合に遅れを取っている</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-xl text-gray-300">
              多くの企業が抱える課題は、<span className="text-red-400 font-semibold">戦略の欠如と適切な実行の不足</span>です。
            </p>
          </div>
        </div>
      </section>

      {/* Affinity Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-sky-400">
            あなたは成長を求める経営者です
          </h2>
          <div className="bg-gradient-to-r from-sky-500/10 to-purple-500/10 p-8 rounded-lg border border-sky-500/20">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              あなたは、ビジネスを成長させたいと強く願う、熱意のある経営者、マーケター、または事業責任者の方です。
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              現状維持ではなく、積極的に変化を捉え、デジタル時代における競争優位性を確立したいと考えています。
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              効率的で効果的なマーケティング戦略を求めており、<span className="text-sky-400 font-semibold">信頼できる専門家のサポート</span>を必要としています。
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-400">
            プロフェッショナルによる包括的ソリューション
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-green-500/20 to-sky-500/20 p-8 rounded-lg border border-green-500/30">
                <h3 className="text-2xl font-bold mb-4 text-green-400">酒井涼雅の強み</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    10年以上の豊富な経験
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    最新技術と実績に基づいた戦略立案
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    効果測定まで含むワンストップサポート
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    持続的な成長を実現する長期視点
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                酒井涼雅は、10年以上の経験を持つデジタルマーケティングのプロフェッショナルです。
              </p>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                最新技術と実績に基づいた戦略立案から、効果測定まで、ワンストップでサポートいたします。
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                貴社のビジネス目標を達成するための最適なソリューションを提供し、ウェブサイトの改善、集客戦略の強化、そして<span className="text-green-400 font-semibold">持続的な成長を実現</span>します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-purple-400">
            まずは無料相談から始めましょう
          </h2>
          <div className="bg-gradient-to-r from-purple-500/10 to-sky-500/10 p-8 rounded-lg border border-purple-500/20 mb-8">
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-6">
              まずは、無料相談をご利用ください。貴社の現状と課題を詳しくお伺いし、最適な戦略を提案させていただきます。
            </p>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
              相談後、ご希望に応じて、ウェブサイト制作、SEO対策、SNSマーケティング、広告運用など、様々なサービスをご提供します。
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">戦略立案</h3>
              <p className="text-gray-300">明確な目標設定と効果測定を通じた戦略策定</p>
            </div>
            <div className="bg-slate-700/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">実行支援</h3>
              <p className="text-gray-300">ウェブサイト制作からマーケティング運用まで</p>
            </div>
            <div className="bg-slate-700/50 p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-xl font-semibold mb-3 text-purple-400">効果測定</h3>
              <p className="text-gray-300">投資対効果の高いマーケティングを実現</p>
            </div>
          </div>
        </div>
      </section>

      {/* Narrowing Down Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-yellow-400">
            他社との違い
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-8 rounded-lg border border-yellow-500/30">
              <h3 className="text-2xl font-bold mb-4 text-yellow-400">戦略の緻密さ</h3>
              <p className="text-gray-300 leading-relaxed">
                単なる制作・運用ではなく、貴社のビジネス成長のパートナーとして、長期的な視点で共に歩んでまいります。
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-8 rounded-lg border border-orange-500/30">
              <h3 className="text-2xl font-bold mb-4 text-orange-400">継続的なサポート体制</h3>
              <p className="text-gray-300 leading-relaxed">
                具体的な成果を約束する、結果重視のサービスです。効果測定と改善を継続的に行います。
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-xl text-gray-300">
              <span className="text-yellow-400 font-semibold">結果重視</span>で、あなたのビジネスパートナーとして長期的に
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}