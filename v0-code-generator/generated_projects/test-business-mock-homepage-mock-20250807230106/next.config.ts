import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化設定
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // パフォーマンス最適化
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    scrollRestoration: true,
  },
  
  // コンパイル最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 出力設定
  output: 'standalone',
  
  // PWA対応準備
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
