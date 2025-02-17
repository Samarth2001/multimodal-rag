import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Webpack config
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      path: false,
      stream: false,
      crypto: false
    };
    return config;
  },

  // Turbopack config
  experimental: {
    turbo: {
      resolveAlias: {
        
      }
    }
  },

  env: {
    BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ]
  }
}

export default nextConfig;