# 前端实现设计文档 - 内容企业系统

**版本**: v1.0
**日期**: 2026-03-06
**状态**: 已批准，准备实施

---

## 1. 概述

### 1.1 背景

根据 `docs/plans/2026-03-06-content-business-master-plan.md` 中的战略转型，系统从"Amazon推广员"模式转变为"内容企业"模式。

**核心认知转变**：
- 产品 = 内容（文章、评测、指南等）
- 市场机会 = Amazon商品（选品）
- 营销 = 多平台发布
- 数据分析 = 转化追踪

### 1.2 目标

重构前端系统以支持新的业务模型：
- 新建市场战略页面（`/strategy`）
- 重构产品中心页面（`/products`）
- 重构营销中心页面（`/marketing`）
- 新建数据分析页面（`/analytics`）
- 更新导航菜单

### 1.3 开发策略

**方案选择**：一次性重构（方案B）

**实施方式**：
- 分优先级开发（P0→P1→P2→P3）
- API不可用时使用演示数据
- 后端就绪后无缝切换

---

## 2. 页面路径映射

### 2.1 新架构

```
/strategy    → 市场战略（管理市场机会/Amazon商品）
/products    → 产品中心（管理内容创作）
/marketing   → 营销中心（发布管理）
/analytics   → 数据分析（转化追踪）
```

### 2.2 旧架构（参考）

```
/products    → 产品管理（将迁移到 /strategy）
/content     → 内容管理（将重构为 /products）
/publish     → 发布中心（将迁移到 /marketing）
```

---

## 3. 数据模型

### 3.1 市场机会（MarketOpportunity）

```typescript
export interface MarketOpportunity {
  id: number
  asin: string
  title: string
  category?: string
  price?: string        // ⚠️ string 类型（后端 decimal）
  rating?: string       // ⚠️ string 类型（后端 decimal）
  reviewCount?: number
  imageUrl?: string

  // 市场状态
  status: 'watching' | 'targeting' | 'active' | 'saturated' | 'exited'

  // 市场评估
  marketSize?: 'large' | 'medium' | 'small'
  competitionLevel?: 'high' | 'medium' | 'low'
  contentPotential?: 'high' | 'medium' | 'low'
  aiScore?: number

  // 统计数据（从关联内容汇总）
  contentCount: number
  totalClicks: number
  totalConversions: number
  totalRevenue: string

  lastSyncedAt?: string

  createdAt: string
  updatedAt: string
}
```

**状态定义**：
- `watching` - 观察中（有潜力，暂不进入）
- `targeting` - 瞄准中（准备进入）
- `active` - 活跃市场（正在产出内容）
- `saturated` - 已饱和（竞争激烈，减少投入）
- `exited` - 已退出

### 3.2 产品（Product）- 内容

```typescript
export interface Product {
  id: number
  slug: string
  title: string
  type: 'review' | 'guide' | 'tutorial' | 'list' | 'news'
  content: string
  excerpt?: string

  // SEO
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string

  // 状态
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived'

  // 元数据
  wordCount: number
  aiGenerated: boolean
  aiModel?: string

  // 审核信息
  reviewedBy?: number
  reviewComment?: string
  reviewedAt?: string

  // 发布信息
  publishedAt?: string

  createdAt: string
  updatedAt: string

  // 关联数据
  markets?: MarketOpportunity[]

  // ⚠️ 表现数据需从 AnalyticsController 获取
  views?: number
  clicks?: number
  conversions?: number
  revenue?: string
}
```

**状态定义**：
- `draft` - 研发中（内容创作中）
- `review` - 待审核（质检中）
- `approved` - 已通过（可上市）
- `published` - 已上市（营销中）
- `archived` - 已下架（退出市场）

### 3.3 发布任务（PublishTask）

```typescript
export interface PublishTask {
  id: number
  productId: number
  platform: string
  status: 'pending' | 'running' | 'success' | 'failed'

  publishedUrl?: string
  errorMessage?: string

  // 表现数据
  views: number
  clicks: number
  conversions: number
  revenue: string

  lastSyncedAt?: string

  createdAt: string
  updatedAt: string
}
```

### 3.4 发布平台（PublishPlatform）

```typescript
export interface PublishPlatform {
  id: number
  name: string
  displayName: string
  enabled: boolean
  config?: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
  lastTestAt?: string

  createdAt: string
  updatedAt: string

  // ⚠️ 统计数据需从 AnalyticsController 获取
  publishedCount?: number
  totalViews?: number
  totalClicks?: number
  totalConversions?: number
  totalRevenue?: string
}
```

---

## 4. API设计

### 4.1 API可用性状态

```typescript
// ✅ MarketsController - 完全可用
export const marketsApi = {
  list: (params?) => api.get('/api/v1/markets', params),
  get: (asin) => api.get(`/api/v1/markets/${asin}`),
  create: (data) => api.post('/api/v1/markets', data),
  fetch: (asin) => api.post('/api/v1/markets/fetch', { asin }),
  updateStatus: (asin, status) => api.post(`/api/v1/markets/${asin}/status`, { status }),
  aiRecommend: () => api.get('/api/v1/markets/ai-recommend'),
  getProducts: (asin) => api.get(`/api/v1/markets/${asin}/products`),
}

// ⚠️ ProductsController - 暂不可用，使用演示数据
export const productsApi = {
  list: (params?) => Promise.resolve(getDemoProducts(params)),
  get: (id) => Promise.resolve(getDemoProduct(id)),
  create: (data) => Promise.resolve(getDemoCreateResponse(data)),
  update: (id, data) => Promise.resolve(getDemoUpdateResponse(id, data)),
  delete: (id) => Promise.resolve({ success: true }),
  review: (id, action, comment?) => Promise.resolve(getDemoReviewResponse(id, action)),
  linkMarkets: (id, marketIds) => Promise.resolve({ success: true }),
  generate: (data) => Promise.resolve(getDemoGeneratedContent(data)),
}

// ✅ Marketing API - 使用后端实际路径 /publish
export const marketingApi = {
  listPlatforms: () => api.get('/api/v1/publish/platforms'),
  addPlatform: (data) => api.post('/api/v1/publish/platforms', data),
  testPlatform: (id) => api.post(`/api/v1/publish/platforms/${id}/test`),

  listTasks: (params?) => api.get('/api/v1/publish/tasks', params),
  createTask: (data) => api.post('/api/v1/publish/tasks', data),
  batchPublish: (data) => api.post('/api/v1/publish/tasks/batch', data),
  retryTask: (id) => api.post(`/api/v1/publish/tasks/${id}/retry`),
}

// ✅ AnalyticsController - 适配后端实际端点
export const analyticsApi = {
  // ✅ 后端已实现
  overview: () => api.get('/api/v1/analytics/stats'),
  products: () => api.get('/api/v1/analytics/content-performance'),
  trends: () => api.get('/api/v1/analytics/trends'),

  // ❌ 后端未实现，使用演示数据
  clicks: (params?) => Promise.resolve(getDemoClicks(params)),
  conversions: (params?) => Promise.resolve(getDemoConversions(params)),
  revenue: (params?) => Promise.resolve(getDemoRevenue(params)),
  markets: () => Promise.resolve(getDemoMarketPerformance()),
  platforms: () => Promise.resolve(getDemoPlatformPerformance()),
}
```

### 4.2 演示数据策略

```typescript
// lib/api-demo.ts

export function getDemoProducts(params?: { page?: number; size?: number }): ProductListResponse {
  return {
    products: [
      {
        id: 1,
        slug: 'sony-wh1000xm4-review',
        title: 'Sony WH-1000XM4 深度评测',
        type: 'review',
        content: '# Sony WH-1000XM4 深度评测\n\n...',
        excerpt: 'Sony最新旗舰降噪耳机的全面评测',
        status: 'published',
        wordCount: 2345,
        aiGenerated: true,
        aiModel: 'claude-3-opus',
        markets: [
          {
            id: 1,
            asin: 'B08N5KWB9H',
            title: 'Sony WH-1000XM4',
            price: '349.99',
            rating: '4.7',
            status: 'active',
          }
        ],
        views: 1234,
        clicks: 89,
        conversions: 5,
        revenue: '125.50',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ],
    total: 1,
    page: params?.page || 1,
    size: params?.size || 10,
  }
}

// ... 其他演示数据生成器
```

---

## 5. 页面设计

### 5.1 市场战略页面（`/strategy`）

**优先级**: P0
**API状态**: ✅ 完全可用
**UI风格**: 看板视图（Kanban）

**核心功能**：
- 看板视图：按市场状态分列（5列）
- AI推荐选品
- 一键采集ASIN
- 市场详情查看
- 状态流转管理

**组件结构**：
```
app/(content)/strategy/page.tsx
├── PageHeader
│   ├── AIRecommendButton
│   └── AddMarketButton
├── QuickFetchCard
├── StatusStatsCards (5个统计卡片)
├── MarketStatusBoard (看板)
│   ├── StatusColumn (watching)
│   ├── StatusColumn (targeting)
│   ├── StatusColumn (active)
│   ├── StatusColumn (saturated)
│   └── StatusColumn (exited)
└── AIRecommendDialog
```

**市场状态配置**：
```typescript
const marketStatusConfig = {
  watching: {
    label: '观察中',
    description: '有潜力，暂不进入',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: <Eye />,
    nextStatus: ['targeting', 'exited']
  },
  targeting: {
    label: '瞄准中',
    description: '准备进入',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: <Target />,
    nextStatus: ['active', 'watching']
  },
  active: {
    label: '活跃市场',
    description: '正在产出内容',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: <TrendingUp />,
    nextStatus: ['saturated', 'exited']
  },
  saturated: {
    label: '已饱和',
    description: '竞争激烈，减少投入',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: <AlertTriangle />,
    nextStatus: ['exited']
  },
  exited: {
    label: '已退出',
    description: '不再推广',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    icon: <XCircle />,
    nextStatus: []
  }
}
```

### 5.2 产品中心页面（`/products`）

**优先级**: P2
**API状态**: ⚠️ 暂不可用（使用演示数据）
**UI风格**: 看板视图（Kanban）

**核心功能**：
- 看板视图：按内容状态分列（5列）
- 创建内容
- AI辅助创作
- 内容审核
- 关联市场机会

**组件结构**：
```
app/(content)/products/page.tsx
├── PageHeader
│   ├── CreateProductButton
│   └── AIGenerateButton
├── StatusStatsCards (5个统计卡片)
├── ProductStatusBoard (看板)
│   ├── StatusColumn (draft)
│   ├── StatusColumn (review)
│   ├── StatusColumn (approved)
│   ├── StatusColumn (published)
│   └── StatusColumn (archived)
├── CreateProductDialog
└── AIGenerateDialog
```

**产品状态配置**：
```typescript
const productStatusConfig = {
  draft: {
    label: '研发中',
    description: '内容创作中',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: <Edit />,
    nextStatus: ['review']
  },
  review: {
    label: '待审核',
    description: '质检中',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    icon: <Clock />,
    nextStatus: ['approved', 'draft']
  },
  approved: {
    label: '已通过',
    description: '可上市',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: <CheckCircle />,
    nextStatus: ['published']
  },
  published: {
    label: '已上市',
    description: '营销中',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: <Send />,
    nextStatus: ['archived']
  },
  archived: {
    label: '已下架',
    description: '退出市场',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100',
    icon: <Archive />,
    nextStatus: []
  }
}
```

### 5.3 营销中心页面（`/marketing`）

**优先级**: P3
**API状态**: ⚠️ 部分可用（使用 `/publish` 路径）
**UI风格**: 保持当前布局

**核心功能**：
- 平台卡片展示
- 批量发布
- 发布任务列表
- 状态追踪
- 失败重试

**组件结构**：
```
app/(content)/marketing/page.tsx
├── PageHeader
│   ├── BatchPublishButton
│   └── CreateTaskButton
├── PlatformCardsGrid
│   └── PlatformCard (多个)
├── Tabs (任务列表)
│   ├── TabsList
│   └── TaskList
├── BatchPublishDialog
└── CreateTaskDialog
```

### 5.4 数据分析页面（`/analytics`）

**优先级**: P1
**API状态**: ⚠️ 部分可用（部分演示数据）
**UI风格**: 仪表盘 + 图表

**核心功能**：
- 总览仪表盘（4个核心指标）
- 趋势图表（点击/转化/收益）
- 表现排名（市场/产品/渠道）

**组件结构**：
```
app/(content)/analytics/page.tsx
├── PageHeader
│   ├── ExportButton
│   └── SyncButton
├── MetricCards (4个核心指标)
│   ├── MetricCard (总点击)
│   ├── MetricCard (总转化)
│   ├── MetricCard (转化率)
│   └── MetricCard (总收益)
├── TrendChart
│   └── AnalyticsChart
└── RankingCards (3个排名)
    ├── RankingCard (最佳市场)
    ├── RankingCard (最佳产品)
    └── RankingCard (最佳渠道)
```

---

## 6. 共享组件

### 6.1 市场卡片（`components/market-card.tsx`）

**功能**：
- 显示市场基本信息（标题、ASIN、价格、评分）
- 显示统计数据（仅活跃市场）
- 操作按钮（详情、状态变更）

### 6.2 产品卡片（`components/product-card.tsx`）

**功能**：
- 显示产品基本信息（标题、类型、字数）
- 显示关联市场
- 显示表现数据（已上市产品）
- 操作按钮（编辑、审核、发布）

### 6.3 平台卡片（`components/platform-card.tsx`）

**功能**：
- 显示平台状态（连接状态）
- 显示统计数据
- 操作按钮（测试、配置）

### 6.4 分析图表（`components/analytics-chart.tsx`）

**功能**：
- 支持多种图表类型（点击/转化/收益）
- 支持时间范围选择
- 使用 Recharts 库

---

## 7. 导航菜单更新

```typescript
// components/unified-sidebar.tsx

const navItems: NavItem[] = [
  // Vue微应用 - 控制台功能（保持）
  { id: 'dashboard', label: '仪表板', icon: '📊', path: '/dashboard', type: 'vue', category: '控制台' },
  { id: 'experiments', label: '实验管理', icon: '🔬', path: '/experiments', type: 'vue', category: '控制台' },
  { id: 'plugins', label: '插件市场', icon: '🔌', path: '/plugins', type: 'vue', category: '控制台' },
  { id: 'settlements', label: '佣金结算', icon: '💰', path: '/settlements', type: 'vue', category: '控制台' },

  // React原生组件 - 内容企业核心模块（重构）✅
  { id: 'strategy', label: '市场战略', icon: '🎯', path: '/strategy', type: 'react', category: '内容企业' },
  { id: 'products', label: '产品中心', icon: '📄', path: '/products', type: 'react', category: '内容企业' },
  { id: 'marketing', label: '营销中心', icon: '📢', path: '/marketing', type: 'react', category: '内容企业' },
  { id: 'analytics', label: '数据分析', icon: '📈', path: '/analytics', type: 'react', category: '内容企业' },

  // 博客系统（保持）
  { id: 'blog-home', label: '博客首页', icon: '📝', path: '/blog', type: 'react', category: '博客' },
  { id: 'blog-admin', label: '文章管理', icon: '📚', path: '/blog/admin', type: 'react', category: '博客' },
  { id: 'blog-categories', label: '分类管理', icon: '🏷️', path: '/blog/admin/categories', type: 'react', category: '博客' },
  { id: 'blog-settings', label: '博客设置', icon: '⚙️', path: '/blog/admin/settings', type: 'react', category: '博客' },
]
```

---

## 8. 工具函数

### 8.1 货币格式化

```typescript
// lib/utils/currency.ts

export function formatCurrency(value: string | number | undefined): string {
  if (!value) return '0.00'

  const num = typeof value === 'string' ? parseFloat(value) : value

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num)
}
```

### 8.2 评分格式化

```typescript
export function formatRating(value: string | number | undefined): string {
  if (!value) return '-'

  const num = typeof value === 'string' ? parseFloat(value) : value

  return num.toFixed(1)
}
```

### 8.3 转化率计算

```typescript
export function calculateConversionRate(clicks: number, conversions: number): string {
  if (clicks === 0) return '0.00'

  const rate = (conversions / clicks) * 100
  return rate.toFixed(2)
}
```

---

## 9. 实施计划

### 9.1 开发优先级

1. **P0 - 市场战略页面**（`/strategy`）
   - API状态：✅ 完全可用
   - 预计时间：2小时
   - 可以立即开始

2. **P1 - 数据分析页面**（`/analytics`）
   - API状态：⚠️ 部分可用
   - 预计时间：2.5小时
   - 使用部分演示数据

3. **P2 - 产品中心页面**（`/products`）
   - API状态：⚠️ 暂不可用
   - 预计时间：2小时
   - 使用演示数据

4. **P3 - 营销中心页面**（`/marketing`）
   - API状态：⚠️ 部分可用
   - 预计时间：1.5小时
   - 迁移现有代码

5. **P4 - 导航菜单更新**
   - 预计时间：0.5小时
   - 优先级最高，最先完成

### 9.2 依赖关系

```
导航菜单更新
    ↓
市场战略页面（P0）
    ↓
数据分析页面（P1）
    ↓
产品中心页面（P2）
    ↓
营销中心页面（P3）
```

---

## 10. 验收标准

### 10.1 功能验收

**市场战略页面**：
- [ ] 可以通过AI推荐获取市场机会
- [ ] 可以通过ASIN一键采集产品信息
- [ ] 可以查看市场列表（按状态分类）
- [ ] 可以更改市场状态
- [ ] 可以查看市场关联的内容

**产品中心页面**：
- [ ] 可以创建内容并关联市场
- [ ] 可以查看内容列表（按状态分类）
- [ ] 可以审核内容
- [ ] 可以查看内容的发布状态
- [ ] 可以查看内容的表现数据

**营销中心页面**：
- [ ] 可以配置发布平台（Blogger、Medium）
- [ ] 可以从内容库选择内容发布
- [ ] 可以批量发布到多平台
- [ ] 可以查看发布任务状态
- [ ] 可以重试失败的发布任务

**数据分析页面**：
- [ ] 可以查看总览数据（点击、转化、收益）
- [ ] 可以查看趋势图表
- [ ] 可以查看各市场表现排名
- [ ] 可以查看各内容表现排名
- [ ] 可以查看各平台表现排名

### 10.2 技术验收

- [ ] 本地前端启动成功
- [ ] API调用正常（真实API + 演示数据降级）
- [ ] 页面路由正常
- [ ] 导航菜单正确
- [ ] 响应式布局正常
- [ ] 无TypeScript类型错误

---

## 11. 风险与注意事项

### 11.1 数据迁移

**风险**：旧的 `/products` 页面数据与新的 `/strategy` 页面数据模型不完全一致

**应对**：
- 前端使用新的数据模型
- 后端API已适配新模型
- 演示数据使用新模型

### 11.2 API可用性

**风险**：部分API暂不可用可能影响功能完整性

**应对**：
- 所有API调用都有演示数据降级方案
- 清晰标注API状态
- 后端就绪后可无缝切换

### 11.3 路由变更

**风险**：用户可能收藏了旧路由

**应对**：
- 考虑添加路由重定向（可选）
- 在导航菜单中明确新路径
- 更新文档说明

### 11.4 命名混淆

**风险**：新的"产品"=内容，可能与旧概念混淆

**应对**：
- 在UI中明确标注（例如："产品中心（内容）"）
- 使用图标辅助识别
- 团队统一认知

---

## 12. 后续优化

### 12.1 性能优化

- 实现虚拟滚动（大量卡片时）
- 添加分页支持
- 优化图表渲染

### 12.2 用户体验

- 添加拖拽排序（看板）
- 实现批量操作
- 添加快捷键支持

### 12.3 数据可视化

- 使用专业图表库（Recharts）
- 添加数据导出功能
- 实现自定义报表

---

## 13. 参考资料

- 总体规划文档：`docs/plans/2026-03-06-content-business-master-plan.md`
- 项目状态记录：`docs/0306_Project_status.md`
- 后端API文档：待补充
- 设计原型：待补充

---

**文档版本**: v1.0
**创建时间**: 2026-03-06
**状态**: 已批准，准备实施
**下一步**: 调用 writing-plans 技能创建详细实施计划
