/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server external packages configuration (moved from experimental)
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Additional experimental features
  experimental: {
    // Future experimental features can be added here
  },
  
  // Performance optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  
  // Environment-specific port and host configuration
  ...(process.env.NODE_ENV === 'development' && {
    // Development server settings
    eslint: {
      ignoreDuringBuilds: false,
    },
    typescript: {
      ignoreBuildErrors: false,
    },
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,
  }),
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cisjwiegbvydbbjwpthz.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack optimizations for legacy support
  webpack: (config, { dev, isServer }) => {
    // Only include necessary webpack customizations
    if (!dev && !isServer) {
      // Optimize production bundle
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      }
    }
    
    return config
  },
  
  
  // React strict mode (recommended to always enable)
  reactStrictMode: true,
}

export default nextConfig;