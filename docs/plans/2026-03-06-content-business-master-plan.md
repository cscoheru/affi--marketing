# 内容企业系统 - 总体规划

## 1. 战略定位

**我们是什么？**
- 我们是内容企业，不是Amazon推广员
- 我们的核心产品是内容，不是Amazon商品
- Amazon是我们的变现渠道，不是我们的客户

**我们的目标？**
- 阶段1：验证商业模式（联盟佣金能否赚钱）
- 阶段2：积累客户资产（订阅者、粉丝）
- 阶段3：建立独立品牌（独立站、DTC）

## 2. 三阶段路线图

### P0 - 商业模式验证（当前目标）

**目标：跑通联盟赚钱闭环**

```
选品 → 内容 → 发布 → 转化 → 佣金
```

**核心指标：**
- 月佣金收入 > $100
- 内容产出效率 > 10篇/周
- 发布成功率 > 90%
- 转化率 > 2%

**四大模块：**
1. 市场战略（选品）
2. 产品研发（内容创作）
3. 客户触达（发布）
4. 转化追踪（数据）

### P1 - 业务增长（P0跑通后）

**目标：扩大规模、提升效率**

**新增功能：**
- 客户画像（匿名用户分析）
- 内容偏好分析
- 渠道效果对比
- AI内容生成优化
- 自动化发布调度

### P2 - 品牌建设（长期目标）

**目标：建立独立品牌和客户资产**

**新增功能：**
- 完整CRM系统
- 邮件订阅管理
- 独立站支持
- 会员体系
- DTC销售

---

## 3. P0 四大模块详细设计

### 3.1 模块总览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        P0 系统架构                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │  市场战略    │  │  产品研发    │  │  客户触达    │  │ 转化追踪 ││
│  │  Strategy    │  │  Product     │  │  Marketing   │  │Analytics ││
│  │              │  │              │  │              │  │          ││
│  │ • AI推荐选品 │  │ • 素材采集   │  │ • 平台管理   │  │• 点击追踪││
│  │ • 一键采集   │  │ • 内容创作   │  │ • 批量发布   │  │• 转化数据││
│  │ • 市场状态   │  │ • 质量审核   │  │ • 发布队列   │  │• 收益统计││
│  │ • 关联内容   │  │ • 关联市场   │  │ • 状态追踪   │  │• 表现分析││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│         │                 │                 │               │       │
│         └─────────────────┴─────────────────┴───────────────┘       │
│                                    │                                │
│                                    v                                │
│                         ┌──────────────────┐                       │
│                         │    数据层        │                       │
│                         │  PostgreSQL      │                       │
│                         └──────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据模型

#### 3.2.1 市场机会表 (market_opportunities)

```sql
-- 市场机会（原products表重新定位）
CREATE TABLE market_opportunities (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) UNIQUE NOT NULL,          -- Amazon ASIN
    title VARCHAR(500) NOT NULL,                -- 产品标题
    category VARCHAR(100),                      -- 品类
    price DECIMAL(10,2),                        -- 价格
    rating DECIMAL(3,2),                        -- 评分
    review_count INT DEFAULT 0,                 -- 评论数
    image_url VARCHAR(1000),                    -- 图片

    -- 市场状态
    status VARCHAR(20) DEFAULT 'watching',      -- watching/targeting/active/saturated/exited

    -- 市场评估
    market_size VARCHAR(20),                    -- large/medium/small
    competition_level VARCHAR(20),              -- high/medium/low
    content_potential VARCHAR(20),              -- high/medium/low
    ai_score INT,                               -- AI推荐评分

    -- 统计数据（从关联内容汇总）
    content_count INT DEFAULT 0,                -- 关联内容数量
    total_clicks INT DEFAULT 0,                 -- 总点击
    total_conversions INT DEFAULT 0,            -- 总转化
    total_revenue DECIMAL(10,2) DEFAULT 0,      -- 总收益

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.2 产品表 (products) - 内容即产品

```sql
-- 产品（内容）表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE NOT NULL,          -- URL友好标识
    title VARCHAR(500) NOT NULL,                -- 标题
    type VARCHAR(20) NOT NULL,                  -- review/guide/tutorial/list/news
    content TEXT NOT NULL,                      -- 内容正文
    excerpt VARCHAR(500),                       -- 摘要

    -- SEO
    seo_title VARCHAR(200),
    seo_description VARCHAR(500),
    seo_keywords VARCHAR(500),

    -- 状态
    status VARCHAR(20) DEFAULT 'draft',         -- draft/review/approved/published/archived

    -- 元数据
    word_count INT DEFAULT 0,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),

    -- 审核信息
    reviewed_by INT,
    review_comment TEXT,
    reviewed_at TIMESTAMP,

    -- 发布信息
    published_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 产品与市场的关联（多对多）
CREATE TABLE product_markets (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),
    market_id INT REFERENCES market_opportunities(id),
    is_primary BOOLEAN DEFAULT FALSE,           -- 是否主要推广产品
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.3 发布任务表 (publish_tasks)

```sql
-- 发布任务
CREATE TABLE publish_tasks (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id),     -- 关联产品（内容）
    platform VARCHAR(50) NOT NULL,              -- blogger/medium/wordpress
    status VARCHAR(20) DEFAULT 'pending',       -- pending/running/success/failed

    -- 发布结果
    published_url VARCHAR(1000),                -- 发布后的URL
    error_message TEXT,

    -- 表现数据
    views INT DEFAULT 0,
    clicks INT DEFAULT 0,
    conversions INT DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,

    -- 同步状态
    last_synced_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 发布平台配置
CREATE TABLE publish_platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,           -- blogger/medium/wordpress
    display_name VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB,                               -- 平台配置（API密钥等）
    status VARCHAR(20) DEFAULT 'disconnected',  -- connected/disconnected/error
    last_test_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.2.4 转化追踪表 (conversion_events)

```sql
-- 点击事件
CREATE TABLE click_events (
    id SERIAL PRIMARY KEY,
    click_id VARCHAR(100) UNIQUE NOT NULL,      -- 唯一点击ID
    market_id INT REFERENCES market_opportunities(id),
    product_id INT REFERENCES products(id),
    platform VARCHAR(50),                       -- 来源平台

    -- 追踪信息
    user_fingerprint VARCHAR(100),              -- 设备指纹
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- 设备信息
    device_type VARCHAR(20),                    -- desktop/mobile/tablet
    browser VARCHAR(50),
    country VARCHAR(10),

    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转化事件（从Amazon Associates回传）
CREATE TABLE conversion_events (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100),                      -- Amazon订单ID
    click_id VARCHAR(100),                      -- 关联点击

    -- 商品信息
    market_id INT REFERENCES market_opportunities(id),
    asin VARCHAR(20),
    product_title VARCHAR(500),
    quantity INT DEFAULT 1,

    -- 金额
    product_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    commission DECIMAL(10,2),
    commission_rate DECIMAL(5,4),

    -- 时间
    ordered_at TIMESTAMP,
    shipped_at TIMESTAMP,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 模块1：市场战略

**前端页面：** `/strategy`

**功能清单：**

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| AI推荐选品 | 基于市场数据的智能推荐 | P0 |
| 一键采集 | 输入ASIN自动采集产品信息 | P0 |
| 市场看板 | 按状态分类展示市场机会 | P0 |
| 市场详情 | 显示市场信息和关联内容 | P0 |
| 状态变更 | 更改市场状态 | P0 |
| 表现统计 | 显示该市场的转化和收益 | P0 |

**界面设计：**

```
┌─────────────────────────────────────────────────────────────────────┐
│  市场战略                                     [AI洞察] [添加市场]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  一键采集：[输入ASIN________________] [采集]                        │
│                                                                     │
│  市场看板：                                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ 观察中(8) │ │ 瞄准中(3) │ │ 活跃(12)  │ │ 饱和/退出 │          │
│  │ watching  │ │ targeting │ │ active    │ │(saturated)│          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                     │
│  市场列表：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📦 Sony WH-1000XM4                    $349.99  ⭐4.7        │  │
│  │ 无线降噪耳机 | Electronics            活跃市场               │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ 关联内容: 3篇  点击: 234  转化: 12  收益: $456.78           │  │
│  │ [查看详情] [关联内容] [更新状态]                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 模块2：产品研发（内容）

**前端页面：** `/products`（注意：这里的产品=内容）

**功能清单：**

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| 内容列表 | 按状态分类展示内容 | P0 |
| 创建内容 | 新建内容，选择关联市场 | P0 |
| AI辅助创作 | 基于素材生成内容 | P0 |
| 素材采集 | 从Amazon/YouTube采集素材 | P0 |
| 内容审核 | 人工审核内容质量 | P0 |
| 关联市场 | 选择要推广的市场机会 | P0 |
| 发布状态 | 显示在哪些平台已发布 | P0 |

**界面设计：**

```
┌─────────────────────────────────────────────────────────────────────┐
│  产品中心（内容）                  [新建产品] [AI辅助创作] [素材采集]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  产品状态：                                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ 研发中(5) │ │ 待审核(3) │ │ 已通过(8) │ │ 已上市(15)│          │
│  │ draft     │ │ review    │ │ approved  │ │ published │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                     │
│  产品列表：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 📄 Sony WH-1000XM4 深度评测                                 │  │
│  │ 类型: 产品评测  字数: 2,345  状态: 已上市                   │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ 目标市场: Sony WH-1000XM4 (主), Bose QC45                   │  │
│  │ 上市渠道: ✅Blogger ✅Medium                                │  │
│  │ 产品表现: 👁 1,234  🖱 89  🎯 5  💰 $125.50                 │  │
│  │ [编辑] [审核] [发布] [查看数据]                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.5 模块3：客户触达（发布）

**前端页面：** `/marketing`

**功能清单：**

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| 平台管理 | 配置发布平台 | P0 |
| 发布队列 | 显示待发布内容 | P0 |
| 批量发布 | 一键发布到多平台 | P0 |
| 状态追踪 | 显示发布任务状态 | P0 |
| 失败重试 | 重新发布失败的任务 | P0 |
| 表现数据 | 显示各平台表现 | P0 |

**界面设计：**

```
┌─────────────────────────────────────────────────────────────────────┐
│  营销中心                                                [批量上架] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  销售渠道：                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│  │ Blogger │ │ Medium  │ │WordPress│ │ Twitter │                  │
│  │ ✅ 已连接│ │ ✅ 已连接│ │ ⚠️ 待配置│ │ ❌ 未连接│                  │
│  │ 15篇上架│ │ 12篇上架│ │   -     │ │   -     │                  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘                  │
│                                                                     │
│  上架队列：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 产品                      渠道        状态      表现          │  │
│  │ ─────────────────────────────────────────────────────────── │  │
│  │ Sony耳机深度评测         Blogger     ✅已上架  $125.50       │  │
│  │ Sony耳机深度评测         Medium      ✅已上架  $45.20        │  │
│  │ 2024耳机购买指南         Blogger     ⏳排队中  -             │  │
│  │ Anker充电宝评测          Medium      ❌上架失败 [重试]       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  渠道表现：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 平台      上架数   总浏览   总点击   总转化   总收益         │  │
│  │ Blogger   15      3,456    234      12       $456.78        │  │
│  │ Medium    12      2,345    156      8        $234.56        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.6 模块4：转化追踪

**前端页面：** `/analytics`

**功能清单：**

| 功能 | 描述 | 优先级 |
|-----|------|-------|
| 总览仪表盘 | 显示整体表现 | P0 |
| 点击统计 | 点击量、来源、趋势 | P0 |
| 转化统计 | 转化量、转化率、趋势 | P0 |
| 收益统计 | 佣金收入、趋势 | P0 |
| 市场表现 | 各市场的表现对比 | P0 |
| 产品表现 | 各内容的表现对比 | P0 |
| 渠道表现 | 各平台的表现对比 | P0 |

**界面设计：**

```
┌─────────────────────────────────────────────────────────────────────┐
│  数据分析                                        [导出报表] [同步数据]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  核心指标（本月）：                                                   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │
│  │ 总点击    │ │ 总转化    │ │ 转化率    │ │ 总收益    │          │
│  │   1,234   │ │    45     │ │   3.6%    │ │  $567.89  │          │
│  │  ↑12%    │ │  ↑8%     │ │  ↑0.5%   │ │  ↑15%    │          │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘          │
│                                                                     │
│  趋势图表：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [点击趋势图] [转化趋势图] [收益趋势图]                       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  表现排名：                                                          │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🏆 最佳市场（转化）                                          │  │
│  │ 1. Sony WH-1000XM4 - 12次转化 - $456.78                     │  │
│  │ 2. Bose QC45 - 8次转化 - $234.56                            │  │
│  │                                                             │  │
│  │ 🏆 最佳产品（内容）                                          │  │
│  │ 1. Sony耳机深度评测 - 5次转化 - $125.50                     │  │
│  │ 2. 2024耳机购买指南 - 3次转化 - $89.34                      │  │
│  │                                                             │  │
│  │ 🏆 最佳渠道                                                  │  │
│  │ 1. Blogger - 12次转化 - $456.78                             │  │
│  │ 2. Medium - 8次转化 - $234.56                               │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. API 设计

### 4.1 市场战略 API

```
GET    /api/v1/markets                    # 获取市场列表
GET    /api/v1/markets/:asin              # 获取市场详情
POST   /api/v1/markets                    # 创建市场机会
POST   /api/v1/markets/fetch              # 一键采集ASIN
PUT    /api/v1/markets/:asin              # 更新市场信息
POST   /api/v1/markets/:asin/status       # 更新市场状态
GET    /api/v1/markets/ai-recommend       # AI推荐市场
GET    /api/v1/markets/:asin/products     # 获取关联内容
```

### 4.2 产品研发 API

```
GET    /api/v1/products                   # 获取产品（内容）列表
GET    /api/v1/products/:id               # 获取产品详情
POST   /api/v1/products                   # 创建产品
PUT    /api/v1/products/:id               # 更新产品
DELETE /api/v1/products/:id               # 删除产品
POST   /api/v1/products/:id/review        # 审核产品
POST   /api/v1/products/:id/markets       # 关联市场
GET    /api/v1/products/:id/publish-tasks # 获取发布任务
POST   /api/v1/products/generate          # AI生成内容
```

### 4.3 客户触达 API

```
GET    /api/v1/marketing/platforms        # 获取平台列表
POST   /api/v1/marketing/platforms        # 添加平台
PUT    /api/v1/marketing/platforms/:id    # 更新平台配置
POST   /api/v1/marketing/platforms/:id/test # 测试平台连接

GET    /api/v1/marketing/tasks            # 获取发布任务
POST   /api/v1/marketing/tasks            # 创建发布任务
POST   /api/v1/marketing/tasks/batch      # 批量发布
POST   /api/v1/marketing/tasks/:id/retry  # 重试失败任务
```

### 4.4 转化追踪 API

```
GET    /api/v1/analytics/overview         # 获取总览数据
GET    /api/v1/analytics/clicks           # 点击统计
GET    /api/v1/analytics/conversions      # 转化统计
GET    /api/v1/analytics/revenue          # 收益统计
GET    /api/v1/analytics/markets          # 市场表现
GET    /api/v1/analytics/products         # 产品表现
GET    /api/v1/analytics/platforms        # 平台表现
POST   /api/v1/analytics/sync             # 手动同步数据
```

---

## 5. 实施任务分配

### 5.1 会话1：后端 + AI

**负责：数据模型、API、AI功能**

#### 任务清单

| 任务 | 文件 | 描述 |
|-----|------|------|
| T1.1 | `internal/model/content/types.go` | 更新数据模型（市场、产品、发布任务、转化事件） |
| T1.2 | `internal/controller/content/markets.go` | 市场战略控制器（新建） |
| T1.3 | `internal/controller/content/products.go` | 产品研发控制器（重构） |
| T1.4 | `internal/controller/content/marketing.go` | 营销中心控制器（重构publish） |
| T1.5 | `internal/controller/content/analytics.go` | 数据分析控制器（新建） |
| T1.6 | `pkg/amazon/client.go` | Amazon API客户端（已完成，需验证） |
| T1.7 | `pkg/tracking/tracker.go` | 点击追踪器（新建） |
| T1.8 | 数据库迁移 | 创建迁移脚本 |

#### 详细任务说明

**T1.1 数据模型更新**
```go
// 新建文件或在types.go中添加
type MarketOpportunity struct { ... }
type Product struct { ... }  // 重新定义，内容即产品
type ProductMarket struct { ... }  // 关联表
type PublishTask struct { ... }
type PublishPlatform struct { ... }
type ClickEvent struct { ... }
type ConversionEvent struct { ... }
```

**T1.2 市场战略控制器**
```go
// 主要方法
func (c *MarketsController) List(ctx *gin.Context)
func (c *MarketsController) Get(ctx *gin.Context)
func (c *MarketsController) Create(ctx *gin.Context)
func (c *MarketsController) Fetch(ctx *gin.Context)  // 一键采集
func (c *MarketsController) UpdateStatus(ctx *gin.Context)
func (c *MarketsController) AIRecommend(ctx *gin.Context)
func (c *MarketsController) GetProducts(ctx *gin.Context)  // 关联内容
```

**T1.3 产品研发控制器**
```go
// 主要方法（重构）
func (c *ProductsController) List(ctx *gin.Context)
func (c *ProductsController) Get(ctx *gin.Context)
func (c *ProductsController) Create(ctx *gin.Context)
func (c *ProductsController) Update(ctx *gin.Context)
func (c *ProductsController) Delete(ctx *gin.Context)
func (c *ProductsController) Review(ctx *gin.Context)  // 审核
func (c *ProductsController) LinkMarkets(ctx *gin.Context)  // 关联市场
func (c *ProductsController) Generate(ctx *gin.Context)  // AI生成
```

**T1.4 营销中心控制器**
```go
// 主要方法（重构原publish）
func (c *MarketingController) ListPlatforms(ctx *gin.Context)
func (c *MarketingController) AddPlatform(ctx *gin.Context)
func (c *MarketingController) TestPlatform(ctx *gin.Context)
func (c *MarketingController) ListTasks(ctx *gin.Context)
func (c *MarketingController) CreateTask(ctx *gin.Context)
func (c *MarketingController) BatchPublish(ctx *gin.Context)
func (c *MarketingController) RetryTask(ctx *gin.Context)
```

**T1.5 数据分析控制器**
```go
// 主要方法（新建）
func (c *AnalyticsController) Overview(ctx *gin.Context)
func (c *AnalyticsController) Clicks(ctx *gin.Context)
func (c *AnalyticsController) Conversions(ctx *gin.Context)
func (c *AnalyticsController) Revenue(ctx *gin.Context)
func (c *AnalyticsController) MarketPerformance(ctx *gin.Context)
func (c *AnalyticsController) ProductPerformance(ctx *gin.Context)
func (c *AnalyticsController) PlatformPerformance(ctx *gin.Context)
```

---

### 5.2 会话2：前端

**负责：四个模块的前端页面**

#### 任务清单

| 任务 | 文件 | 描述 |
|-----|------|------|
| T2.1 | `app/(content)/strategy/page.tsx` | 市场战略页面（新建） |
| T2.2 | `app/(content)/products/page.tsx` | 产品中心页面（重构） |
| T2.3 | `app/(content)/marketing/page.tsx` | 营销中心页面（重构publish） |
| T2.4 | `app/(content)/analytics/page.tsx` | 数据分析页面（新建） |
| T2.5 | `components/market-card.tsx` | 市场卡片组件（新建） |
| T2.6 | `components/product-card.tsx` | 产品卡片组件（新建） |
| T2.7 | `components/publish-task-item.tsx` | 发布任务项组件（新建） |
| T2.8 | `components/analytics-chart.tsx` | 分析图表组件（新建） |
| T2.9 | `lib/api.ts` | API客户端更新 |
| T2.10 | `components/unified-sidebar.tsx` | 导航菜单更新 |

#### 导航菜单更新

```tsx
// React原生组件 - 内容企业核心
{ id: 'strategy', label: '市场战略', icon: '🎯', path: '/strategy', type: 'react', category: '内容企业' },
{ id: 'products', label: '产品中心', icon: '📄', path: '/products', type: 'react', category: '内容企业' },
{ id: 'marketing', label: '营销中心', icon: '📢', path: '/marketing', type: 'react', category: '内容企业' },
{ id: 'analytics', label: '数据分析', icon: '📊', path: '/analytics', type: 'react', category: '内容企业' },
```

---

## 6. 验收标准

### 6.1 功能验收

**市场战略**
- [ ] 可以通过AI推荐获取市场机会
- [ ] 可以通过ASIN一键采集产品信息
- [ ] 可以查看市场列表（按状态分类）
- [ ] 可以更改市场状态
- [ ] 可以查看市场关联的内容

**产品中心**
- [ ] 可以创建内容并关联市场
- [ ] 可以查看内容列表（按状态分类）
- [ ] 可以审核内容
- [ ] 可以查看内容的发布状态
- [ ] 可以查看内容的表现数据

**营销中心**
- [ ] 可以配置发布平台（Blogger、Medium）
- [ ] 可以从内容库选择内容发布
- [ ] 可以批量发布到多平台
- [ ] 可以查看发布任务状态
- [ ] 可以重试失败的发布任务

**数据分析**
- [ ] 可以查看总览数据（点击、转化、收益）
- [ ] 可以查看趋势图表
- [ ] 可以查看各市场表现排名
- [ ] 可以查看各内容表现排名
- [ ] 可以查看各平台表现排名

### 6.2 技术验收

- [ ] 本地后端启动成功
- [ ] 本地前端启动成功
- [ ] 前后端联调通过
- [ ] 数据库迁移成功
- [ ] API响应正常

---

## 7. 风险与注意事项

1. **数据迁移**：原products表需要迁移为market_opportunities，需要处理现有数据
2. **命名混淆**：新的"产品"=内容，需要团队统一认知
3. **API兼容**：原API可能需要保留一段时间，做好版本管理
4. **演示模式**：后端未完成时，前端需要使用演示数据

---

**文档版本**: v1.0
**创建时间**: 2026-03-06
**状态**: 待分配任务
