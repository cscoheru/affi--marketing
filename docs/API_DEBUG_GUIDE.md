# 前后端连接调试指南

本文档说明如何调试和验证前端与后端 API 的连接状态。

## 目录

- [Mock 模式 vs 真实模式](#mock-模式-vs-真实模式)
- [当前模式检查](#当前模式检查)
- [后端 API 可用性测试](#后端-api-可用性测试)
- [前后端联调步骤](#前后端联调步骤)
- [常见连接问题](#常见连接问题)

## Mock 模式 vs 真实模式

### Mock 模式 (当前)

```
Frontend (Vue)           Mock Data Layer
┌─────────────┐          ┌──────────────┐
│ 登录页面     │──────────→│ 模拟用户数据  │
│ 实验列表     │──────────→│ 模拟实验数据  │
│ 仪表板       │──────────→│ 模拟统计数据  │
└─────────────┘          └──────────────┘
                                    ↓
                            ❌ 不连接后端
```

**特点：**
- 前端使用预定义的模拟数据
- 不发送 HTTP 请求到后端
- 适合 UI 演示和功能展示
- 无法测试真实业务逻辑

### 真实模式

```
Frontend (Vue)           HTTP API          Backend (Go)
┌─────────────┐          ┌───────────┐    ┌─────────────┐
│ 登录页面     │──────────→│ /auth/    │───→│ 不支持登录    │
│ 实验列表     │──────────→│ /experiments │───→│ 实验管理 API  │
│ 仪表板       │──────────→│ /tracking │───→│ 追踪数据 API  │
└─────────────┘          └───────────┘    └─────────────┘
```

**特点：**
- 前端发送真实 HTTP 请求
- 后端处理业务逻辑
- 可以创建/修改真实数据
- 可以测试完整的用户流程

## 当前模式检查

### 检查前端当前模式

**方法 1: 浏览器控制台**
```javascript
// 在 https://hub.zenconsult.top 的控制台执行
console.log('VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK)
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL)
```

**方法 2: 网络请求检查**
1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 尝试登录
4. 观察：
   - **Mock 模式**: 没有 HTTP 请求发出
   - **真实模式**: 可以看到 `api-hub.zenconsult.top` 的请求

### 检查后端 API 可用性

```bash
# 测试后端是否在线
curl https://api-hub.zenconsult.top/

# 测试实验列表 API（带 Origin header）
curl -H "Origin: https://hub.zenconsult.top" \
  https://api-hub.zenconsult.top/api/v1/experiments

# 测试追踪 API
curl -H "Origin: https://hub.zenconsult.top" \
  https://api-hub.zenconsult.top/api/v1/tracking/events
```

## 后端 API 可用性测试

### 已实现的 API 端点

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/` | GET | 服务信息 | ✅ 可用 |
| `/health` | GET | 健康检查 | ✅ 可用 |
| `/api/v1/experiments` | GET | 实验列表 | ✅ 可用 |
| `/api/v1/experiments` | POST | 创建实验 | ✅ 可用 |
| `/api/v1/tracking/events` | POST | 追踪事件 | ✅ 可用 |
| `/api/v1/settlements` | GET | 结算列表 | ✅ 可用 |
| `/auth/login` | POST | ❌ 不存在 | N/A |

### 快速测试脚本

```bash
#!/bin/bash
# test-backend-api.sh

echo "Testing Backend API endpoints..."
echo ""

# 1. Root endpoint
echo "1. Root endpoint:"
curl -s https://api-hub.zenconsult.top/ | head -5
echo ""

# 2. Experiments list
echo "2. Experiments list:"
curl -s -H "Origin: https://hub.zenconsult.top" \
  https://api-hub.zenconsult.top/api/v1/experiments
echo ""

# 3. Create experiment (example)
echo "3. Create experiment:"
curl -s -X POST \
  -H "Origin: https://hub.zenconsult.top" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Experiment",
    "description": "API Connection Test",
    "status": "active"
  }' \
  https://api-hub.zenconsult.top/api/v1/experiments
echo ""

# 4. Tracking events
echo "4. Tracking endpoint:"
curl -s -X POST \
  -H "Origin: https://hub.zenconsult.top" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "page_view",
    "properties": {"page": "/test"}
  }' \
  https://api-hub.zenconsult.top/api/v1/tracking/events
```

## 前后端联调步骤

### 方案 1: 临时切换到真实模式测试

**步骤 1: 在浏览器控制台临时覆盖环境变量**

打开浏览器开发者工具 (F12) → Console，执行：

```javascript
// 临时切换到真实 API
localStorage.setItem('VITE_USE_MOCK', 'false')
location.reload()
```

**步骤 2: 测试连接**

- 刷新页面后，前端会尝试调用真实 API
- 打开 Network 标签观察 HTTP 请求
- 如果看到 404 错误，说明该端点未实现
- 如果看到 CORS 错误，说明后端 CORS 配置有问题

**步骤 3: 恢复 Mock 模式**

```javascript
// 恢复 Mock 模式
localStorage.setItem('VITE_USE_MOCK', 'true')
location.reload()
```

### 方案 2: 创建一个调试页面

创建一个专门的调试页面，可以同时测试 Mock 和真实 API：

```vue
<!-- DebugApi.vue -->
<template>
  <div class="debug-page">
    <h1>API 调试页面</h1>

    <el-card class="mode-card">
      <template #header>
        <span>当前模式</span>
      </template>
      <p>模式: {{ isMock ? 'Mock' : 'Real API' }}</p>
      <p>API URL: {{ apiBaseUrl }}</p>
    </el-card>

    <el-card class="test-card">
      <template #header>
        <span>测试 API 连接</span>
      </template>

      <el-space direction="vertical">
        <el-button @click="testExperiments">测试实验列表 API</el-button>
        <el-button @click="testCreateExperiment">测试创建实验 API</el-button>
        <el-button @click="testTracking">测试追踪 API</el-button>
      </el-space>

      <div v-if="testResult" class="result">
        <h4>测试结果:</h4>
        <pre>{{ JSON.stringify(testResult, null, 2) }}</pre>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'

const isMock = computed(() => import.meta.env.VITE_USE_MOCK === 'true')
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL)

const testResult = ref(null)

const testExperiments = async () => {
  try {
    const response = await axios.get('/api/v1/experiments')
    testResult.value = {
      endpoint: '/api/v1/experiments',
      mode: isMock.value ? 'Mock' : 'Real',
      data: response.data,
      status: 'success'
    }
  } catch (error: any) {
    testResult.value = {
      endpoint: '/api/v1/experiments',
      mode: 'Real',
      error: error.message,
      status: 'error'
    }
  }
}

const testCreateExperiment = async () => {
  try {
    const response = await axios.post('/api/v1/experiments', {
      name: 'Debug Test',
      description: 'API Connection Test',
      status: 'active'
    })
    testResult.value = {
      endpoint: 'POST /api/v1/experiments',
      mode: isMock.value ? 'Mock' : 'Real',
      data: response.data,
      status: 'success'
    }
  } catch (error: any) {
    testResult.value = {
      endpoint: 'POST /api/v1/experiments',
      mode: 'Real',
      error: error.message,
      status: 'error'
    }
  }
}

const testTracking = async () => {
  try {
    const response = await axios.post('/api/v1/tracking/events', {
      event_type: 'test',
      properties: { debug: true }
    })
    testResult.value = {
      endpoint: 'POST /api/v1/tracking/events',
      mode: isMock.value ? 'Mock' : 'Real',
      data: response.data,
      status: 'success'
    }
  } catch (error: any) {
    testResult.value = {
      endpoint: 'POST /api/vaining/tracking/events',
      mode: 'Real',
      error: error.message,
      status: 'error'
    }
  }
}
</script>

<style scoped>
.debug-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.mode-card,
.test-card {
  margin-bottom: 20px;
}

.result {
  margin-top: 20px;
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
}

.result pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
```

## 常见连接问题

### 问题 1: CORS 错误

**症状:**
```
Access to fetch at 'https://api-hub.zenconsult.top/api/v1/experiments'
from origin 'https://hub.zenconsult.top' has been blocked by CORS policy
```

**解决方案:**
- 已在 Railway Backend 配置 CORS_ALLOWED_ORIGINS
- 确保包含 `https://hub.zenconsult.top`

### 问题 2: 404 Not Found

**症状:** API 请求返回 404

**可能原因:**
1. 端点未实现（如 `/auth/login`）
2. URL 路径错误

**验证方法:**
```bash
# 列出所有可用端点
curl https://api-hub.zenconsult.top/api/v1/experiments
```

### 问题 3: Network Error

**症状:** 浏览器显示 "Network Error"

**可能原因:**
1. 后端服务宕机
2. DNS 解析问题
3. CORS 配置错误

**验证方法:**
```bash
# 直接测试后端
curl https://api-hub.zenconsult.top/

# 检查 DNS
dig api-hub.zenconsult.top
```

## 推荐的开发流程

### 1. Mock 模式开发 (当前)
- ✅ UI/UX 开发
- ✅ 前端逻辑开发
- ✅ 产品演示

### 2. 真实模式联调
- ⏸️ 后端 API 测试
- ⏸️ 数据流验证
- ⏸️ 完整用户流程测试

### 3. 混合模式 (建议)
- 使用环境变量控制
- 本地开发: `VITE_USE_MOCK=true`
- 生产环境: `VITE_USE_MOCK=true` (先展示)
- 内测环境: `VITE_USE_MOCK=false` (真实 API)

## 切换模式的命令

### Vercel 环境变量

```bash
# 切换到 Mock 模式
vercel env add VITE_USE_MOCK production --value "true"

# 切换到真实模式
vercel env rm VITE_USE_MOCK production
```

### 本地开发

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCK=false  # 真实 API

# 或
VITE_USE_MOCK=true   # Mock 模式
```

## 总结

| 方面 | Mock 模式 | 真实模式 |
|------|----------|----------|
| 前端独立开发 | ✅ 是 | ❌ 否 |
| UI 演示 | ✅ 是 | ❌ 否 |
| 业务逻辑测试 | ❌ 否 | ✅ 是 |
| 数据持久化 | ❌ 否 | ✅ 是 |
| 需要后端 | ❌ 否 | ✅ 是 |

**当前推荐:** 保持 Mock 模式进行产品展示和演示，真实 API 模式需要后续实现完整认证系统。
