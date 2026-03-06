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
    const rewrites: any[] = [];

    // 开发环境 Vue 代理
    if (process.env.NODE_ENV !== 'production') {
      rewrites.push({
        source: '/vue-remote/:path*',
        destination: 'http://localhost:5174/:path*',
      });
    }

    // 博客独立站点模式：将根路径映射到 /blog-public
    if (process.env.IS_BLOG_SITE === 'true') {
      rewrites.push(
        {
          source: '/',
          destination: '/blog-public',
        },
        {
          source: '/:slug',
          destination: '/blog-public/:slug',
        },
        {
          source: '/category/:slug',
          destination: '/blog-public/category/:slug',
        }
      );
    }

    return rewrites;
  },
};

export default nextConfig;
