import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages 部署路径处理
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',

  // 转译 webtex-cn 源码（ES modules）
  transpilePackages: ['webtex-cn'],

  experimental: {
    turbopack: {
      resolveAlias: {
        'webtex-cn': '../../webtex-cn',
      },
    },
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
