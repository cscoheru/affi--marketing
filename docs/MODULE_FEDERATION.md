# Module Federation 配置规范

**版本**: v1.0
**创建时间**: 2026-03-05
**维护者**: 01-架构师

---

## 概述

本项目使用 Module Federation 实现微前端架构，Next.js 作为主应用 (Host)，Vue 作为远程模块 (Remote)。这种架构允许：
- 独立开发和部署各个模块
- 共享依赖避免重复加载
- 运行时动态加载模块

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 主应用 (Host)                    │
│                  端口: 3000 (开发)                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ React 页面    │  │ React 页面    │  │ Vue 远程模块   │     │
│  │ (产品管理)    │  │ (内容管理)    │  │ (控制台)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                  │           │
│                                          动态加载            │
└──────────────────────────────────────────────┼───────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vue 远程模块 (Remote)                     │
│                   端口: 5174 (开发)                          │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │Dashboard │  │Experiment│  │ Analytics│                │
│  │ 组件      │  │ 组件      │  │ 组件      │                │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Next.js (Host) 配置

### next.config.ts

**文件**: `frontend-unified/next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    // Module Federation - Vue externals
    config.externals = config.externals || [];
    config.externals.push({
      'vue': 'vue',
    });

    if (!isServer) {
      config.resolve.alias.vue = require.resolve('vue');
    }

    return config;
  },

  // 开发环境代理 Vue 远程模块
  async rewrites() {
    return [
      {
        source: '/vue-remote/:path*',
        destination: 'http://localhost:5174/:path*',
      },
    ];
  },
};

export default nextConfig;
```

### 配置说明

| 配置项 | 作用 |
|--------|------|
| `externals` | 将 Vue 标记为外部依赖，避免打包 |
| `resolve.alias` | 客户端解析 Vue 路径 |
| `rewrites` | 开发环境代理 Vue 模块请求 |

### 生产环境配置

生产环境需要将 `rewrites` 替换为实际的 Vue 远程模块 URL：

```typescript
async rewrites() {
  if (process.env.NODE_ENV === 'production') {
    return [
      {
        source: '/vue-remote/:path*',
        destination: process.env.VUE_REMOTE_URL || 'https://vue.example.com/:path*',
      },
    ];
  }
  // 开发环境配置...
}
```

---

## Vue (Remote) 配置

### 安装依赖

```bash
npm install @module-federation/vite -D
```

### vite.config.ts

**文件**: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import moduleFederation from '@module-federation/vite'

export default defineConfig({
  plugins: [
    vue(),
    moduleFederation({
      name: 'vueRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/components/Dashboard.vue',
        './ExperimentList': './src/components/ExperimentList.vue',
        './Analytics': './src/components/Analytics.vue',
      },
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.4.0',
        },
      },
    }),
  ],
  server: {
    port: 5174,
    cors: true, // 允许跨域请求
  },
  build: {
    target: 'esnext',
  },
})
```

### 配置说明

| 配置项 | 作用 |
|--------|------|
| `name` | 远程模块名称 |
| `filename` | 入口文件名 |
| `exposes` | 暴露的组件映射 |
| `shared` | 共享依赖配置 |
| `cors` | 允许跨域请求 |
| `port` | 开发服务器端口 (避免与 Vite 默认 5173 冲突) |

---

## 加载方式

### 方式 1: 动态 import (推荐)

```typescript
// Next.js 页面中动态加载 Vue 组件
async function loadVueComponent() {
  const module = await import('/vue-remote/remoteEntry.js')
  const Dashboard = module('./Dashboard')
  return Dashboard
}
```

### 方式 2: 使用 VueComponentLoader

```tsx
import { VueComponentLoader } from '@/components/vue-component-loader'

export default function DashboardPage() {
  return (
    <VueComponentLoader
      componentUrl="http://localhost:5174/remoteEntry.js"
      componentName="Dashboard"
      props={{ user, token, apiBaseUrl }}
    />
  )
}
```

### 方式 3: 预加载

```typescript
// 在布局文件中预加载 Vue 远程模块
export default function RootLayout({ children }) {
  useEffect(() => {
    import('/vue-remote/remoteEntry.js')
  }, [])

  return <div>{children}</div>
}
```

---

## 共享依赖配置

### 共享 Vue 版本

为确保 Host 和 Remote 使用同一版本的 Vue，需要配置共享依赖：

**Next.js 端**:
```typescript
// package.json
{
  "dependencies": {
    "vue": "^3.4.0"
  }
}
```

**Vue 端**:
```typescript
// vite.config.ts
shared: {
  vue: {
    singleton: true,      // 确保只加载一个实例
    requiredVersion: '^3.4.0',
    eager: false,         // 按需加载
  },
}
```

### 共享其他依赖

```typescript
shared: {
  vue: { singleton: true },
  'pinia': { singleton: true },
  'axios': { singleton: true },
  // ...
}
```

---

## 类型安全支持

### 生成类型声明

**文件**: `frontend/vite.config.ts`

```typescript
import moduleFederation from '@module-federation/vite'

export default defineConfig({
  plugins: [
    moduleFederation({
      // ...
      types: {
        generateTypes: true,
        outputDir: 'types',
      },
    }),
  ],
})
```

### 在 Next.js 中使用类型

```typescript
// frontend-unified/types/vue-remote.d.ts
declare module '/vue-remote/*' {
  export const Dashboard: DefineComponent<any>
  export const ExperimentList: DefineComponent<any>
  export const Analytics: DefineComponent<any>
}
```

---

## 开发环境设置

### 1. 启动顺序

```bash
# 终端 1: 启动 Vue 远程模块
cd frontend
npm run dev

# 终端 2: 启动 Next.js 主应用
cd frontend-unified
npm run dev
```

### 2. 环境变量

**文件**: `.env.development`

```bash
# Vue 远程模块 URL
VUE_REMOTE_URL=http://localhost:5174

# API 基础 URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| Next.js | 3000 | 主应用 |
| Vue (Vite) | 5174 | 远程模块 |
| Go Backend | 8080 | API 服务 |
| AI Service | 8000 | AI 服务 |

---

## 生产环境部署

### 部署架构

```
                    ┌─────────────────┐
                    │   用户浏览器      │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Next.js App    │
                    │  (Vercel/Aliyun) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Vue Remote     │
                    │  (CDN/OSS)       │
                    └──────────────────┘
```

### 构建命令

```bash
# 构建 Vue 远程模块
cd frontend
npm run build

# 构建 Next.js 主应用
cd frontend-unified
npm run build
```

### 部署配置

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/vue-remote/:path*",
      "destination": "https://vue-cdn.example.com/:path*"
    }
  ]
}
```

**阿里云 OSS**:
1. 将 Vue 构建产物上传到 OSS
2. 设置 CORS 规则允许跨域访问
3. 配置 CDN 加速

---

## 调试技巧

### 1. 检查远程模块加载

```typescript
// 浏览器控制台
const remote = await import('/vue-remote/remoteEntry.js')
console.log('Remote module:', remote)
```

### 2. 检查共享依赖

```typescript
// 在两个框架中分别执行
console.log('Vue version:', require('vue').version)
```

### 3. 网络请求检查

- 开发者工具 → Network
- 筛选 `remoteEntry.js` 和 `.vue` 文件
- 确认状态码 200

---

## 常见问题

### Q1: CORS 错误

**问题**: 浏览器阻止跨域请求

**解决**:
```typescript
// vite.config.ts
server: {
  cors: true,
  origin: 'http://localhost:3000'
}
```

### Q2: Vue 多实例警告

**问题**: "Multiple instances of Vue"

**解决**: 确保配置 `singleton: true` 并使用 externals

### Q3: 热更新不生效

**问题**: Vue 组件修改后 Next.js 中的组件不更新

**解决**: 重启开发服务器或清除 `.next` 缓存

---

**最后更新**: 2026-03-05
