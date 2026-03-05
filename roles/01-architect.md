# 角色任务卡: 系统架构师 (Architect)

> **角色**: 系统架构师
> **项目**: Affi-Marketing 前端整合与微前端架构
> **工期**: 8-12小时
> **优先级**: 🔴 最高
> **依赖**: 无

---

## 🎯 任务目标

设计前端微整合架构，定义Module Federation配置、组件接口规范和状态管理方案，为React和Vue前端工程师提供统一的架构基础。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/COLLABORATION.md` | 协作机制 ⭐ |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 了解项目状态 |

**重要**: 首先阅读 `COLLABORATION.md` 了解协作机制。

---

## 📁 你的工作目录

```
/Users/kjonekong/Documents/Affi-Marketing/
│
├── docs/                    ← 你需要创建 (架构文档)
│   ├── ARCHITECTURE.md       ← 前端整合架构
│   ├── MODULE_FEDERATION.md  ← Module Federation配置
│   ├── COMPONENT_API.md      ← 组件接口规范
│   └── STATE_MANAGEMENT.md   ← 状态管理方案
│
└── frontend-unified/         ← 你需要创建 (Next.js基础框架)
    ├── next.config.ts        ← Module Federation配置
    ├── package.json
    ├── tsconfig.json
    └── components/
        └── vue-component-loader.tsx ← Vue组件加载器
```

---

## 🔧 具体任务

### 任务1: 创建Next.js基础框架 (1h)

```bash
cd /Users/kjonekong/Documents/Affi-Marketing
npx create-next-app@latest frontend-unified --typescript --tailwind --app
```

### 任务2: 配置Module Federation (2-3h)

**文件**: `frontend-unified/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    // Module Federation 配置
    config.externals = config.externals || []
    config.externals.push({
      'vue': 'vue',
    })

    if (!isServer) {
      config.resolve.alias.vue = require.resolve('vue')
    }

    return config
  },

  // 开发环境代理Vue远程模块
  async rewrites() {
    return [
      {
        source: '/vue-remote/:path*',
        destination: 'http://localhost:5174/:path*',
      },
    ]
  },
}

export default nextConfig
```

**文件**: `docs/MODULE_FEDERATION.md`

```markdown
# Module Federation 配置规范

## 概述
本项目使用 Module Federation 实现微前端架构，Next.js作为主应用，Vue作为远程模块。

## 配置说明

### Next.js (Host)
- 使用 webpack externals 处理 Vue
- 配置 rewrites 代理 Vue 远程模块

### Vue (Remote)
- 使用 @module-federation/vite
- 暴露组件供 Next.js 加载

## 加载方式
使用动态 import 或自定义 VueComponentLoader 组件
```

### 任务3: 创建Vue组件加载器 (2h)

**文件**: `frontend-unified/components/vue-component-loader.tsx`

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface VueComponentLoaderProps {
  componentUrl: string
  componentName: string
  props?: Record<string, any>
}

export function VueComponentLoader({
  componentUrl,
  componentName,
  props = {}
}: VueComponentLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadVueComponent() {
      try {
        setLoading(true)
        setError(null)

        // 动态加载 Vue 组件
        const module = await import(/* @vite-ignore */ componentUrl)
        const component = module[componentName]

        if (!component) {
          throw new Error(`Component ${componentName} not found in module`)
        }

        // 挂载 Vue 组件到容器
        if (containerRef.current && mounted) {
          // 这里需要使用 Vue 的 mount API
          // 具体实现取决于 Vue 组件的打包方式
        }

        setLoading(false)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load component')
          setLoading(false)
        }
      }
    }

    loadVueComponent()

    return () => {
      mounted = false
    }
  }, [componentUrl, componentName])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  return <div ref={containerRef} className="vue-component-container" />
}
```

### 任务4: 定义组件接口规范 (2h)

**文件**: `docs/COMPONENT_API.md`

```markdown
# 组件接口规范

## Vue 组件 Props 规范

所有 Vue 组件必须接收以下标准 props：

### 通用 Props
- `user: UserInfo` - 当前用户信息
- `token: string` - 认证令牌
- `apiBaseUrl: string` - API 基础 URL

### 状态同步
Vue 组件需要实现：
1. 监听来自 React 的 postMessage
2. 通过 postMessage 向 React 发送事件

### 事件规范
- `auth:state` - 认证状态变化
- `data:change` - 数据变化
- `error` - 错误发生
```

### 任务5: 定义状态管理方案 (2h)

**文件**: `docs/STATE_MANAGEMENT.md`

```markdown
# 状态管理方案

## React 状态 (Zustand)
- useAuthStore - 认证状态
- useUIStore - UI 状态 (侧边栏等)
- useDataStore - 数据状态

## Vue 状态 (Pinia)
- useAuthStore - 认证状态 (与 React 同步)
- useExperimentStore - 实验数据

## 状态同步机制
1. 通过 postMessage 通信
2. 共享 localStorage (auth_token 等)
3. 通过 API 作为单一数据源
```

### 任务6: 创建架构文档 (1-2h)

**文件**: `docs/ARCHITECTURE.md`

```markdown
# Affi-Marketing 前端整合架构

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js 主应用                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  React 页面   │  │  React 页面   │  │  Vue 微应用   │     │
│  │  (产品管理)   │  │  (内容管理)   │  │  (控制台)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                        │                                   │
│              ┌───────────▼───────────┐                      │
│              │   统一布局 & 侧边栏    │                      │
│              │   (UnifiedSidebar)    │                      │
│              └───────────┬───────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   状态管理 (Zustand)  │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vue 远程模块                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Dashboard│  │Experiments│  │  Analytics│                │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 主应用 | Next.js 14, React 18, TypeScript |
| UI组件 | shadcn/ui, Tailwind CSS |
| 状态管理 | Zustand |
| 远程模块 | Vue 3, Vite, Module Federation |
| Vue UI | Element Plus |

## 目录结构

```
frontend-unified/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── login/page.tsx          # 登录页
│   ├── (dashboard)/            # Vue 微应用路由组
│   │   ├── layout.tsx          # 统一布局 (含侧边栏)
│   │   ├── dashboard/
│   │   ├── experiments/
│   │   └── analytics/
│   └── (content)/              # React 原生路由组
│       ├── layout.tsx          # 统一布局
│       ├── products/
│       └── materials/
├── components/
│   ├── unified-sidebar.tsx     # 统一侧边栏
│   ├── protected-route.tsx     # 路由保护
│   └── vue-component-loader.tsx # Vue 组件加载器
└── lib/
    ├── store.ts                # Zustand 状态管理
    └── api.ts                  # API 请求封装
```
```

---

## ✅ 完成标准

- [ ] Next.js 基础框架创建完成
- [ ] Module Federation 配置完成
- [ ] Vue 组件加载器创建完成
- [ ] 组件接口规范文档完成
- [ ] 状态管理方案文档完成
- [ ] 架构文档完成
- [ ] 所有文档清晰易懂，其他角色可以基于文档开始工作

---

## 📤 交付物

完成后，更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 01-架构师
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- docs/ARCHITECTURE.md: 系统架构文档
- docs/MODULE_FEDERATION.md: Module Federation 配置规范
- docs/COMPONENT_API.md: 组件接口规范
- docs/STATE_MANAGEMENT.md: 状态管理方案
- frontend-unified/next.config.ts: Next.js 配置
- frontend-unified/components/vue-component-loader.tsx: Vue 组件加载器
- frontend-unified/package.json: 项目依赖配置

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [01-架构师] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 📞 协作提示

1. 你是所有角色的基础，完成后立即更新 `PROJECT_PROGRESS.md`
2. **02-React前端** 和 **03-Vue迁移** 需要你的文档才能开始工作
3. 确保所有文档清晰完整，避免后续角色频繁询问

---

## 🚀 快速启动

```bash
cd /Users/kjonekong/Documents/Affi-Marketing
npx create-next-app@latest frontend-unified --typescript --tailwind --app
cd frontend-unified
npm run dev
```

---

**任务卡版本**: v2.0
**创建时间**: 2026-03-05
**更新时间**: 2026-03-05

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/01-architect.md"
