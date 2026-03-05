# 任务卡: 03-Vue迁移工程师

> **角色**: Vue迁移工程师
> **项目**: Affi-Marketing 前端整合
> **工期**: 7-10天
> **优先级**: 🟡 中
> **依赖**: 02-React前端工程师完成统一布局和主题

---

## 🎯 任务目标

将现有Vue控制台和博客组件改造为微前端模块，使其能够在Next.js统一界面中加载运行。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/COLLABORATION.md` | 协作机制 ⭐ |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 确认02角色已完成 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/docs/ARCHITECTURE.md` | 系统架构 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/components/unified-sidebar.tsx` | 了解统一布局结构 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/components/vue-component-loader.tsx` | 了解Vue组件加载机制 |
| 6 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/lib/store.ts` | 了解Zustand状态管理 |
| 7 | `/Users/kjonekong/Documents/Affi-Marketing/frontend/src/views/Dashboard.vue` | 需要迁移的Vue组件 |
| 8 | `/Users/kjonekong/Documents/Affi-Marketing/frontend/src/stores/useExperimentStore.ts` | 参考Pinia状态管理 |

**重要**: 首先阅读 `COLLABORATION.md` 了解协作机制。确认02-React前端已完成统一布局，再开始工作。

---

## 📁 你的工作目录

```
frontend/                          ← 现有Vue项目 (需要改造)
│
├── src/
│   ├── views/                     ← 需要改造的Vue组件
│   │   ├── Dashboard.vue          ← 需要改造
│   │   ├── Experiments.vue        ← 需要改造
│   │   ├── ExperimentDetail.vue   ← 需要改造
│   │   ├── Plugins.vue            ← 需要改造
│   │   ├── Analytics.vue          ← 需要改造
│   │   ├── Settlements.vue        ← 需要改造
│   │   ├── BlogView.vue           ← 需要改造
│   │   └── BlogArticleView.vue    ← 需要改造
│   │
│   ├── components/                ← Vue组件
│   ├── stores/                    ← Pinia状态管理
│   └── main.ts                    ← 入口文件
│
├── vite.config.ts                 ← 需要改造 (Module Federation)
└── package.json                   ← 需要更新依赖

frontend-unified/vue-remote/       ← 你需要创建 (Vue远程模块输出)
│
├── components/                    ← 改造后的Vue组件
│   ├── Dashboard.vue
│   ├── Experiments.vue
│   └── ...
│
└── entry.js                       ← Module Federation入口
```

---

## 🔧 具体任务

### 任务1: 改造Vue项目配置 (Day 1-2)

**文件**: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'vueConsole',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/views/Dashboard.vue',
        './Experiments': './src/views/Experiments.vue',
        './ExperimentDetail': './src/views/ExperimentDetail.vue',
        './Plugins': './src/views/Plugins.vue',
        './Analytics': './src/views/Analytics.vue',
        './Settlements': './src/views/Settlements.vue',
        './BlogView': './src/views/BlogView.vue',
        './BlogArticleView': './src/views/BlogArticleView.vue',
      },
      shared: ['vue', 'pinia', 'vue-router', 'element-plus'],
    }),
  ],
  build: {
    target: 'esnext',
  },
})
```

**文件**: `frontend/package.json` (更新依赖)

```json
{
  "dependencies": {
    "@module-federation/vite": "latest",
    "vue": "^3.5.0",
    "pinia": "^3.0.0",
    "vue-router": "^4.0.0",
    "element-plus": "^2.13.0"
  }
}
```

### 任务2: 创建Vue组件Wrapper (Day 2-3)

由于Vue组件需要在React环境中加载，需要创建包装器：

**文件**: `frontend/src/wrappers/DashboardWrapper.vue`

```vue
<template>
  <div class="vue-dashboard-wrapper">
    <DashboardView />
  </div>
</template>

<script setup lang="ts">
import DashboardView from '../views/Dashboard.vue'
import { onMounted, onUnmounted } from 'vue'

// 与React父组件通信
const emit = defineEmits(['mounted', 'unmounted'])

onMounted(() => {
  emit('mounted')
})

onUnmounted(() => {
  emit('unmounted')
})

// 暴露方法给React
defineExpose({
  refresh: () => {
    // 刷新数据的方法
  }
})
</script>

<style scoped>
.vue-dashboard-wrapper {
  width: 100%;
  height: 100%;
}
</style>
```

为每个Vue组件创建类似的Wrapper。

### 任务3: 适配统一主题 (Day 3-4)

Vue组件需要适配统一的主题系统。修改Vue组件使用CSS变量：

**文件**: `frontend/src/styles/theme.css`

```css
/* 使用与Next.js相同的CSS变量 */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --muted: 240 3.8% 46.1%;
  --muted-foreground: 240 5% 64.9%;
  --border: 240 5.9% 90%;
  --radius: 0.5rem;
}

/* Element Plus组件适配 */
.el-button--primary {
  background-color: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.el-card {
  border-color: hsl(var(--border));
  border-radius: var(--radius);
}
```

### 任务4: 创建状态同步层 (Day 4-5)

Vue和React需要共享状态。创建桥接层：

**文件**: `frontend/src/stores/bridge.ts`

```typescript
import { defineStore } from 'pinia'
import { watch } from 'vue'

export const useBridgeStore = defineStore('bridge', () => {
  // 从React接收的用户状态
  const user = ref<any>(null)
  const token = ref<string | null>(null)

  // 监听来自React的消息
  onMounted(() => {
    window.addEventListener('message', handleParentMessage)
  })

  const handleParentMessage = (event: MessageEvent) => {
    if (event.data.type === 'auth:state') {
      user.value = event.data.user
      token.value = event.data.token
    }
  }

  // 发送消息给React
  const sendMessage = (type: string, payload: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({ type, ...payload }, '*')
    }
  }

  return {
    user,
    token,
    sendMessage
  }
})
```

### 任务5: 改造核心Vue组件 (Day 5-7)

#### Dashboard.vue

确保组件能够独立渲染，不依赖Vue Router的全局状态：

```vue
<template>
  <div class="dashboard-container">
    <h1>仪表板</h1>
    <!-- 组件内容 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// 使用本地状态或通过props接收
const stats = ref([])

onMounted(async () => {
  // 加载数据
  await loadStats()
})

const loadStats = async () => {
  // API调用
}
</script>

<style scoped>
.dashboard-container {
  padding: 1.5rem;
}
</style>
```

#### Experiments.vue

```vue
<template>
  <div class="experiments-container">
    <h1>实验管理</h1>
    <!-- 实验列表 -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const experiments = ref([])

// 组件逻辑
</script>
```

### 任务6: 构建Vue远程模块 (Day 7)

```bash
cd frontend
npm run build
```

确保输出以下文件：
- `dist/remoteEntry.js` - Module Federation入口
- `dist/assets/*.js` - 组件代码

### 任务7: 部署Vue远程模块 (Day 7-8)

将构建产物部署到可访问的URL：
- 选项1: 部署到 `https://hub.zenconsult.top/vue-remote/`
- 选项2: 使用CDN
- 选项3: 本地开发服务器代理

### 任务8: 更新Next.js配置 (Day 8)

**文件**: `frontend-unified/next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
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

### 任务9: 测试Vue组件加载 (Day 8-9)

在Next.js中测试加载Vue组件：

**文件**: `frontend-unified/app/(dashboard)/dashboard/page.tsx`

```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <div className="h-[calc(100vh-200px)] border rounded">
        <VueComponentLoader
          componentUrl="http://localhost:3000/vue-remote/Dashboard.js"
          componentName="Dashboard"
          props={{
            user: { name: 'Admin' }
          }}
        />
      </div>
    </div>
  )
}
```

### 任务10: 博客Vue组件迁移 (Day 9-10)

将博客Vue组件 `BlogView.vue` 和 `BlogArticleView.vue` 进行类似改造。

---

## ✅ 完成标准

- [ ] Vue项目配置Module Federation完成
- [ ] 所有Vue组件创建Wrapper
- [ ] Vue组件适配统一主题
- [ ] 状态同步层创建完成
- [ ] Vue远程模块构建成功
- [ ] Vue远程模块可以部署访问
- [ ] Next.js可以加载Vue组件
- [ ] Vue和React状态可以同步
- [ ] 所有Vue页面在Next.js中正常显示

---

## 📤 交付物

完成后，请更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 03-Vue迁移工程师 - Vue微应用改造
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- frontend/vite.config.ts: Module Federation配置
- frontend/src/wrappers/*: Vue组件Wrapper
- frontend/src/styles/theme.css: 主题适配
- frontend/src/stores/bridge.ts: 状态桥接
- frontend/dist/: 构建产物
- frontend-unified/next.config.ts: 更新Vue模块配置

**测试结果**:
- [ ] Vue组件可以在Next.js中加载
- [ ] 状态同步正常
- [ ] 主题样式统一

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [03-Vue迁移] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要01-架构师确认: (具体问题)
- [ ] 需要02-React前端提供: (具体信息)

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 📞 协作提示

1. 你需要 **02-React前端** 完成统一布局后才能开始工作
2. 完成Vue组件改造后，更新 `PROJECT_PROGRESS.md` 通知其他角色
3. **05-集成测试与部署** 需要你的Vue组件才能进行集成测试
4. 遇到Vue组件无法加载时，检查构建产物和网络请求

---

## 🚀 快速启动

```bash
# Vue项目
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
npm run dev

# 构建远程模块
npm run build
```

---

**任务卡版本**: v2.0
**创建时间**: 2026-03-05
**更新时间**: 2026-03-05

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/03-vue-migration.md"
