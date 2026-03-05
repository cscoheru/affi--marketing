import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack instead of Turbopack for Module Federation compatibility
  // experimental: {
  //   turbo: undefined,
  // },

  webpack(config, { isServer }) {
    // Module Federation configuration
    // We need Vue to be available for the remote components
    // Don't externalize Vue - let it be bundled

    if (!isServer) {
      // Ensure Vue is resolved correctly
      config.resolve.alias.vue = require.resolve('vue');
    }

    return config;
  },

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
