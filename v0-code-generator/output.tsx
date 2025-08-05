// ```tsx
// 'use client'

// import { Coffee, Clock, Star } from 'lucide-react'

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
//       {/* Header */}
//       <header className="bg-amber-900 text-cream shadow-lg">
//         <div className="container mx-auto px-6 py-8">
//           <div className="flex items-center justify-center space-x-4">
//             <Coffee className="w-12 h-12 text-amber-200" />
//             <h1 className="text-5xl font-bold text-amber-100 font-serif tracking-wide">
//               カフェ・ノスタルジア
//             </h1>
//             <Coffee className="w-12 h-12 text-amber-200" />
//           </div>
//           <p className="text-center text-amber-200 mt-4 text-lg font-light">
//             〜 昭和の香り漂う、心温まる喫茶店 〜
//           </p>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="container mx-auto px-6 py-12">
//         {/* Welcome Section */}
//         <section className="text-center mb-16">
//           <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-200">
//             <h2 className="text-3xl font-bold text-amber-900 mb-6 font-serif">
//               ようこそ、カフェ・ノスタルジアへ
//             </h2>
//             <p className="text-lg text-amber-800 leading-relaxed max-w-3xl mx-auto">
//               昭和の懐かしい雰囲気に包まれた当店では、丁寧に淹れたコーヒーと手作りのスイーツで、
//               お客様に心安らぐひとときをお過ごしいただけます。レトロな音楽が流れる店内で、
//               ゆっくりとした時間をお楽しみください。
//             </p>
//           </div>
//         </section>

//         {/* Today's Specials */}
//         <section className="mb-16">
//           <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl shadow-xl p-8 border border-amber-300">
//             <div className="flex items-center justify-center mb-8">
//               <Star className="w-8 h-8 text-amber-600 mr-3" />
//               <h2 className="text-4xl font-bold text-amber-900 font-serif">
//                 本日のおすすめ
//               </h2>
//               <Star className="w-8 h-8 text-amber-600 ml-3" />
//             </div>
            
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {/* Special Item 1 */}
//               <div className="bg-white/90 rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
//                 <div className="flex items-center mb-4">
//                   <Coffee className="w-6 h-6 text-amber-700 mr-2" />
//                   <h3 className="text-xl font-bold text-amber-900">ブレンドコーヒー</h3>
//                 </div>
//                 <p className="text-amber-700 mb-3">
//                   厳選された豆を使用した、深いコクと香りが自慢の自家製ブレンド
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-2xl font-bold text-amber-900">¥450</span>
//                   <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
//                     人気No.1
//                   </span>
//                 </div>
//               </div>

//               {/* Special Item 2 */}
//               <div className="bg-white/90 rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
//                 <div className="flex items-center mb-4">
//                   <Clock className="w-6 h-6 text-amber-700 mr-2" />
//                   <h3 className="text-xl font-bold text-amber-900">手作りチーズケーキ</h3>
//                 </div>
//                 <p className="text-amber-700 mb-3">
//                   毎朝焼き上げる、なめらかで濃厚な味わいのニューヨークスタイル
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-2xl font-bold text-amber-900">¥380</span>
//                   <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
//                     本日限定
//                   </span>
//                 </div>
//               </div>

//               {/* Special Item 3 */}
//               <div className="bg-white/90 rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl transition-shadow">
//                 <div className="flex items-center mb-4">
//                   <Star className="w-6 h-6 text-amber-700 mr-2" />
//                   <h3 className="text-xl font-bold text-amber-900">昭和プリン</h3>
//                 </div>
//                 <p className="text-amber-700 mb-3">
//                   懐かしい味わいの固めプリン。ほろ苦いカラメルソースが絶品
//                 </p>
//                 <div className="flex justify-between items-center">
//                   <span className="text-2xl font-bold text-amber-900">¥320</span>
//                   <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
//                     おすすめ
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Store Info */}
//         <section className="text-center">
//           <div className="bg-amber-900 text-amber-100 rounded-2xl shadow-xl p-8">
//             <h2 className="text-2xl font-bold mb-4 font-serif">営業時間</h2>
//             <div className="flex items-center justify-center space-x-2 text-lg">
//               <Clock className="w-5 h-5" />
//               <span>平日 8:00 - 20:00 | 土日祝 9:00 - 21:00</span>
//             </div>
//             <p className="mt-4 text-amber-200">
//               定休日：毎週火曜日（祝日の場合は営業）
//             </p>
//           </div>
//         </section>
//       </main>

//       {/* Footer */}
//       <footer className="bg-amber-900 text-amber-200 py-8 mt-16">
//         <div className="container mx-auto px-6 text-center">
//           <p className="text-lg font-serif">
//             カフェ・ノスタルジア - あなたの心の故郷
//           </p>
//           <p className="mt-2 text-amber-300">
//             〒123-4567 東京都渋谷区○○町1-2-3 | TEL: 03-1234-5678
//           </p>
//         </div>
//       </footer>
//     </div>
//   )
// }
// ```