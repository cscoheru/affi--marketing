# Vue迁移架构设计文档

**文档版本**: v1.0
**创建日期**: 2026-03-05
**创建角色**: 03-Vue迁移工程师
**审核状态**: ✅ 项目经理已审核通过

---

## 1. 概述

### 1.1 目标

将现有的Vue 3单页应用改造为Module Federation远程模块，使其能够在Next.js 14主应用中动态加载运行。

### 1.2 范围

**Phase 1 (核心)**: 6个控制台组件
- Dashboard.vue - 仪表板
- Experiments.vue - 实验列表
- ExperimentDetail.vue - 实验详情
- Plugins.vue - 插件管理
- Analytics.vue - 数据分析
- Settlements.vue - 结算管理

**Phase 2 (可选)**: 2个博客组件
- BlogView.vue
- BlogArticleView.vue

---

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 主应用 (Host)                    │
│                  端口: 3000 (开发)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  VueComponentLoader                                 │   │
│  │  - 动态import Vue远程模块                            │   │
│  │  - 错误边界处理                                     │   │
│  │  - Props传递                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                  │
│                          ▼ PostMessage                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Zustand Store                                      │   │
│  │  - useAuthStore (认证状态)                          │   │
│  │  - useUIStore (UI状态)                              │   │
│  │  - localStorage同步                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vue 远程模块 (Remote)                   │
│                   端口: 5174 (开发)                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Module Federation 配置                             │   │
│  │  - name: 'vueRemote'                                │   │
│  │  - filename: 'remoteEntry.js'                       │   │
│  │  - exposes: 6个Wrapper组件                          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Wrapper 组件层                                     │   │
│  │  ├── DashboardWrapper.vue                           │   │
│  │  ├── ExperimentsWrapper.vue                         │   │
│  │  ├── ExperimentDetailWrapper.vue                    │   │
│  │  ├── PluginsWrapper.vue                             │   │
│  │  ├── AnalyticsWrapper.vue                           │   │
│  │  └── SettlementsWrapper.vue                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Pinia Store + Bridge                               │   │
│  │  - useBridgeStore (React通信)                       │   │
│  │  - useExperimentStore (实验数据)                    │   │
│  │  - PostMessage监听                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  主题适配                                            │   │
│  │  - CSS变量覆盖Element Plus                          │   │
│  │  - 支持亮色/暗色模式                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
frontend/                              # Vue 远程模块
├── src/
│   ├── wrappers/                     # Wrapper组件层 (新建)
│   │   ├── DashboardWrapper.vue
│   │   ├── ExperimentsWrapper.vue
│   │   ├── ExperimentDetailWrapper.vue
│   │   ├── PluginsWrapper.vue
│   │   ├── AnalyticsWrapper.vue
│   │   └── SettlementsWrapper.vue
│   │
│   ├── stores/                       # Pinia状态管理
│   │   ├── bridge.ts                 # React通信桥接 (新建)
│   │   └── useExperimentStore.ts     # 现有实验状态
│   │
│   ├── styles/                       # 样式
│   │   └── theme.css                 # 主题适配 (新建)
│   │
│   ├── views/                        # 原始Vue组件 (保持不变)
│   │   ├── Dashboard.vue
│   │   ├── Experiments.vue
│   │   └── ...
│   │
│   └── main.ts                       # 入口文件
│
├── vite.config.ts                    # Module Federation配置 (修改)
├── package.json                      # 添加@module-federation/vite
└── dist/                             # 构建产物
    └── remoteEntry.js                # Module Federation入口

frontend-unified/                     # Next.js 主应用
├── components/
│   └── vue-component-loader.tsx      # 已存在
├── app/(dashboard)/
│   ├── dashboard/page.tsx            # 使用VueComponentLoader
│   ├── experiments/page.tsx
│   └── ...
└── next.config.ts                    # 已配置Vue externals
```

---

## 3. 核心组件设计

### 3.1 Wrapper组件模板

每个Vue组件都有一个对应的Wrapper，负责：
1. 接收标准Props (user, token, apiBaseUrl)
2. 转发事件给React父组件
3. 处理组件生命周期

```vue
<!-- src/wrappers/DashboardWrapper.vue -->
<template>
  <div class="vue-dashboard-wrapper">
    <DashboardView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import DashboardView from '../views/Dashboard.vue'

// 标准Props接口
interface Props {
  user: UserInfo | null
  token: string | null
  apiBaseUrl: string
}

const props = defineProps<Props>()

// 标准事件接口
const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

// PostMessage通信
const notifyParent = (type: string, payload: any) => {
  if (window.parent !== window) {
    window.parent.postMessage({
      source: 'vue-app',
      type,
      payload
    }, '*')
  }
}

const handleMounted = () => {
  emit('mounted')
  notifyParent('mounted', { component: 'Dashboard' })
}

const handleError = (error: Error) => {
  emit('error', error)
  notifyParent('error', { message: error.message })
}
</script>

<style scoped>
.vue-dashboard-wrapper {
  width: 100%;
  height: 100%;
}
</style>
```

### 3.2 状态同步桥接 (Bridge Store)

```typescript
// src/stores/bridge.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useBridgeStore = defineStore('bridge', () => {
  // 状态
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // 从localStorage恢复
  const hydrate = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      isAuthenticated.value = true
    }
  }

  // 监听来自React的消息
  const setupReactListener = () => {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data.source !== 'react-app') return

      switch (event.data.type) {
        case 'auth:login':
          token.value = event.data.payload.token
          user.value = event.data.payload.user
          isAuthenticated.value = true
          localStorage.setItem('auth_token', event.data.payload.token)
          localStorage.setItem('auth_user', JSON.stringify(event.data.payload.user))
          break
        case 'auth:logout':
          token.value = null
          user.value = null
          isAuthenticated.value = false
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          break
        case 'data:refresh':
          handleDataRefresh(event.data.payload.dataType)
          break
      }
    })
  }

  // 向React发送消息
  const sendToReact = (type: string, payload: any) => {
    if (window.parent !== window) {
      window.parent.postMessage({
        source: 'vue-app',
        type,
        payload
      }, '*')
    }
  }

  // 监听状态变化，同步到React
  watch(
    () => [token.value, user.value],
    ([newToken, newUser]) => {
      sendToReact('auth:state', {
        authenticated: !!newToken,
        token: newToken,
        user: newUser
      })
    },
    { deep: true }
  )

  return {
    user,
    token,
    isAuthenticated,
    hydrate,
    setupReactListener,
    sendToReact
  }
})
```

### 3.3 主题适配

```css
/* src/styles/theme.css */

/* Next.js CSS变量 */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --border: 240 5.9% 90%;
  --radius: 0.5rem;
}

/* Element Plus组件适配 */
.el-button--primary {
  --el-button-bg-color: hsl(var(--primary));
  --el-button-border-color: hsl(var(--primary));
  --el-button-text-color: hsl(var(--primary-foreground));
}

.el-card {
  --el-card-bg-color: hsl(var(--card));
  --el-card-border-color: hsl(var(--border));
  border-radius: var(--radius);
}

.el-input__wrapper {
  --el-input-bg-color: hsl(var(--background));
  --el-input-border-color: hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
}

.el-table {
  --el-table-bg-color: hsl(var(--background));
  --el-table-border-color: hsl(var(--border));
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 7%;
    --border: 240 3.7% 15.9%;
  }
}
```

---

## 4. Module Federation配置

### 4.1 Vue远程模块配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@module-federation/vite'

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'vueRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './Dashboard': './src/wrappers/DashboardWrapper.vue',
        './Experiments': './src/wrappers/ExperimentsWrapper.vue',
        './ExperimentDetail': './src/wrappers/ExperimentDetailWrapper.vue',
        './Plugins': './src/wrappers/PluginsWrapper.vue',
        './Analytics': './src/wrappers/AnalyticsWrapper.vue',
        './Settlements': './src/wrappers/SettlementsWrapper.vue',
      },
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '^3.5.0',
        },
        pinia: {
          singleton: true,
          requiredVersion: '^3.0.0',
        },
      },
    }),
  ],
  server: {
    port: 5174,
    cors: true,
    origin: 'http://localhost:3000',
  },
  build: {
    target: 'esnext',
  },
})
```

### 4.2 Next.js配置 (已存在)

```typescript
// frontend-unified/next.config.ts
async rewrites() {
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        source: '/vue-remote/:path*',
        destination: 'http://localhost:5174/:path*',
      },
    ]
  } else {
    return [
      {
        source: '/vue-remote/:path*',
        destination: process.env.VUE_REMOTE_URL || 'https://hub.zenconsult.top/vue-remote/:path*',
      },
    ]
  }
}
```

---

## 5. 组件接口规范

### 5.1 Props接口

```typescript
interface ComponentProps {
  user: UserInfo | null           // 用户信息
  token: string | null            // 认证令牌
  apiBaseUrl: string              // API基础URL
}
```

### 5.2 事件接口

```typescript
interface ComponentEvents {
  mounted: () => void             // 组件挂载完成
  error: (error: Error) => void   // 错误事件
  dataRefresh: (data: any) => void // 数据刷新
}
```

### 5.3 PostMessage格式

```typescript
// Vue → React
{
  source: 'vue-app'
  type: 'mounted' | 'error' | 'auth:state' | 'routeChange'
  payload: any
}

// React → Vue
{
  source: 'react-app'
  type: 'auth:login' | 'auth:logout' | 'data:refresh'
  payload: any
}
```

---

## 6. 部署配置

### 6.1 开发环境

| 服务 | 端口 | URL |
|------|------|-----|
| Next.js | 3000 | http://localhost:3000 |
| Vue Remote | 5174 | http://localhost:5174 |

### 6.2 生产环境

| 服务 | URL |
|------|-----|
| Next.js | https://hub.zenconsult.top |
| Vue Remote | https://hub.zenconsult.top/vue-remote/ |

---

## 7. 测试策略

### 7.1 单元测试

- Wrapper组件Props传递
- Bridge Store状态同步
- PostMessage通信

### 7.2 集成测试

- Vue组件在Next.js中加载
- 认证状态同步
- 主题样式一致性

### 7.3 E2E测试

- 完整用户流程
- 跨框架状态同步
- 错误恢复机制

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Vue多实例警告 | 样式冲突 | singleton: true配置 |
| PostMessage丢失 | 状态不一致 | localStorage双重同步 |
| CSS变量覆盖不完整 | 视觉不一致 | 逐步适配核心组件 |
| Module Federation加载失败 | 组件不可用 | 错误边界 + 降级处理 |

---

## 9. 实施时间线

| Day | 任务 | 产出 |
|-----|------|------|
| 1 | 配置Vite + Module Federation | `vite.config.ts` |
| 2 | 创建Vue组件Wrapper (6个) | `src/wrappers/*` |
| 3 | 实现状态同步层 | `src/stores/bridge.ts` |
| 4 | 适配统一主题 | `src/styles/theme.css` |
| 5 | 测试Vue组件加载 | 开发环境验证 |
| 6 | 构建Vue远程模块 | `dist/remoteEntry.js` |
| 7 | 部署到生产环境 | `hub.zenconsult.top/vue-remote/` |

---

**文档版本**: v1.0
**创建日期**: 2026-03-05
**审核状态**: ✅ 项目经理已审核通过
**下一步**: 调用 writing-plans 技能创建详细实施计划
