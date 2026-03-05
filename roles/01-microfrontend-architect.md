# 任务卡: 01-微前端架构师

> **角色**: 微前端架构师
> **项目**: Affi-Marketing 前端整合
> **工期**: 5-7天
> **优先级**: 🔴 最高 (第一优先级)
> **依赖**: 无

---

## 🎯 任务目标

搭建Next.js主项目框架，配置Webpack Module Federation，实现Vue组件作为远程模块的加载机制。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/roles/00-project-overview.md` | 项目总览，了解整体架构 |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/docs/ARCHITECTURE.md` | 现有系统架构 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/docs/SYSTEM_INTEGRATION_PLAN.md` | 整合方案设计 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-content-auto-nextv0/next.config.ts` | 参考现有Next.js配置 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/frontend/vite.config.ts` | 参考现有Vue配置 |

**注意**:
- 标记为 `[只读]` 的文件只能读取，不能修改
- 所有新代码创建在 `frontend-unified/` 目录下

---

## 📁 你的工作目录

```
/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/
│
├── app/                    ← 你需要创建
│   ├── layout.tsx          ← 统一根布局 (基础版本)
│   └── page.tsx            ← 首页 (重定向)
│
├── components/             ← 你需要创建
│   ├── vue-component-loader.tsx    ← Vue组件加载器
│   └── ui/                 ← shadcn/ui基础组件
│
├── lib/                    ← 你需要创建
│   └── utils.ts            ← 工具函数
│
├── package.json            ← 你需要创建
├── next.config.ts          ← 你需要创建 (Module Federation配置)
├── tsconfig.json           ← 你需要创建
├── tailwind.config.ts      ← 你需要创建
└── globals.css             ← 你需要创建 (基础主题)
```

---

## 🔧 具体任务

### 任务1: 创建Next.js主项目 (Day 1-2)

**文件**: `frontend-unified/package.json`

```json
{
  "name": "affi-marketing-unified",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^15.0.0",
    "@module-federation/nextjs-mf": "latest",
    "zustand": "latest",
    "vue": "^3.5.0",
    "@vue/runtime-dom": "latest"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@module-federation/utilities": "latest"
  }
}
```

**文件**: `frontend-unified/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    // Module Federation配置
    if (!isServer) {
      config.externals = {
        ...config.externals,
        'vue': 'vue',
        '@vue/runtime-dom': '@vue/runtime-dom'
      }
    }

    return config
  }
}

export default nextConfig
```

### 任务2: 创建Vue组件加载器 (Day 3-4)

**文件**: `frontend-unified/components/vue-component-loader.tsx`

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface VueComponentLoaderProps {
  componentUrl: string
  componentName: string
  props?: Record<string, any>
}

/**
 * Vue组件加载器
 * 用于在React应用中动态加载Vue组件
 */
export function VueComponentLoader({
  componentUrl,
  componentName,
  props = {}
}: VueComponentLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let app: any = null

    async function loadVueComponent() {
      try {
        setLoading(true)

        // 动态加载Vue组件 (这里需要根据实际Vue构建产物调整)
        const response = await fetch(componentUrl)
        if (!response.ok) throw new Error(`Failed to load: ${componentUrl}`)

        // 创建Vue应用实例
        const { createApp } = await import('vue')
        // 注意: 实际实现需要根据Vue组件的打包格式调整
        const component = await import(/* @vite-ignore */ componentUrl)

        app = createApp(component.default || component, props)
        app.mount(containerRef.current!)

        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
        setLoading(false)
      }
    }

    loadVueComponent()

    return () => {
      if (app) app.unmount()
    }
  }, [componentUrl, componentName, props])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">组件加载失败: {error}</div>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}
```

### 任务3: 创建基础布局结构 (Day 5)

**文件**: `frontend-unified/app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Affi-Marketing - 联盟营销管理平台',
  description: '统一的联盟营销管理平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
```

**文件**: `frontend-unified/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* 基础色彩系统 */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;

    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;

    --muted: 240 3.8% 46.1%;
    --muted-foreground: 240 5% 64.9%;

    --border: 240 5.9% 90%;
    --radius: 0.5rem;

    /* 侧边栏色彩 */
    --sidebar-background: 240 10% 96%;
    --sidebar-foreground: 240 5.9% 10%;
    --sidebar-border: 240 5.9% 90%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 任务4: 创建工具函数 (Day 6)

**文件**: `frontend-unified/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## ✅ 完成标准

- [ ] `frontend-unified/` 目录创建完成
- [ ] `package.json` 配置正确，依赖安装成功
- [ ] `next.config.ts` Module Federation配置完成
- [ ] `vue-component-loader.tsx` 创建完成
- [ ] 基础布局和样式创建完成
- [ ] 项目可以启动 (`npm run dev`)
- [ ] 在浏览器访问 `http://localhost:3000` 可以看到页面

---

## 📤 交付物

完成后，请更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 01-微前端架构师 - 基础框架搭建
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- frontend-unified/package.json: 项目配置
- frontend-unified/next.config.ts: Module Federation配置
- frontend-unified/components/vue-component-loader.tsx: Vue组件加载器
- frontend-unified/app/layout.tsx: 根布局
- frontend-unified/app/globals.css: 全局样式

**测试结果**:
- [ ] npm run dev 启动成功
- [ ] 浏览器访问 localhost:3000 正常显示

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [01-微前端架构师] [问题简述]
**提出时间**: YYYY-MM-DD
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要其他角色提供信息: (角色名 - 信息内容)
- [ ] 需要外部资源: (描述)

**状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD
**解决方案**: ...
```

---

## 📞 协作提示

1. **02-React前端工程师** 需要你的Module Federation配置才能开始工作
2. 完成后通知项目经理，项目进度将更新
3. 遇到技术难题优先查阅文档，无法解决时写入问题文件

---

**任务卡版本**: v1.0
**创建时间**: 2026-03-05
