# 状态管理方案

**版本**: v1.0
**创建时间**: 2026-03-05
**维护者**: 01-架构师

---

## 概述

本文档定义了 Affi-Marketing 项目的状态管理架构，包括 React (Zustand) 和 Vue (Pinia) 的状态管理以及跨框架状态同步机制。

---

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    统一状态管理层                            │
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                │
│  │   Zustand    │         │    Pinia     │                │
│  │  (React)     │◄────────►│   (Vue)      │                │
│  │              │  同步机制  │              │                │
│  └──────────────┘         └──────────────┘                │
│          │                         │                        │
│          └───────────┬─────────────┘                        │
│                      │                                       │
│              ┌───────▼───────┐                               │
│              │  localStorage │                               │
│              │   (持久化)    │                               │
│              └───────┬───────┘                               │
│                      │                                       │
│              ┌───────▼───────┐                               │
│              │     API       │                               │
│              │  (单一数据源)  │                               │
│              └───────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

---

## React 状态 (Zustand)

### 安装依赖

```bash
npm install zustand
```

### Store 结构

**文件**: `frontend-unified/lib/store.ts`

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ==================== 认证状态 ====================
interface AuthState {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => void
  updateUser: (user: UserInfo) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
    }),
    { name: 'auth-storage' }
  )
)

// ==================== UI 状态 ====================
interface UIState {
  sidebarCollapsed: boolean
  currentRoute: string
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setRoute: (route: string) => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      currentRoute: '/',
      theme: 'light',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setRoute: (route) => set({ currentRoute: route }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-storage' }
  )
)

// ==================== 数据状态 ====================
interface DataState {
  products: Product[]
  materials: Material[]
  experiments: Experiment[]
  loading: boolean
  error: string | null
  setProducts: (products: Product[]) => void
  setMaterials: (materials: Material[]) => void
  setExperiments: (experiments: Experiment[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDataStore = create<DataState>()((set) => ({
  products: [],
  materials: [],
  experiments: [],
  loading: false,
  error: null,
  setProducts: (products) => set({ products }),
  setMaterials: (materials) => set({ materials }),
  setExperiments: (experiments) => set({ experiments }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
```

---

## Vue 状态 (Pinia)

### 安装依赖

```bash
npm install pinia
```

### Store 结构

**文件**: `frontend/src/stores/auth.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  function login(newToken: string, newUser: UserInfo) {
    token.value = newToken
    user.value = newUser
    // 同步到 localStorage
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function updateUser(newUser: UserInfo) {
    user.value = newUser
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  // 从 localStorage 恢复状态
  function hydrate() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    updateUser,
    hydrate,
  }
})
```

**文件**: `frontend/src/stores/experiment.ts`

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExperimentStore = defineStore('experiment', () => {
  const experiments = ref<Experiment[]>([])
  const currentExperiment = ref<Experiment | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchExperiments() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch('/api/experiments')
      const data = await response.json()
      experiments.value = data.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch'
    } finally {
      loading.value = false
    }
  }

  function setCurrentExperiment(exp: Experiment) {
    currentExperiment.value = exp
  }

  return {
    experiments,
    currentExperiment,
    loading,
    error,
    fetchExperiments,
    setCurrentExperiment,
  }
})
```

---

## 状态同步机制

### 方案 1: localStorage 共享 (推荐用于认证状态)

```typescript
// React 侧: 监听 localStorage 变化
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'auth_token') {
      const newToken = e.newValue
      if (newToken) {
        // Vue 已登录，同步到 React
        useAuthStore.getState().login(newToken, user)
      } else {
        // Vue 已登出，同步到 React
        useAuthStore.getState().logout()
      }
    }
  }

  window.addEventListener('storage', handleStorageChange)
  return () => window.removeEventListener('storage', handleStorageChange)
}, [])
```

```typescript
// Vue 侧: 监听 localStorage 变化
onMounted(() => {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'auth_token') {
      const authStore = useAuthStore()
      if (e.newValue) {
        // React 已登录
        authStore.token = e.newValue
      } else {
        // React 已登出
        authStore.logout()
      }
    }
  })
})
```

### 方案 2: postMessage 通信 (推荐用于实时数据)

```typescript
// React → Vue: 发送状态更新
function broadcastToVue(type: string, payload: any) {
  const iframe = document.querySelector('iframe.vue-remote')
  iframe?.contentWindow?.postMessage({ type, payload }, '*')
}

// Vue → React: 发送状态更新
function broadcastToReact(type: string, payload: any) {
  window.parent.postMessage({ type, payload }, '*')
}
```

### 方案 3: API 作为单一数据源 (推荐用于业务数据)

```typescript
// 统一数据获取流程
async function getProducts() {
  // 1. 先从缓存读取 (可选)
  const cached = localStorage.getItem('products_cache')
  if (cached) {
    return JSON.parse(cached)
  }

  // 2. 从 API 获取
  const response = await fetch('/api/products', {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await response.json()

  // 3. 更新到各个 store
  useDataStore.getState().setProducts(data.data)
  experimentStore.setProducts(data.data) // Vue

  // 4. 缓存 (可选)
  localStorage.setItem('products_cache', JSON.stringify(data.data))

  return data.data
}
```

---

## 状态同步时机

| 触发事件 | 同步方向 | 同步方式 |
|----------|----------|----------|
| 用户登录 | React ↔ Vue | localStorage + postMessage |
| 用户登出 | React ↔ Vue | localStorage + postMessage |
| 数据刷新 | React → Vue | postMessage |
| 数据提交 | Vue → React | postMessage + API轮询 |
| 页面加载 | API → All | 从API重新获取 |

---

## 状态桥接组件

**文件**: `frontend/src/stores/bridge.ts`

```typescript
import { watch } from 'vue'
import { useAuthStore as useVueAuthStore } from './auth'
import type { UserInfo } from '@types/shared'

/**
 * Vue 状态桥接器
 * 负责 Vue 与 React 之间的状态同步
 */
export class StateBridge {
  private vueAuthStore: ReturnType<typeof useVueAuthStore>

  constructor() {
    this.vueAuthStore = useVueAuthStore()
    this.setupReactListener()
    this.setupVueWatcher()
  }

  /**
   * 监听来自 React 的消息
   */
  private setupReactListener() {
    window.addEventListener('message', (event) => {
      // 安全检查: 生产环境应验证 origin
      if (event.data.source !== 'react-app') return

      switch (event.data.type) {
        case 'auth:login':
          this.vueAuthStore.login(event.data.payload.token, event.data.payload.user)
          break
        case 'auth:logout':
          this.vueAuthStore.logout()
          break
        case 'data:refresh':
          // 触发数据刷新
          this.handleDataRefresh(event.data.payload.dataType)
          break
      }
    })
  }

  /**
   * 监听 Vue 状态变化，同步到 React
   */
  private setupVueWatcher() {
    // 监听认证状态变化
    watch(
      () => [this.vueAuthStore.token, this.vueAuthStore.user],
      ([token, user]) => {
        this.sendToReact('auth:state', {
          authenticated: !!token,
          token,
          user
        })
      },
      { deep: true }
    )
  }

  /**
   * 向 React 发送消息
   */
  private sendToReact(type: string, payload: any) {
    window.parent.postMessage({
      source: 'vue-app',
      type,
      payload
    }, '*')
  }

  /**
   * 处理数据刷新请求
   */
  private async handleDataRefresh(dataType: string) {
    // 根据数据类型刷新对应的数据
    // ...
  }
}

// 自动初始化桥接器
export function useStateBridge() {
  return new StateBridge()
}
```

---

## 最佳实践

### 1. 避免状态不一致

- ✅ 优先使用 API 作为单一数据源
- ✅ 使用乐观更新时提供回滚机制
- ❌ 避免直接修改跨框架的状态

### 2. 性能优化

- ✅ 使用防抖/节流处理高频更新
- ✅ 大数据集使用分页或虚拟滚动
- ❌ 避免不必要的状态订阅

### 3. 调试技巧

```typescript
// 开发环境: 状态变更日志
if (process.env.NODE_ENV === 'development') {
  useAuthStore.subscribe((state) => {
    console.log('[Auth State Changed]', state)
  })
}
```

---

## 测试策略

### 单元测试

- 测试每个 store 的 action 和 getter
- 测试状态持久化

### 集成测试

- 测试 React ↔ Vue 状态同步
- 测试 postMessage 通信

### E2E 测试

- 测试完整的用户流程 (登录 → 操作 → 登出)
- 验证状态在不同页面间的一致性

---

**最后更新**: 2026-03-05
