# Vue迁移到Module Federation实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将Vue 3应用改造为Module Federation远程模块，使其能够在Next.js主应用中动态加载运行。

**架构:** 使用@module-federation/vite将Vue应用配置为远程模块，创建Wrapper组件层统一接口，通过PostMessage和localStorage实现与React/Zustand的状态同步。

**技术栈:** Vue 3, Vite, @module-federation/vite, Pinia, Element Plus, TypeScript, PostMessage API, CSS Variables

---

## 前置检查

### Task 0: 验证依赖和确认项目状态

**Files:**
- Check: `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`
- Check: `/Users/kjonekong/Documents/Affi-Marketing/frontend/package.json`

**Step 1: 确认02-React前端已完成**

Read: `PROJECT_PROGRESS.md`
Verify:
- 02-React前端状态为 ✅完成
- frontend-unified/ 目录存在
- vue-component-loader.tsx 文件存在

**Step 2: 检查Vue项目状态**

Run:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
ls -la
cat package.json
```

Verify:
- Vue 3项目存在
- 当前端口配置为 5173 (需要改为 5174)
- 没有安装 @module-federation/vite

**Step 3: 创建进度跟踪**

Create: `frontend/MIGRATION_PROGRESS.md`
```markdown
# Vue迁移进度追踪

开始时间: 2026-03-05

## 任务完成状态

- [ ] Task 1: 安装依赖
- [ ] Task 2: 配置Module Federation
- [ ] Task 3: 创建Wrapper目录
- [ ] Task 4: 创建DashboardWrapper
- [ ] Task 5: 创建ExperimentsWrapper
- [ ] Task 6: 创建ExperimentDetailWrapper
- [ ] Task 7: 创建PluginsWrapper
- [ ] Task 8: 创建AnalyticsWrapper
- [ ] Task 9: 创建SettlementsWrapper
- [ ] Task 10: 创建Bridge Store
- [ ] Task 11: 创建主题适配
- [ ] Task 12: 更新main.ts
- [ ] Task 13: 测试本地构建
- [ ] Task 14: 测试Next.js集成
```

---

## 阶段一: 配置Module Federation

### Task 1: 安装Module Federation依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装@module-federation/vite**

Run:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
npm install @module-federation/vite --save-dev
```

Expected: package.json 中添加 `"@module-federation/vite": "^1.x.x"`

**Step 2: 验证安装**

Run:
```bash
npm ls @module-federation/vite
```

Expected: 显示安装的版本号

**Step 3: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 1: 安装依赖`

**Step 4: 提交**

```bash
git add package.json package-lock.json
git commit -m "feat: install @module-federation/vite dependency"
```

---

### Task 2: 配置vite.config.ts的Module Federation

**Files:**
- Modify: `frontend/vite.config.ts`

**Step 1: 备份原配置**

Run:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
cp vite.config.ts vite.config.ts.backup
```

**Step 2: 重写vite.config.ts**

Write: `frontend/vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import federation from '@module-federation/vite'
import { fileURLToPath, URL } from 'node:url'

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
        'element-plus': {
          singleton: true,
          requiredVersion: '^2.13.0',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,  // 从5173改为5174
    host: true,
    cors: true,
    origin: 'http://localhost:3000',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false,
  },
})
```

**Step 3: 更新package.json的dev脚本**

Modify: `frontend/package.json` 的 scripts 部分
```json
{
  "scripts": {
    "dev": "vite --port 5174",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview --port 5174"
  }
}
```

**Step 4: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 2: 配置Module Federation`

**Step 5: 提交**

```bash
git add vite.config.ts package.json
git commit -m "feat: configure Module Federation for Vue remote module"
```

---

### Task 3: 创建Wrapper组件目录

**Files:**
- Create: `frontend/src/wrappers/`

**Step 1: 创建目录**

Run:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
mkdir -p src/wrappers
```

**Step 2: 创建.gitkeep**

Write: `frontend/src/wrappers/.gitkeep`
```
# Vue Component Wrappers for Module Federation
```

**Step 3: 创建类型定义文件**

Write: `frontend/src/wrappers/types.ts`
```typescript
// 标准Props接口 - 来自 docs/COMPONENT_API.md
export interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

export interface ComponentProps {
  user: UserInfo | null
  token: string | null
  apiBaseUrl: string
}

// 标准事件接口
export interface ComponentEmits {
  mounted: () => void
  error: (error: Error) => void
  dataRefresh: (data: any) => void
}

// PostMessage格式
export interface PostMessageData {
  source: 'vue-app' | 'react-app'
  type: string
  payload?: any
}

// 向React父组件发送通知
export function notifyParent(type: string, payload: any): void {
  if (window.parent !== window) {
    const data: PostMessageData = {
      source: 'vue-app',
      type,
      payload
    }
    window.parent.postMessage(data, '*')
  }
}
```

**Step 4: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 3: 创建Wrapper目录`

**Step 5: 提交**

```bash
git add src/wrappers/
git commit -m "feat: create wrappers directory with type definitions"
```

---

## 阶段二: 创建Wrapper组件

### Task 4: 创建DashboardWrapper

**Files:**
- Create: `frontend/src/wrappers/DashboardWrapper.vue`

**Step 1: 创建DashboardWrapper组件**

Write: `frontend/src/wrappers/DashboardWrapper.vue`
```vue
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
import { onMounted, onUnmounted } from 'vue'
import DashboardView from '../views/Dashboard.vue'
import type { ComponentProps, notifyParent } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'Dashboard' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'Dashboard' })
}

// 组件挂载时通知
onMounted(() => {
  console.log('[DashboardWrapper] Component mounted')
})
</script>

<style scoped>
.vue-dashboard-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 4: 创建DashboardWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/DashboardWrapper.vue
git commit -m "feat: create DashboardWrapper component"
```

---

### Task 5: 创建ExperimentsWrapper

**Files:**
- Create: `frontend/src/wrappers/ExperimentsWrapper.vue`

**Step 1: 创建ExperimentsWrapper组件**

Write: `frontend/src/wrappers/ExperimentsWrapper.vue`
```vue
<template>
  <div class="vue-experiments-wrapper">
    <ExperimentsView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ExperimentsView from '../views/Experiments.vue'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'Experiments' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'Experiments' })
}

onMounted(() => {
  console.log('[ExperimentsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-experiments-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 5: 创建ExperimentsWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/ExperimentsWrapper.vue
git commit -m "feat: create ExperimentsWrapper component"
```

---

### Task 6: 创建ExperimentDetailWrapper

**Files:**
- Create: `frontend/src/wrappers/ExperimentDetailWrapper.vue`

**Step 1: 创建ExperimentDetailWrapper组件**

Write: `frontend/src/wrappers/ExperimentDetailWrapper.vue`
```vue
<template>
  <div class="vue-experiment-detail-wrapper">
    <ExperimentDetailView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ExperimentDetailView from '../views/ExperimentDetail.vue'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'ExperimentDetail' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'ExperimentDetail' })
}

onMounted(() => {
  console.log('[ExperimentDetailWrapper] Component mounted')
})
</script>

<style scoped>
.vue-experiment-detail-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 6: 创建ExperimentDetailWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/ExperimentDetailWrapper.vue
git commit -m "feat: create ExperimentDetailWrapper component"
```

---

### Task 7: 创建PluginsWrapper

**Files:**
- Create: `frontend/src/wrappers/PluginsWrapper.vue`

**Step 1: 创建PluginsWrapper组件**

Write: `frontend/src/wrappers/PluginsWrapper.vue`
```vue
<template>
  <div class="vue-plugins-wrapper">
    <PluginsView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import PluginsView from '../views/Plugins.vue'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'Plugins' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'Plugins' })
}

onMounted(() => {
  console.log('[PluginsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-plugins-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 7: 创建PluginsWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/PluginsWrapper.vue
git commit -m "feat: create PluginsWrapper component"
```

---

### Task 8: 创建AnalyticsWrapper

**Files:**
- Create: `frontend/src/wrappers/AnalyticsWrapper.vue`

**Step 1: 创建AnalyticsWrapper组件**

Write: `frontend/src/wrappers/AnalyticsWrapper.vue`
```vue
<template>
  <div class="vue-analytics-wrapper">
    <AnalyticsView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AnalyticsView from '../views/Analytics.vue'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'Analytics' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'Analytics' })
}

onMounted(() => {
  console.log('[AnalyticsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-analytics-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 8: 创建AnalyticsWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/AnalyticsWrapper.vue
git commit -m "feat: create AnalyticsWrapper component"
```

---

### Task 9: 创建SettlementsWrapper

**Files:**
- Create: `frontend/src/wrappers/SettlementsWrapper.vue`

**Step 1: 创建SettlementsWrapper组件**

Write: `frontend/src/wrappers/SettlementsWrapper.vue`
```vue
<template>
  <div class="vue-settlements-wrapper">
    <SettlementsView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import SettlementsView from '../views/Settlements.vue'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  ;(notifyParent as any)('mounted', { component: 'Settlements' })
}

const handleError = (error: Error) => {
  emit('error', error)
  ;(notifyParent as any)('error', { message: error.message, component: 'Settlements' })
}

onMounted(() => {
  console.log('[SettlementsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-settlements-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 9: 创建SettlementsWrapper`

**Step 3: 提交**

```bash
git add src/wrappers/SettlementsWrapper.vue
git commit -m "feat: create SettlementsWrapper component"
```

---

## 阶段三: 状态同步层

### Task 10: 创建Bridge Store

**Files:**
- Create: `frontend/src/stores/bridge.ts`

**Step 1: 创建Bridge Store**

Write: `frontend/src/stores/bridge.ts`
```typescript
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserInfo, PostMessageData } from '../wrappers/types'

export const useBridgeStore = defineStore('bridge', () => {
  // 状态
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // 从localStorage恢复状态
  const hydrate = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        isAuthenticated.value = true
        console.log('[BridgeStore] Hydrated auth state from localStorage')
      } catch (error) {
        console.error('[BridgeStore] Failed to parse saved user', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }

  // 监听来自React的消息
  const setupReactListener = () => {
    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as PostMessageData

      // 安全检查: 生产环境应验证 origin
      // if (event.origin !== expectedOrigin) return

      if (data.source !== 'react-app') return

      console.log('[BridgeStore] Received message from React:', data.type)

      switch (data.type) {
        case 'auth:login':
          token.value = data.payload?.token || null
          user.value = data.payload?.user || null
          isAuthenticated.value = true
          // 同步到localStorage
          localStorage.setItem('auth_token', data.payload?.token || '')
          localStorage.setItem('auth_user', JSON.stringify(data.payload?.user || null))
          break

        case 'auth:logout':
          token.value = null
          user.value = null
          isAuthenticated.value = false
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          break

        case 'data:refresh':
          // 触发数据刷新 - 可以被其他store监听
          console.log('[BridgeStore] Data refresh requested:', data.payload?.dataType)
          break
      }
    })
  }

  // 向React发送消息
  const sendToReact = (type: string, payload: any = null) => {
    if (window.parent !== window) {
      const data: PostMessageData = {
        source: 'vue-app',
        type,
        payload
      }
      window.parent.postMessage(data, '*')
      console.log('[BridgeStore] Sent message to React:', type)
    }
  }

  // 监听Vue状态变化，同步到React
  watch(
    () => [token.value, user.value, isAuthenticated.value],
    ([newToken, newUser, newAuth]) => {
      sendToReact('auth:state', {
        authenticated: newAuth,
        token: newToken,
        user: newUser
      })
    },
    { deep: true, immediate: false }
  )

  return {
    // 状态
    user,
    token,
    isAuthenticated,

    // 方法
    hydrate,
    setupReactListener,
    sendToReact
  }
})
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 10: 创建Bridge Store`

**Step 3: 提交**

```bash
git add src/stores/bridge.ts
git commit -m "feat: create Bridge store for React-Vue state sync"
```

---

## 阶段四: 主题适配

### Task 11: 创建主题适配样式

**Files:**
- Create: `frontend/src/styles/theme.css`

**Step 1: 创建主题样式文件**

Write: `frontend/src/styles/theme.css`
```css
/**
 * Vue主题适配
 * 与Next.js的shadcn/ui主题保持一致
 * 来源: frontend-unified/app/globals.css
 */

/* CSS变量定义 - 与Next.js一致 */
:root {
  /* 基础颜色 - HSL格式 */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;

  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;

  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;

  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;

  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 221 83% 53%;

  --radius: 0.5rem;
}

/* 暗色模式 */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;

    --card: 240 10% 7%;
    --card-foreground: 0 0% 98%;

    --popover: 240 10% 7%;
    --popover-foreground: 0 0% 98%;

    --primary: 221 83% 53%;
    --primary-foreground: 210 40% 98%;

    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;

    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;

    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 221 83% 53%;
  }
}

/* Element Plus组件适配 */

/* 按钮组件 */
.el-button--primary {
  --el-button-bg-color: hsl(var(--primary));
  --el-button-border-color: hsl(var(--primary));
  --el-button-text-color: hsl(var(--primary-foreground));
  --el-button-hover-bg-color: hsl(var(--primary) / 0.9);
  --el-button-hover-border-color: hsl(var(--primary) / 0.9);
  --el-button-active-bg-color: hsl(var(--primary) / 0.8);
  --el-button-active-border-color: hsl(var(--primary) / 0.8);
}

.el-button--default {
  --el-button-bg-color: hsl(var(--background));
  --el-button-border-color: hsl(var(--border));
  --el-button-text-color: hsl(var(--foreground));
  --el-button-hover-bg-color: hsl(var(--muted));
  --el-button-hover-border-color: hsl(var(--border));
  --el-button-hover-text-color: hsl(var(--foreground));
}

.el-button--danger {
  --el-button-bg-color: hsl(var(--destructive));
  --el-button-border-color: hsl(var(--destructive));
  --el-button-text-color: hsl(var(--destructive-foreground));
}

/* 卡片组件 */
.el-card {
  --el-card-bg-color: hsl(var(--card));
  --el-card-border-color: hsl(var(--border));
  border-radius: var(--radius);
}

.el-card__header {
  border-bottom-color: hsl(var(--border));
}

/* 输入框组件 */
.el-input__wrapper {
  --el-input-bg-color: hsl(var(--background));
  --el-input-border-color: hsl(var(--border));
  --el-input-text-color: hsl(var(--foreground));
  --el-input-placeholder-color: hsl(var(--muted-foreground));
  border-radius: calc(var(--radius) - 2px);
  transition: border-color 0.2s;
}

.el-input__wrapper:hover {
  --el-input-border-color: hsl(var(--ring) / 0.5);
}

.el-input__wrapper.is-focus {
  --el-input-border-color: hsl(var(--ring));
  box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
}

/* 选择器组件 */
.el-select__wrapper {
  --el-select-bg-color: hsl(var(--background));
  --el-select-border-color: hsl(var(--border));
  border-radius: calc(var(--radius) - 2px);
}

/* 表格组件 */
.el-table {
  --el-table-bg-color: hsl(var(--background));
  --el-table-tr-bg-color: hsl(var(--background));
  --el-table-border-color: hsl(var(--border));
  --el-table-text-color: hsl(var(--foreground));
  --el-table-header-bg-color: hsl(var(--muted));
  --el-table-header-text-color: hsl(var(--muted-foreground));
}

.el-table th {
  background-color: hsl(var(--muted)) !important;
  color: hsl(var(--muted-foreground)) !important;
}

.el-table tr:hover > td {
  background-color: hsl(var(--muted)) !important;
}

/* 对话框组件 */
.el-dialog {
  --el-dialog-bg-color: hsl(var(--background));
  border-radius: var(--radius);
}

.el-dialog__header {
  border-bottom: 1px solid hsl(var(--border));
}

/* 标签页组件 */
.el-tabs__nav-wrap::after {
  background-color: hsl(var(--border));
}

.el-tabs__item.is-active {
  color: hsl(var(--primary));
}

.el-tabs__active-bar {
  background-color: hsl(var(--primary));
}

/* 菜单组件 */
.el-menu {
  --el-menu-bg-color: hsl(var(--background));
  --el-menu-text-color: hsl(var(--foreground));
  --el-menu-hover-bg-color: hsl(var(--muted));
  --el-menu-border-color: hsl(var(--border));
}

.el-menu-item.is-active {
  color: hsl(var(--primary));
  background-color: hsl(var(--primary) / 0.1);
}

/* 分页组件 */
.el-pagination button {
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
}

.el-pagination button:hover {
  color: hsl(var(--primary));
}

.el-pagination .is-active {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
}

/* 消息提示 */
.el-message {
  --el-message-bg-color: hsl(var(--background));
  --el-message-border-color: hsl(var(--border));
  --el-message-text-color: hsl(var(--foreground));
  border-radius: var(--radius);
}

/* 加载中 */
.el-loading-mask {
  background-color: hsl(var(--background) / 0.8);
}

/* 表单验证错误 */
.el-form-item__error {
  color: hsl(var(--destructive));
}
```

**Step 2: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 11: 创建主题适配`

**Step 3: 提交**

```bash
git add src/styles/theme.css
git commit -m "feat: add theme adaptation for Element Plus"
```

---

## 阶段五: 集成配置

### Task 12: 更新main.ts引入Bridge和主题

**Files:**
- Modify: `frontend/src/main.ts`

**Step 1: 读取当前main.ts**

Run:
```bash
cat /Users/kjonekong/Documents/Affi-Marketing/frontend/src/main.ts
```

**Step 2: 备份原文件**

Run:
```bash
cp /Users/kjonekong/Documents/Affi-Marketing/frontend/src/main.ts /Users/kjonekong/Documents/Affi-Marketing/frontend/src/main.ts.backup
```

**Step 3: 更新main.ts**

Write: `frontend/src/main.ts`
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

// 引入主题适配
import './styles/theme.css'

// 引入Element Plus默认样式
import 'element-plus/dist/index.css'

const app = createApp(App)

// 创建Pinia实例
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化Bridge Store
import { useBridgeStore } from './stores/bridge'
app.mount('#app')

// 在应用挂载后初始化Bridge
setTimeout(() => {
  const bridgeStore = useBridgeStore()
  bridgeStore.hydrate()
  bridgeStore.setupReactListener()
  console.log('[Main] Bridge store initialized')
}, 100)

console.log('[Main] Vue app initialized with Module Federation support')
```

**Step 4: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 12: 更新main.ts`

**Step 5: 提交**

```bash
git add src/main.ts
git commit -m "feat: integrate Bridge store and theme in main.ts"
```

---

## 阶段六: 构建和测试

### Task 13: 测试本地构建

**Files:**
- Run: Build commands

**Step 1: 清理之前的构建**

Run:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
rm -rf dist .vite
```

**Step 2: 运行构建**

Run:
```bash
npm run build
```

Expected Output:
```
vite v5.x.x building for production...
✓ 6 modules transformed.
remoteEntry.js                     1.2 kB
index.html                         0.5 kB
assets/*.js                        XX kB
```

**Step 3: 验证构建产物**

Run:
```bash
ls -la dist/
```

Verify:
- `dist/remoteEntry.js` 存在 (Module Federation入口)
- `dist/assets/` 目录存在
- 其他构建文件正常

**Step 4: 测试预览服务器**

Run:
```bash
npm run preview
```

Expected: 服务器在 http://localhost:5174 启动

在浏览器访问: http://localhost:5174/remoteEntry.js
Expected: 看到 JavaScript 代码 (不是404)

**Step 5: 停止预览服务器**

按 Ctrl+C 停止

**Step 6: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 13: 测试本地构建`

**Step 7: 提交**

```bash
git add -A
git commit -m "test: verify local build output"
```

---

### Task 14: 测试Next.js集成

**Files:**
- Modify: `frontend-unified/app/(dashboard)/dashboard/page.tsx`
- Run: Development servers

**Step 1: 启动Vue开发服务器**

Terminal 1:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
npm run dev
```

Expected:
```
VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:5174/
```

保持此终端运行

**Step 2: 启动Next.js开发服务器**

Terminal 2:
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm run dev
```

Expected:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
```

保持此终端运行

**Step 3: 更新Dashboard页面使用Vue组件**

Read: `frontend-unified/app/(dashboard)/dashboard/page.tsx`

Update: `frontend-unified/app/(dashboard)/dashboard/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'

export default function DashboardPage() {
  const { user, token } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/Dashboard.js"
          componentName="Dashboard"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }}
        />
      </div>
    </div>
  )
}
```

**Step 4: 浏览器测试**

打开浏览器访问: http://localhost:3000/dashboard

验证:
1. 页面加载无报错
2. Vue组件正常显示
3. 控制台无错误信息
4. Vue组件的日志输出: `[DashboardWrapper] Component mounted`

**Step 5: 检查网络请求**

打开浏览器开发者工具 → Network 标签

验证:
1. `remoteEntry.js` 请求成功 (200)
2. Dashboard组件相关文件加载成功

**Step 6: 更新MIGRATION_PROGRESS.md**

Add checkmark: `- [x] Task 14: 测试Next.js集成`

**Step 7: 提交**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
git add app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: integrate Vue Dashboard component via Module Federation"
```

---

## 阶段七: 其他页面集成

### Task 15: 集成Experiments页面

**Files:**
- Modify: `frontend-unified/app/(dashboard)/experiments/page.tsx`

**Step 1: 更新Experiments页面**

Write: `frontend-unified/app/(dashboard)/experiments/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'

export default function ExperimentsPage() {
  const { user, token } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">实验管理</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/Experiments.js"
          componentName="Experiments"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }}
        />
      </div>
    </div>
  )
}
```

**Step 2: 测试页面**

访问: http://localhost:3000/experiments

**Step 3: 提交**

```bash
git add app/\(dashboard\)/experiments/page.tsx
git commit -m "feat: integrate Vue Experiments component"
```

---

### Task 16: 集成其他页面

**Files:**
- Modify: `frontend-unified/app/(dashboard)/` 其他页面

**Step 1: 创建ExperimentDetail页面**

Write: `frontend-unified/app/(dashboard)/experiments/[id]/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'
import { useParams } from 'next/navigation'

export default function ExperimentDetailPage() {
  const { user, token } = useAuthStore()
  const params = useParams()
  const experimentId = params.id as string

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">实验详情</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/ExperimentDetail.js"
          componentName="ExperimentDetail"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
            experimentId
          }}
        />
      </div>
    </div>
  )
}
```

**Step 2: 更新Plugins页面**

Update: `frontend-unified/app/(dashboard)/plugins/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'

export default function PluginsPage() {
  const { user, token } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">插件管理</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/Plugins.js"
          componentName="Plugins"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }}
        />
      </div>
    </div>
  )
}
```

**Step 3: 更新Analytics页面**

Update: `frontend-unified/app/(dashboard)/analytics/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'

export default function AnalyticsPage() {
  const { user, token } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">数据分析</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/Analytics.js"
          componentName="Analytics"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }}
        />
      </div>
    </div>
  )
}
```

**Step 4: 更新Settlements页面**

Update: `frontend-unified/app/(dashboard)/settlements/page.tsx`
```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'
import { useAuthStore } from '@/lib/store'

export default function SettlementsPage() {
  const { user, token } = useAuthStore()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">结算管理</h1>
      <div className="h-[calc(100vh-200px)] border rounded-lg overflow-hidden">
        <VueComponentLoader
          componentUrl="/vue-remote/Settlements.js"
          componentName="Settlements"
          props={{
            user: user || null,
            token: token || null,
            apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
          }}
        />
      </div>
    </div>
  )
}
```

**Step 5: 提交**

```bash
git add .
git commit -m "feat: integrate all Vue components via Module Federation"
```

---

## 阶段八: 文档和收尾

### Task 17: 更新项目进度文档

**Files:**
- Modify: `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`

**Step 1: 更新PROJECT_PROGRESS.md**

Update: `PROJECT_PROGRESS.md` 中的03-Vue迁移部分

```markdown
### 03-Vue迁移
**状态**: ✅完成
**当前阶段**: Vue微应用改造完成
**开始时间**: 2026-03-05
**完成时间**: 2026-03-05

**依赖**:
- [x] 01-架构师完成架构设计 ✅
- [x] 02-React前端完成统一布局 ✅

**产出文件**:
- [x] frontend/vite.config.ts - Module Federation配置
- [x] frontend/src/wrappers/* - Vue组件Wrapper (6个)
- [x] frontend/src/stores/bridge.ts - 状态桥接
- [x] frontend/src/styles/theme.css - 主题适配
- [x] frontend-unified/app/(dashboard)/* - Next.js集成页面

**测试结果**:
- [x] Vue组件可以在Next.js中加载
- [x] 状态同步正常 (localStorage + PostMessage)
- [x] 主题样式统一 (Element Plus → shadcn/ui)

**遗留问题**:
- [ ] 无
```

**Step 2: 提交**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing
git add PROJECT_PROGRESS.md
git commit -m "docs: update PROJECT_PROGRESS.md - Vue migration complete"
```

---

### Task 18: 创建部署文档

**Files:**
- Create: `frontend/VUE_REMOTE_DEPLOYMENT.md`

**Step 1: 创建部署文档**

Write: `frontend/VUE_REMOTE_DEPLOYMENT.md`
```markdown
# Vue远程模块部署指南

## 开发环境

### 启动顺序

1. 启动Vue远程模块 (端口 5174)
```bash
cd frontend
npm run dev
```

2. 启动Next.js主应用 (端口 3000)
```bash
cd frontend-unified
npm run dev
```

### 访问地址

- Next.js主应用: http://localhost:3000
- Vue远程模块: http://localhost:5174

## 生产环境

### 构建Vue远程模块

```bash
cd frontend
npm run build
```

### 构建产物

```
dist/
├── remoteEntry.js      # Module Federation入口
└── assets/             # 组件代码
```

### 部署步骤

1. 将 `dist/` 目录上传到服务器
2. 部署到 `https://hub.zenconsult.top/vue-remote/`
3. 确保 `remoteEntry.js` 可访问: `https://hub.zenconsult.top/vue-remote/remoteEntry.js`

### 环境变量

在 `frontend-unified/.env.production` 中配置:

```bash
VUE_REMOTE_URL=https://hub.zenconsult.top/vue-remote/
NEXT_PUBLIC_API_URL=https://api-hub.zenconsult.top
```

## 验证部署

### 1. 检查remoteEntry.js可访问

```bash
curl https://hub.zenconsult.top/vue-remote/remoteEntry.js
```

应返回JavaScript代码

### 2. 检查Next.js代理

访问: https://hub.zenconsult.top/vue-remote/remoteEntry.js

应返回Vue远程模块的入口文件

### 3. 检查页面加载

访问: https://hub.zenconsult.top/dashboard

- 打开浏览器开发者工具
- 检查Network标签
- 确认 `remoteEntry.js` 加载成功
- 确认Vue组件正常显示

## 故障排查

### 问题: Vue组件加载失败

检查:
1. `remoteEntry.js` 是否可访问
2. Next.js rewrites配置是否正确
3. 浏览器控制台错误信息

### 问题: 状态同步失败

检查:
1. localStorage中是否有 `auth_token` 和 `auth_user`
2. PostMessage是否被正确发送/接收
3. Bridge Store是否正确初始化

### 问题: 样式不一致

检查:
1. `theme.css` 是否正确引入
2. CSS变量是否正确定义
3. Element Plus版本是否匹配
```

**Step 2: 提交**

```bash
git add frontend/VUE_REMOTE_DEPLOYMENT.md
git commit -m "docs: add Vue remote deployment guide"
```

---

### Task 19: 最终验证和提交

**Files:**
- Run: Final verification

**Step 1: 停止所有开发服务器**

在两个终端按 Ctrl+C

**Step 2: 最终构建测试**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend
npm run build
```

**Step 3: 检查所有文件**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing

# 检查Vue项目
git status
git diff --stat

# 检查Next.js项目
cd frontend-unified
git status
git diff --stat
```

**Step 4: 最终提交**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing

# 提交所有更改
git add -A
git commit -m "feat: complete Vue migration to Module Federation

- Configure Module Federation in vite.config.ts
- Create 6 Wrapper components (Dashboard, Experiments, etc.)
- Implement Bridge store for React-Vue state sync
- Add theme adaptation for Element Plus
- Integrate all Vue components in Next.js pages
- Add deployment documentation

Completed: 2026-03-05
Role: 03-Vue迁移工程师"
```

**Step 5: 更新MIGRATION_PROGRESS.md**

Add final checkmark: `- [x] Task 19: 最终验证和提交`

---

## 完成检查清单

在实施完成后，验证以下项目:

### 构建相关
- [ ] `vite.config.ts` 正确配置Module Federation
- [ ] 所有6个Wrapper组件创建完成
- [ ] Bridge Store创建并正确配置
- [ ] 主题样式文件创建
- [ ] `main.ts` 正确引入所有依赖

### 集成相关
- [ ] Next.js可以加载Vue组件
- [ ] 所有6个页面正常工作
- [ ] 无JavaScript错误
- [ ] 网络请求正常

### 状态同步
- [ ] localStorage正确存储认证状态
- [ ] PostMessage通信正常
- [ ] Bridge Store正确初始化

### 样式一致
- [ ] Element Plus组件使用统一颜色
- [ ] 亮色/暗色模式支持
- [ ] 与shadcn/ui风格一致

### 文档更新
- [ ] PROJECT_PROGRESS.md已更新
- [ ] 部署文档已创建
- [ ] MIGRATION_PROGRESS.md标记完成

---

**实施计划版本**: v1.0
**创建日期**: 2026-03-05
**预计完成时间**: 1-2天
**下一步**: 使用 superpowers:executing-plans 技能执行此计划
