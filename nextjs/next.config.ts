import type { NextConfig } from "next";
import path from "path";

const webtexSrc = path.resolve(__dirname, '../../webtex-cn/src/index.js');

const nextConfig: NextConfig = {
  output: 'export',
  // Transpile webtex-cn source directly (local package)
  transpilePackages: ['webtex-cn'],
  // GitHub Pages 部署路径处理
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // Resolve alias for webtex-cn (Turbopack)
  experimental: {
    turbo: {
      resolveAlias: {
        'webtex-cn': webtexSrc,
      },
    },
  },

  // Resolve alias for webtex-cn (Webpack fallback)
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'webtex-cn': webtexSrc,
    };
    return config;
  },

  images: {
    unoptimized: true, // 静态导出需要禁用默认图片优化
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
