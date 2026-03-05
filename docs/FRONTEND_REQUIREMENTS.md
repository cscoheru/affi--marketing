# 内容自动化系统 - 前端需求文档

> **版本**: v1.0
> **目标**: 快速验证内容自动化系统可行性

---

## 🔧 技术栈（详细）

### 前端框架
```json
{
  "framework": "Vue 3.4+",
  "language": "TypeScript 5.3+",
  "build_tool": "Vite 5.0+"
}
```

### UI 组件库
```json
{
  "library": "Element Plus 2.5+",
  "reason": "成熟的企业级组件库，中文文档完善",
  "alternative": "Ant Design Vue (备选)"
}
```

### 状态管理
```json
{
  "library": "Pinia 2.1+",
  "reason": "Vue 官方推荐，TypeScript 友好",
  "stores": [
    "products (产品管理)",
    "materials (素材管理)",
    "content (内容管理)",
    "publish (发布管理)",
    "user (用户管理)"
  ]
}
```

### 路由
```json
{
  "library": "Vue Router 4.3+",
  "mode": "history",
  "guards": ["认证守卫", "权限守卫"]
}
```

### HTTP 客户端
```json
{
  "library": "Axios 1.6+",
  "baseURL": "https://api-hub.zenconsult.top/api/v1",
  "interceptors": ["请求拦截", "响应拦截", "错误处理"]
}
```

### 图表库
```json
{
  "library": "ECharts 5.5+",
  "reason": "功能强大，中文支持好",
  "usage": "数据看板的图表展示"
}
```

### 样式方案
```json
{
  "css": "原生 CSS + Scoped",
  "preprocessor": "无",
  "framework": "无",
  "reason": "简化构建，Vue 3 Scoped 已够用"
}
```

### 开发工具
```json
{
  "package_manager": "npm 或 pnpm",
  "ide": "VS Code + Volar",
  "formatter": "ESLint + Prettier",
  "git_hooks": "husky + lint-staged"
}
```

### 完整依赖
```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.5.0",
    "@element-plus/icons-vue": "^2.3.0",
    "axios": "^1.6.0",
    "echarts": "^5.5.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^2.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 📋 核心功能

---

## 📋 核心功能

### 1. 产品候选库 (Product Candidates)
浏览和管理待评测的产品

**功能**:
- 产品列表展示（卡片式）
- 产品筛选（类别、价格、评分）
- 添加/删除产品
- 查看产品详情

**页面**: `/products`

---

### 2. 素材库 (Materials)
查看和管理搜集到的素材

**功能**:
- 按 ASIN 查看素材
- 素材分类（评论、视频、讨论）
- 素材预览
- 刷新/重新搜集素材

**页面**: `/materials`

---

### 3. 内容管理 (Content)
核心功能：内容生成、审核、发布

**功能**:
- 内容列表（全部/草稿/审核中/已发布）
- 新建内容（AI 生成）
- 内容编辑器
- 内容审核（批准/拒绝）
- 一键发布（多平台）
- 发布状态查看

**页面**: `/content`

---

### 4. 发布中心 (Publish)
管理发布任务和状态

**功能**:
- 发布队列
- 平台配置（Blogger、Medium 等）
- 批量发布
- 发布日志
- 失败重试

**页面**: `/publish`

---

### 5. 数据看板 (Analytics)
数据统计和分析

**功能**:
- 概览卡片（总收入、总阅读、转化率）
- 内容表现排行
- 平台对比
- 趋势图表

**页面**: `/analytics`

---

## 🎨 页面设计

### 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | 导航 | 用户                                   │
├──────────┬───────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │  Main Content Area                             │
│          │                                                   │
│ • 产品   │                                                   │
│ • 素材   │  (页面内容)                                        │
│ • 内容   │                                                   │
│ • 发布   │                                                   │
│ • 数据   │                                                   │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

---

## 📱 核心页面详细设计

### 1. 产品候选库页面

```vue
<template>
  <div class="products-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <h1>产品候选库</h1>
      <el-button type="primary">+ 添加产品</el-button>
    </div>

    <!-- 筛选栏 -->
    <div class="filters">
      <el-select placeholder="选择类别" v-model="filters.category">
        <el-option label="咖啡机" value="coffee-machine" />
        <el-option label="咖啡豆" value="coffee-beans" />
      </el-select>
      <el-input placeholder="搜索产品" v-model="filters.search" />
    </div>

    <!-- 产品列表 -->
    <div class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <img :src="product.image" class="product-image">
        <div class="product-info">
          <h3>{{ product.title }}</h3>
          <div class="product-meta">
            <span class="price">${{ product.price }}</span>
            <span class="rating">★ {{ product.rating }}</span>
            <span class="reviews">{{ product.reviewCount }} 评论</span>
          </div>
          <div class="product-tags">
            <el-tag size="small">{{ product.category }}</el-tag>
            <el-tag type="success" size="small">{{ product.status }}</el-tag>
          </div>
          <div class="product-actions">
            <el-button size="small" @click="viewMaterials(product)">查看素材</el-button>
            <el-button size="small" type="primary" @click="generateContent(product)">生成内容</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

---

### 2. 内容管理页面

```vue
<template>
  <div class="content-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <h1>内容管理</h1>
      <el-button type="primary" @click="showCreateDialog">+ AI 生成内容</el-button>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all">
        <ContentTable :contents="allContents" />
      </el-tab-pane>
      <el-tab-pane label="草稿" name="draft">
        <ContentTable :contents="draftContents" />
      </el-tab-pane>
      <el-tab-pane label="待审核" name="reviewing">
        <ContentTable :contents="reviewingContents" />
      </el-tab-pane>
      <el-tab-pane label="已发布" name="published">
        <ContentTable :contents="publishedContents" />
      </el-tab-pane>
    </el-tabs>

    <!-- AI 生成对话框 -->
    <el-dialog v-model="createDialogVisible" title="AI 生成内容" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择产品">
          <el-select v-model="createForm.product">
            <el-option v-for="p in products" :key="p.id" :label="p.title" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-radio-group v-model="createForm.type">
            <el-radio label="review">评测文章</el-radio>
            <el-radio label="science">科普文章</el-radio>
            <el-radio label="guide">购买指南</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="AI 模型">
          <el-select v-model="createForm.model">
            <el-option label="Claude 3.5 Sonnet" value="claude-3-5-sonnet" />
            <el-option label="GPT-4" value="gpt-4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generateContent" :loading="generating">
          开始生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 内容审核对话框 -->
    <el-dialog v-model="reviewDialogVisible" title="内容审核" width="800px">
      <div class="review-content">
        <h2>{{ reviewingContent.title }}</h2>
        <div class="review-meta">
          <span>{{ reviewingContent.category }}</span>
          <span>{{ reviewingContent.wordCount }} 字</span>
          <span>AI 置信度: {{ reviewingContent.aiScore }}%</span>
        </div>
        <div class="review-body" v-html="reviewingContent.html"></div>
      </div>
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.decision">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">拒绝</el-radio>
            <el-radio label="revision">需修改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="意见">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>
```

---

### 3. 发布中心页面

```vue
<template>
  <div class="publish-page">
    <div class="page-header">
      <h1>发布中心</h1>
      <el-button type="primary" @click="showPublishDialog">+ 一键发布</el-button>
    </div>

    <!-- 发布队列 -->
    <el-card class="queue-card">
      <template #header>
        <span>发布队列 ({{ queue.length }})</span>
      </template>
      <el-table :data="queue">
        <el-table-column prop="title" label="内容标题" />
        <el-table-column prop="platforms" label="目标平台" width="200">
          <template #default="{ row }">
            <el-tag v-for="p in row.platforms" :key="p" size="small">{{ p }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="viewLog(row)">日志</el-button>
            <el-button size="small" type="danger" v-if="row.status === 'failed'">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 平台配置 -->
    <el-card class="platforms-card">
      <template #header>
        <span>平台配置</span>
      </template>
      <el-table :data="platforms">
        <el-table-column prop="name" label="平台名称" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" />
            <el-button size="small" @click="configPlatform(row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发布日志 -->
    <el-card class="logs-card">
      <template #header>
        <span>发布日志</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="log.timestamp"
          :type="log.type"
        >
          {{ log.message }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>
```

---

### 4. 数据看板页面

```vue
<template>
  <div class="analytics-page">
    <!-- 概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">${{ totalRevenue }}</div>
          <div class="stat-label">总收入</div>
          <div class="stat-trend" :class="{ positive: revenueTrend > 0 }">
            {{ revenueTrend > 0 ? '↑' : '↓' }} {{ Math.abs(revenueTrend) }}%
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ totalViews }}</div>
          <div class="stat-label">总阅读量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ conversionRate }}%</div>
          <div class="stat-label">转化率</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-value">{{ publishedCount }}</div>
          <div class="stat-label">已发布内容</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>收入趋势</span>
          </template>
          <div ref="trendChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>平台分布</span>
          </template>
          <div ref="platformChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 内容排行 -->
    <el-card class="ranking-card">
      <template #header>
        <span>内容表现排行</span>
      </template>
      <el-table :data="topContents" :default-sort="{ prop: 'revenue', order: 'descending' }">
        <el-table-column prop="title" label="内容标题" />
        <el-table-column prop="views" label="阅读量" sortable />
        <el-table-column prop="clicks" label="点击量" sortable />
        <el-table-column prop="conversions" label="转化数" sortable />
        <el-table-column prop="revenue" label="收入" sortable>
          <template #default="{ row }">
            <span class="revenue">${{ row.revenue }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
```

---

## 🗂️ 路由结构

```typescript
// src/router/index.ts

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/products',
    children: [
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue')
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/Materials.vue')
      },
      {
        path: 'content',
        name: 'Content',
        component: () => import('@/views/Content.vue')
      },
      {
        path: 'publish',
        name: 'Publish',
        component: () => import('@/views/Publish.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue')
      }
    ]
  }
]
```

---

## 📦 目录结构

```
frontend/
├── src/
│   ├── views/
│   │   ├── Layout.vue           # 主布局
│   │   ├── Products.vue          # 产品候选库
│   │   ├── Materials.vue         # 素材库
│   │   ├── Content.vue           # 内容管理
│   │   ├── Publish.vue           # 发布中心
│   │   └── Analytics.vue         # 数据看板
│   │
│   ├── components/
│   │   ├── ProductCard.vue       # 产品卡片
│   │   ├── ContentTable.vue      # 内容表格
│   │   ├── PublishQueue.vue      # 发布队列
│   │   ├── StatCard.vue          # 统计卡片
│   │   └── TrendChart.vue        # 趋势图表
│   │
│   ├── api/
│   │   ├── products.ts           # 产品 API
│   │   ├── materials.ts          # 素材 API
│   │   ├── content.ts            # 内容 API
│   │   ├── publish.ts            # 发布 API
│   │   └── analytics.ts          # 分析 API
│   │
│   ├── types/
│   │   ├── product.ts
│   │   ├── material.ts
│   │   ├── content.ts
│   │   └── analytics.ts
│   │
│   └── router/
│       └── index.ts
│
└── package.json
```

---

## 🔌 API 集成

### 后端 API 接口

```typescript
// src/api/products.ts

export interface Product {
  id: number
  asin: string
  title: string
  category: string
  price: number
  rating: number
  reviewCount: number
  image: string
  status: string
}

export const productsApi = {
  // 获取产品列表
  getList: (params?: { category?: string, search?: string }) =>
    request<Product[]>({ url: '/api/v1/products', params }),

  // 获取产品详情
  getDetail: (asin: string) =>
    request<Product>({ url: `/api/v1/products/${asin}` }),

  // 添加产品
  add: (data: Partial<Product>) =>
    request({ url: '/api/v1/products', method: 'POST', data }),

  // 删除产品
  delete: (id: number) =>
    request({ url: `/api/v1/products/${id}`, method: 'DELETE' })
}
```

---

## 🎨 UI 组件需求

### ProductCard 组件
```vue
<template>
  <div class="product-card">
    <el-image :src="product.image" fit="cover" class="card-image" />
    <div class="card-content">
      <h3>{{ product.title }}</h3>
      <div class="meta">
        <span class="price">${{ product.price }}</span>
        <el-rate v-model="product.rating" disabled />
        <span>{{ product.reviewCount }} 评论</span>
      </div>
      <div class="actions">
        <el-button size="small" @click="$emit('materials', product)">素材</el-button>
        <el-button size="small" type="primary" @click="$emit('generate', product)">生成</el-button>
      </div>
    </div>
  </div>
</template>
```

### ContentTable 组件
```vue
<template>
  <el-table :data="contents" @row-click="handleRowClick">
    <el-table-column prop="title" label="标题" />
    <el-table-column prop="type" label="类型" width="100">
      <template #default="{ row }">
        <el-tag :type="getTypeColor(row.type)">{{ row.type }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="getStatusColor(row.status)">{{ row.status }}</el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="创建时间" width="180" />
    <el-table-column label="操作" width="200" fixed="right">
      <template #default="{ row }">
        <el-button size="small" @click="editContent(row)">编辑</el-button>
        <el-button size="small" type="primary" @click="publishContent(row)">发布</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

---

## 📊 数据模型

### TypeScript 类型定义

```typescript
// src/types/product.ts
export interface Product {
  id: number
  asin: string
  title: string
  category: string
  price: number
  rating: number
  reviewCount: number
  imageUrl: string
  status: 'pending' | 'researching' | 'covered' | 'ignored'
  potentialScore: number
  createdAt: string
}

// src/types/material.ts
export interface Material {
  id: number
  asin: string
  sourceType: 'amazon_review' | 'youtube' | 'reddit' | 'quora'
  sourceUrl: string
  content: string
  sentimentScore: number
  createdAt: string
}

// src/types/content.ts
export interface Content {
  id: number
  slug: string
  asin: string
  title: string
  type: 'review' | 'science' | 'guide'
  content: string
  status: 'draft' | 'reviewing' | 'approved' | 'published'
  aiGenerated: boolean
  humanReviewed: boolean
  wordCount: number
  createdAt: string
  updatedAt: string
}

// src/types/publish.ts
export interface PublishTask {
  id: number
  contentId: number
  platforms: string[]
  status: 'pending' | 'running' | 'success' | 'failed'
  results: PlatformResult[]
  createdAt: string
}

export interface PlatformResult {
  platform: string
  status: 'success' | 'failed'
  url?: string
  error?: string
}
```

---

## ✅ 最小可行产品 (MVP)

### v1.0 功能范围

| 页面 | 必需功能 | 可选功能 |
|------|----------|----------|
| 产品候选库 | 列表展示、添加产品 | 筛选、搜索 |
| 素材库 | 素材列表、预览 | 刷新素材 |
| 内容管理 | 内容列表、审核、发布 | AI 生成 |
| 发布中心 | 发布队列、状态查看 | 批量发布 |
| 数据看板 | 基础统计卡片 | 图表、趋势 |

---

## 📝 给 v0 的提示

**要求**: 生成一个 Vue 3 + TypeScript + Element Plus 的内容自动化系统前端

**必需页面**:
1. Layout (侧边栏导航)
2. Products (产品候选库)
3. Materials (素材库)
4. Content (内容管理)
5. Publish (发布中心)
6. Analytics (数据看板)

**关键功能**:
- 侧边栏导航
- 卡片式产品展示
- 表格式内容管理
- 实时状态更新
- 响应式布局

**样式**:
- 使用 Element Plus 组件库
- 简洁商务风格
- 移动端友好

---

**要我现在把这个需求发给 v0 生成代码吗？还是你想调整什么？**
