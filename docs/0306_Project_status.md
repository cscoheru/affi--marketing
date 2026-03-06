# 项目状态记录 - 2026-03-06

## 会议参与者
- 用户（产品负责人/战略决策）
- Claude（AI助手/架构师）

## 核心认知转变

### 从"Amazon推广员"到"内容企业"

```
旧视角：我们是Amazon的推广员
产品(Amazon商品) → 内容(营销材料) → 发布(分发)

新视角：我们是内容企业
市场机会(选品) → 产品研发(内容创作) → 营销推广(发布) → 客户管理(转化追踪)
```

**关键洞察：**
- Amazon商品不是我们的产品，是我们选择的"市场"
- 内容才是我们的核心产品
- Amazon是变现渠道/合作方，不是我们的客户

## 业务模型定义

### 三阶段路线图

| 阶段 | 目标 | 核心关注 | 优先级 |
|-----|------|---------|-------|
| **P0** | 商业模式验证 | 跑通联盟赚钱闭环 | 现在实施 |
| P1 | 业务增长 | 扩大规模、提升效率 | P0跑通后 |
| P2 | 品牌建设 | 独立品牌、DTC、完整CRM | 长期目标 |

### P0 四大模块

1. **市场战略 (Strategy)** - 选品决策
2. **产品研发 (Product)** - 内容创作（内容=产品）
3. **客户触达 (Marketing)** - 多平台发布
4. **转化追踪 (Analytics)** - 数据分析

## 模块重新定义

### 模块映射（旧 → 新）

| 旧名称 | 新名称 | 战略定位 |
|-------|-------|---------|
| 产品管理 | **市场战略** | 选择进入哪个市场（选品=选赛道） |
| 内容管理 | **产品中心** | 我们的核心产品（内容=价值） |
| 发布中心 | **营销中心** | 推广我们的产品（发布=销售） |
| (新增) | **数据分析** | 转化追踪、效果分析 |

### 数据模型变更

```
原 products 表 → 拆分为：
├── market_opportunities (市场机会表)
│   └── 存储选品信息、市场状态、表现汇总
│
├── products (产品表 - 重新定义为内容)
│   └── 存储内容、状态、审核信息
│
├── product_markets (关联表)
│   └── 内容与市场的多对多关系
│
├── publish_tasks (发布任务表)
│   └── 发布状态、平台、表现数据
│
├── publish_platforms (发布平台表)
│   └── 平台配置、连接状态
│
├── click_events (点击事件表)
│   └── 追踪点击来源、设备信息
│
└── conversion_events (转化事件表)
    └── Amazon Associates回传数据
```

## 市场状态定义

```
watching    → 观察中（有潜力，暂不进入）
targeting   → 瞄准中（准备进入）
active      → 活跃市场（正在产出内容）
saturated   → 已饱和（竞争激烈，减少投入）
exited      → 已退出
```

## 产品（内容）状态定义

```
draft       → 研发中（创作中）
review      → 待审核（质检中）
approved    → 已通过（可上市）
published   → 已上市（营销中）
archived    → 已下架（退出市场）
```

## 客户关系讨论结论

**问题：谁是我们的客户？**

结论：
- 当前阶段，"客户"不是核心关注点
- **赚钱并验证商业模式才是目的**
- 联盟模式下CRM是有限度的（不拥有真正的客户关系）
- P0阶段做轻量级"转化追踪"即可
- 完整CRM留到P2阶段（独立站上线后）

**客户分层：**
```
Level 3: 购买者 (Buyers) - 在我们这里购买（未来）
Level 2: 订阅者 (Subscribers) - 邮件/关注（P1）
Level 1: 受众 (Audience) - 阅读/观看内容（现在）
```

## 已完成的工作

### 后端
- [x] Amazon Product Advertising API 客户端 (`pkg/amazon/client.go`)
- [x] AI推荐选品端点 (`/products/ai-recommend`)
- [x] 产品采集端点 (`/products/fetch`)
- [x] 路由顺序修复（`/ai-recommend` 在 `/:asin` 之前）

### 前端
- [x] 产品管理页面（旧版，需重构）
- [x] 内容管理页面（旧版，需重构）
- [x] 发布中心页面（旧版，需重构）
- [x] AI推荐选品对话框
- [x] 一键采集ASIN功能

### 文档
- [x] 总体规划文档 (`docs/plans/2026-03-06-content-business-master-plan.md`)

## 待分配任务

### 会话1：后端 + AI

| 任务ID | 任务 | 文件 |
|-------|------|------|
| T1.1 | 数据模型更新 | `internal/model/content/types.go` |
| T1.2 | 市场战略控制器 | `internal/controller/content/markets.go` (新建) |
| T1.3 | 产品研发控制器重构 | `internal/controller/content/products.go` |
| T1.4 | 营销中心控制器重构 | `internal/controller/content/marketing.go` |
| T1.5 | 数据分析控制器 | `internal/controller/content/analytics.go` (新建) |
| T1.6 | 点击追踪器 | `pkg/tracking/tracker.go` (新建) |
| T1.7 | 数据库迁移脚本 | `migrations/` |
| T1.8 | 路由注册更新 | `cmd/server/main.go` |

### 会话2：前端

| 任务ID | 任务 | 文件 |
|-------|------|------|
| T2.1 | 市场战略页面 | `app/(content)/strategy/page.tsx` (新建) |
| T2.2 | 产品中心页面重构 | `app/(content)/products/page.tsx` |
| T2.3 | 营销中心页面重构 | `app/(content)/marketing/page.tsx` |
| T2.4 | 数据分析页面 | `app/(content)/analytics/page.tsx` (新建) |
| T2.5 | 市场卡片组件 | `components/market-card.tsx` (新建) |
| T2.6 | 产品卡片组件 | `components/product-card.tsx` (新建) |
| T2.7 | 发布任务组件 | `components/publish-task-item.tsx` (新建) |
| T2.8 | 分析图表组件 | `components/analytics-chart.tsx` (新建) |
| T2.9 | API客户端更新 | `lib/api.ts` |
| T2.10 | 导航菜单更新 | `components/unified-sidebar.tsx` |

## 新的导航菜单结构

```tsx
// 内容企业核心模块
{ id: 'strategy', label: '市场战略', icon: '🎯', path: '/strategy' },
{ id: 'products', label: '产品中心', icon: '📄', path: '/products' },
{ id: 'marketing', label: '营销中心', icon: '📢', path: '/marketing' },
{ id: 'analytics', label: '数据分析', icon: '📊', path: '/analytics' },
```

## API 端点规划

### 市场战略
```
GET    /api/v1/markets                    # 市场列表
GET    /api/v1/markets/:asin              # 市场详情
POST   /api/v1/markets                    # 创建市场
POST   /api/v1/markets/fetch              # 一键采集
PUT    /api/v1/markets/:asin              # 更新市场
POST   /api/v1/markets/:asin/status       # 更新状态
GET    /api/v1/markets/ai-recommend       # AI推荐
GET    /api/v1/markets/:asin/products     # 关联内容
```

### 产品中心
```
GET    /api/v1/products                   # 产品列表
GET    /api/v1/products/:id               # 产品详情
POST   /api/v1/products                   # 创建产品
PUT    /api/v1/products/:id               # 更新产品
DELETE /api/v1/products/:id               # 删除产品
POST   /api/v1/products/:id/review        # 审核
POST   /api/v1/products/:id/markets       # 关联市场
POST   /api/v1/products/generate          # AI生成
```

### 营销中心
```
GET    /api/v1/marketing/platforms        # 平台列表
POST   /api/v1/marketing/platforms        # 添加平台
PUT    /api/v1/marketing/platforms/:id    # 更新配置
POST   /api/v1/marketing/platforms/:id/test # 测试连接
GET    /api/v1/marketing/tasks            # 任务列表
POST   /api/v1/marketing/tasks            # 创建任务
POST   /api/v1/marketing/tasks/batch      # 批量发布
POST   /api/v1/marketing/tasks/:id/retry  # 重试
```

### 数据分析
```
GET    /api/v1/analytics/overview         # 总览
GET    /api/v1/analytics/clicks           # 点击统计
GET    /api/v1/analytics/conversions      # 转化统计
GET    /api/v1/analytics/revenue          # 收益统计
GET    /api/v1/analytics/markets          # 市场表现
GET    /api/v1/analytics/products         # 产品表现
GET    /api/v1/analytics/platforms        # 平台表现
```

## 验收标准

### 功能验收
- [ ] 市场战略：AI推荐、一键采集、状态管理
- [ ] 产品中心：创建内容、关联市场、审核流程
- [ ] 营销中心：平台配置、批量发布、状态追踪
- [ ] 数据分析：总览、趋势、排名

### 技术验收
- [ ] 本地后端启动成功
- [ ] 本地前端启动成功
- [ ] 前后端联调通过
- [ ] 数据库迁移成功

## 风险与注意事项

1. **数据迁移**：原products表需迁移为market_opportunities
2. **命名统一**：新的"产品"=内容，需团队统一认知
3. **API兼容**：原API需保留一段时间
4. **演示模式**：后端未完成时前端使用演示数据
5. **Railway部署**：当前Railway部署有问题，本地优先

## 关键文件路径

```
设计文档：
├── docs/plans/2026-03-06-content-business-master-plan.md  # 总体规划
├── docs/plans/2026-03-06-product-lifecycle-design.md      # 生命周期设计（已过时）
└── docs/plans/2026-03-06-affiliate-content-system-design.md # 系统设计（已过时）

后端代码：
├── backend-go/internal/model/content/types.go            # 数据模型
├── backend-go/internal/controller/content/               # 控制器目录
├── backend-go/pkg/amazon/client.go                       # Amazon API客户端
└── backend-go/cmd/server/main.go                         # 服务入口

前端代码：
├── frontend-unified/app/(content)/                       # 内容模块页面
├── frontend-unified/components/                          # 组件目录
└── frontend-unified/lib/api.ts                           # API客户端
```

## 下一步行动

1. **分配任务**：将任务分配给两个会话（前端/后端+AI）
2. **后端优先**：先完成数据模型和API，前端使用演示数据开发
3. **本地验证**：本地跑通后再考虑Railway部署
4. **迭代开发**：按模块逐步完成，不追求一次完美

---

**记录时间**: 2026-03-06
**下次会议**: 待定
**状态**: 任务待分配
