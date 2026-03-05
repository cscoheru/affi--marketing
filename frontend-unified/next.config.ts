import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 开发环境代理Vue远程模块（生产环境不需要，Vue文件在public目录）
  async rewrites() {
    // 只在开发环境使用 rewrites
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
