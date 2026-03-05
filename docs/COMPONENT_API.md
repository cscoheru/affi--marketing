# 组件接口规范

**版本**: v1.0
**创建时间**: 2026-03-05
**维护者**: 01-架构师

---

## 概述

本文档定义了 Affi-Marketing 项目中 Vue 组件与 React 主应用之间的接口规范，确保两个框架之间的无缝集成。

---

## Vue 组件 Props 规范

### 通用 Props

所有暴露给 Next.js 的 Vue 组件**必须**接收以下标准 props：

| Prop | 类型 | 必填 | 描述 |
|------|------|------|------|
| `user` | `UserInfo \| null` | 否 | 当前用户信息对象 |
| `token` | `string \| null` | 否 | 认证令牌 (JWT) |
| `apiBaseUrl` | `string` | 是 | API 基础 URL |
| `onEvent` | `(event: ComponentEvent) => void` | 是 | 事件回调函数 |

### UserInfo 类型定义

```typescript
interface UserInfo {
  id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'guest'
  avatar?: string
  permissions?: string[]
}
```

### ComponentEvent 类型定义

```typescript
type ComponentEvent =
  | { type: 'auth:state'; payload: { authenticated: boolean; user?: UserInfo } }
  | { type: 'data:change'; payload: Record<string, any> }
  | { type: 'error'; payload: { message: string; code?: string } }
  | { type: 'navigation'; payload: { path: string } }
```

---

## Vue 组件实现要求

### 1. Props 声明示例

```vue
<script setup lang="ts">
interface Props {
  user: UserInfo | null
  token: string | null
  apiBaseUrl: string
  onEvent: (event: ComponentEvent) => void
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  token: null
})
</script>
```

### 2. 事件发送示例

```vue
<script setup lang="ts">
// 发送认证状态变化事件
function emitAuthChange(authenticated: boolean, user?: UserInfo) {
  props.onEvent({
    type: 'auth:state',
    payload: { authenticated, user }
  })
}

// 发送数据变化事件
function emitDataChange(data: Record<string, any>) {
  props.onEvent({
    type: 'data:change',
    payload: data
  })
}
</script>
```

---

## postMessage 通信协议

当使用 iframe 隔离 Vue 组件时，使用 postMessage 进行跨框架通信：

### 从 React 到 Vue

```typescript
// React 主应用发送消息
iframeRef.current?.contentWindow?.postMessage({
  type: 'auth:update',
  payload: { token: 'xxx', user: {...} }
}, '*')
```

```vue
<!-- Vue 组件接收消息 -->
<script setup lang="ts">
onMounted(() => {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'auth:update') {
      // 处理认证更新
    }
  })
})
</script>
```

### 从 Vue 到 React

```vue
<!-- Vue 组件发送消息 -->
<script setup lang="ts">
function notifyParent(event: ComponentEvent) {
  window.parent.postMessage(event, '*')
}
</script>
```

```typescript
// React 主应用接收消息
useEffect(() => {
  const handler = (event: MessageEvent<ComponentEvent>) => {
    if (event.data.type === 'auth:state') {
      // 处理认证状态变化
    }
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}, [])
```

---

## 生命周期集成

### Vue 组件挂载时机

Vue 组件应在以下情况下完成初始化：
- 所有 props 已传入
- API 客户端已配置
- 状态管理 (Pinia) 已初始化

### 清理要求

组件卸载时必须：
- 取消所有网络请求
- 清理事件监听器
- 重置本地状态

```vue
<script setup lang="ts">
onUnmounted(() => {
  // 清理工作
  abortController.abort()
  clearInterval(intervalId)
})
</script>
```

---

## 状态同步规范

### 认证状态同步

1. **初始化时**: React 通过 props 传入 `token` 和 `user`
2. **变化时**: Vue 通过 `onEvent` 回调通知 React
3. **持久化**: 使用 `localStorage` 中的 `auth_token` 作为后备

### 数据状态同步

1. **单一数据源**: API 作为唯一真实数据源
2. **乐观更新**: Vue 可先更新本地状态，然后同步到服务器
3. **冲突解决**: 以服务器响应为准

---

## TypeScript 类型共享

为了确保类型安全，项目应维护共享的类型定义文件：

**位置**: `frontend-unified/types/shared.ts`

```typescript
// 通用类型定义
export interface UserInfo { /* ... */ }
export type ComponentEvent = /* ... */

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
```

Vue 项目应通过 import 引用这些类型：

```vue
<script setup lang="ts">
import type { UserInfo, ComponentEvent } from '@types/shared'
</script>
```

---

## 示例完整组件

```vue
<template>
  <div class="vue-dashboard">
    <h1>Dashboard</h1>
    <p v-if="user">Welcome, {{ user.username }}</p>
    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  user: UserInfo | null
  token: string | null
  apiBaseUrl: string
  onEvent: (event: ComponentEvent) => void
}

const props = defineProps<Props>()
const loading = ref(false)

function handleLogout() {
  props.onEvent({
    type: 'auth:state',
    payload: { authenticated: false, user: null }
  })
}

onMounted(() => {
  // 组件初始化
  console.log('Dashboard mounted with API:', props.apiBaseUrl)
})
</script>
```

---

## 测试要求

所有 Vue 组件应提供：
1. Props 验证测试
2. 事件触发测试
3. 与 React 集成测试

---

**最后更新**: 2026-03-05
