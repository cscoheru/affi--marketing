import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置允许的图片域名
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // 开发环境代理Vue远程模块（生产环境不需要，Vue文件在public目录）
  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/vue-remote/:path*',
          destination: 'http://localhost:5174/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
