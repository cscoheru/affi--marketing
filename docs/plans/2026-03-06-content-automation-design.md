# 内容自动化系统设计文档

**创建日期**: 2026-03-06
**状态**: 设计中
**作者**: Claude Code (GLM-5)

---

## 1. 问题分析

### 1.1 当前痛点

| 环节 | 现状 | 问题 |
|------|------|------|
| **选品** | 手动浏览 Amazon | 无数据支撑、耗时 |
| **素材采集** | 复制粘贴 | 效率低、易出错 |
| **内容创作** | 手动写作 | 创作瓶颈、质量不稳定 |
| **审核** | 人工审核 | 效率低 |

### 1.2 期望工作流

```
选品工作台 ──→ 素材采集 ──→ AI审核 ──→ AI创作 ──→ 用户审核 ──→ 发布
     ↑              ↑            ↑           ↑
   数据+AI      自动化入库    质量过滤    素材整合
```

---

## 2. 技术可行性分析

### 2.1 Amazon 爬虫测试结果

| 测试项 | 结果 | 说明 |
|--------|------|------|
| 直接 HTTP 请求 | ❌ 被阻止 | 返回 404/验证码 |
| Playwright headless | ❌ 超时/404 | 反爬机制检测 |
| 带反检测参数 | ❌ 部分失败 | 仍被识别 |

**结论**: Amazon 反爬机制严格，直接爬取不可靠。

### 2.2 替代方案

| 方案 | 可行性 | 成本 | 推荐度 |
|------|--------|------|--------|
| **Amazon Product Advertising API** | ✅ 官方支持 | 免费(联盟会员) | ⭐⭐⭐⭐⭐ **[已选择]** |
| **第三方数据API** (Rainforest/ScraperAPI) | ✅ 可靠 | $50-200/月 | ⭐⭐⭐⭐ **[备选]** |
| **浏览器插件** (用户触发) | ✅ 可行 | 开发成本 | ⭐⭐⭐⭐ |
| **代理池 + Playwright** | ⚠️ 不稳定 | 代理费用 | ⭐⭐ |

### 2.3 数据获取策略决策

**决策**: 优先使用 Amazon Product Advertising API
- 如果官方 API 收费或不可用，回退到第三方数据服务 (Rainforest API)
- YouTube 素材使用 `youtube-transcript-api` (已验证可用)

### 2.3 YouTube 爬虫

| 测试项 | 结果 | 说明 |
|--------|------|------|
| youtube-transcript-api | ✅ 可用 | 获取字幕成功 |
| 视频元数据 | ✅ 可用 | 需要进一步测试 |

---

## 3. 数据模型设计

### 3.1 新增表: products (选品)

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    asin VARCHAR(20) NOT NULL UNIQUE,          -- Amazon ASIN
    name VARCHAR(500) NOT NULL,                 -- 产品名称
    brand VARCHAR(200),                         -- 品牌
    category VARCHAR(200),                      -- 类别
    price DECIMAL(10,2),                        -- 当前价格
    original_price DECIMAL(10,2),               -- 原价
    currency VARCHAR(10) DEFAULT 'USD',         -- 货币
    rating DECIMAL(3,2),                        -- 评分 (1-5)
    review_count INTEGER DEFAULT 0,             -- 评论数
    sales_rank INTEGER,                         -- 销售排名
    image_url TEXT,                             -- 主图URL
    product_url TEXT,                           -- 产品链接
    marketplace VARCHAR(20) DEFAULT 'amazon.com', -- 站点
    -- AI 推荐字段
    ai_score DECIMAL(5,2),                      -- AI推荐评分
    ai_recommendation TEXT,                     -- AI推荐理由
    ai_analysis JSONB,                          -- AI分析详情
    -- 状态字段
    status VARCHAR(50) DEFAULT 'pending',       -- pending/selected/rejected
    selected_at TIMESTAMP,                      -- 选定时间
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_ai_score ON products(ai_score DESC);
```

### 3.2 扩展表: materials (素材)

```sql
-- 在现有 materials 表基础上扩展
ALTER TABLE materials ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS product_id BIGINT REFERENCES products(id);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS raw_content TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS ai_quality_score DECIMAL(5,2);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS ai_key_points JSONB;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS review_result JSONB;

-- 素材来源类型
-- 'amazon_review' - Amazon评论
-- 'youtube_transcript' - YouTube字幕
-- 'product_description' - 产品描述
-- 'manual_upload' - 手动上传
-- 'external_article' - 外部文章
```

### 3.3 新增表: content_generation_tasks (内容生成任务)

```sql
CREATE TABLE content_generation_tasks (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id),
    -- 关联的素材
    material_ids JSONB,                         -- [1, 2, 3]
    -- 生成配置
    content_type VARCHAR(50) NOT NULL,          -- review/guide/comparison/science
    target_platform VARCHAR(50),                -- blogger/medium/social
    target_keywords JSONB,                      -- ["keyword1", "keyword2"]
    tone VARCHAR(50) DEFAULT 'professional',    -- professional/casual/technical
    length VARCHAR(20) DEFAULT 'medium',        -- short/medium/long
    -- 生成结果
    generated_title VARCHAR(500),
    generated_content TEXT,
    generated_slug VARCHAR(500),
    seo_metadata JSONB,                         -- {meta_description, keywords}
    -- AI 处理状态
    status VARCHAR(50) DEFAULT 'pending',       -- pending/processing/completed/failed
    ai_model VARCHAR(50),                       -- 使用的AI模型
    tokens_used INTEGER,
    error_message TEXT,
    -- 审核字段
    user_reviewed BOOLEAN DEFAULT FALSE,
    user_edits TEXT,                            -- 用户修改后的内容
    final_content TEXT,                         -- 最终确认的内容
    -- 时间戳
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_content_tasks_product ON content_generation_tasks(product_id);
CREATE INDEX idx_content_tasks_status ON content_generation_tasks(status);
```

---

## 4. API 设计

### 4.1 选品 API

```
POST /api/v1/products
  - 创建产品（手动输入或爬取）

GET /api/v1/products
  - 列出产品（支持筛选、排序）

POST /api/v1/products/:id/fetch
  - 触发采集产品信息和评论

POST /api/v1/products/recommend
  - AI推荐产品
```

### 4.2 素材 API

```
POST /api/v1/materials/fetch
  - 触发素材采集（Amazon评论/YouTube字幕）

POST /api/v1/materials/:id/review
  - AI审核素材质量

POST /api/v1/materials/batch-review
  - 批量AI审核
```

### 4.3 内容生成 API

```
POST /api/v1/content-tasks
  - 创建内容生成任务

POST /api/v1/content-tasks/:id/generate
  - 触发AI生成

POST /api/v1/content-tasks/:id/approve
  - 用户审核通过

PUT /api/v1/content-tasks/:id
  - 用户修改内容
```

---

## 5. 前端工作流设计

### 5.1 选品工作台

```
┌─────────────────────────────────────────────────────────────────┐
│  选品工作台                                        [AI推荐] [刷新] │
├─────────────────────────────────────────────────────────────────┤
│  筛选: [全部 ▼] [价格范围] [评分] [类别]                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ 产品图片 │ │ 产品图片 │ │ 产品图片 │ │ 产品图片 │              │
│  │ 名称    │ │ 名称    │ │ 名称    │ │ 名称    │              │
│  │ $XX.XX  │ │ $XX.XX  │ │ $XX.XX  │ │ $XX.XX  │              │
│  │ ⭐4.5   │ │ ⭐4.2   │ │ ⭐4.8   │ │ ⭐3.9   │              │
│  │ AI: 85分│ │ AI: 72分│ │ AI: 91分│ │ AI: 65分│              │
│  │ [选定]  │ │ [选定]  │ │ [选定]  │ │ [选定]  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 素材到内容工作流

```
┌─────────────────────────────────────────────────────────────────┐
│  内容自动化工作流                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  1.采集  │ ─→ │ 2.AI审核 │ ─→ │ 3.AI创作 │ ─→ │ 4.确认   │ │
│  │   素材   │    │   素材   │    │   内容   │    │   发布   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│       ↓               ↓               ↓               ↓        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ 15条评论 │    │ 12条通过 │    │ 1篇文章  │    │ 人工审核 │ │
│  │ 2个视频  │    │ 2个通过  │    │ 已生成   │    │   通过   │ │
│  │ [采集中] │    │ [审核中] │    │ [生成中] │    │ [已发布] │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 实施计划

### Phase 1: 基础架构 (P0-P1)

- [x] Amazon 爬虫可行性测试
- [ ] 数据库迁移脚本
- [ ] 后端 API 实现
- [ ] AI 服务接口对接

### Phase 2: 前端整合 (P2)

- [ ] 选品工作台 UI
- [ ] 素材采集触发 UI
- [ ] 工作流状态展示

### Phase 3: 优化完善 (P3)

- [ ] AI 推荐算法优化
- [ ] 多站点支持
- [ ] 性能优化

---

## 7. 技术决策记录

### 7.1 Amazon 数据获取方案

**决策**: 采用混合方案
1. 优先尝试 Playwright 自动采集
2. 失败时提供手动输入/浏览器插件方案
3. 长期考虑接入 Amazon Product Advertising API

**理由**:
- 直接爬取不稳定，但成本最低
- 需要有备选方案保证可用性
- 官方 API 需要联盟账号，可作为后续优化

### 7.2 AI 服务选择

**决策**: 使用现有 ai-service (FastAPI)
- 已部署: ai-api.zenconsult.top
- 支持: Qwen, OpenAI, ChatGLM

**用途**:
1. 素材审核: 评分 + 关键点提取
2. 内容生成: 基于素材生成文章
3. SEO 优化: 关键词、元描述生成

---

*文档持续更新中...*
