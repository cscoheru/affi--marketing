# 内容生产自动化系统 - 完整计划

> **版本**: v2.0
> **创建时间**: 2026-03-04
> **范围**: 全链路自动化

---

## 🎯 系统目标

**愿景**: 从选品到追踪的全自动化内容生产链路

**核心价值**: 用最小的人工投入，持续产出高质量内容并获得收益

---

## 📊 完整流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        内容生产全流程自动化                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────┐  │
│  │  选品   │───►│ 素材搜集 │───►│ 内容创作 │───►│ 多平台 │───►│追踪 │  │
│  │Automation│   │Automation│   │Automation│   │发布自动化│   │  │  │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────┘  │
│       │             │              │              │             │      │
│       ▼             ▼              ▼              ▼             ▼      │
│   产品候选库     素材数据库      AI生成+人工    各大平台      数据   │
│   (Amazon)      (评论/图片)     质检           (Blogger等)    仪表板 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 系统架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Content Automation System                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                      前端控制台 (Vue)                          │    │
│  │  • 内容管理界面                                                 │    │
│  │  • 任务调度                                                     │    │
│  │  • 数据看板                                                     │    │
│  │  • 平台配置                                                     │    │
│  └──────────────────────┬─────────────────────────────────────────┘    │
│                         │ API                                             │
│  ┌──────────────────────▼─────────────────────────────────────────┐    │
│  │                   API Gateway (Go)                            │    │
│  │  • 用户认证                                                     │    │
│  │  • 权限控制                                                     │    │
│  │  • 请求路由                                                     │    │
│  └──────────────────────┬─────────────────────────────────────────┘    │
│                         │                                                 │
│         ┌───────────────┼───────────────┬───────────────┐              │
│         ▼               ▼               ▼               ▼              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │产品筛选服务 │ │素材搜集服务 │ │内容创作服务 │ │发布服务     │   │
│  │(Python)     │ │(Python)     │ │(Python+AI)  │ │(Python)     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│         │               │               │               │              │
│         ▼               ▼               ▼               ▼              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │Amazon API   │ │多源爬虫     │ │AI API       │ │平台API      │   │
│  │+爬虫        │ │+存储        │ │(Claude/GPT) │ │(Blogger等)  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                       共享数据层 (PostgreSQL)                  │    │
│  │  • products         • materials      • contents              │    │
│  │  • publish_logs     • tracking_data  • schedules             │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                       消息队列 (Redis/Celery)                  │    │
│  │  • 异步任务调度                                                 │    │
│  │  • 失败重试                                                     │    │
│  │  • 任务优先级                                                   │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 模块详细设计

### 模块1: 产品筛选自动化 (Product Hunter)

#### 功能
```
输入: 产品类目 (如 "Coffee Machines")
  │
  ▼
扫描: Amazon Best Sellers + 竞品分析
  │
  ▼
筛选: 价格$100-500, 评价1000+, 评分4.0+, 有联盟计划
  │
  ▼
输出: 候选产品列表 → 数据库
```

#### 技术实现
```python
# app/product_hunter/service.py

class ProductHunter:
    """产品筛选服务"""

    def scan_category(self, category: str) -> List[ProductCandidate]:
        """扫描类目，返回候选产品"""

    def check_eligibility(self, product: Product) -> bool:
        """检查是否符合推荐标准"""

    def analyze_competition(self, asin: str) -> CompetitionAnalysis:
        """分析竞品情况"""

    def save_candidates(self, products: List[Product]):
        """保存候选产品到数据库"""
```

#### 数据源
- **Amazon Product Advertising API** (官方)
- **Amazon Best Sellers 爬虫** (备用)
- **Keepa API** (价格历史)

---

### 模块2: 素材搜集自动化 (Material Collector)

#### 功能
```
输入: 产品 ASIN
  │
  ▼
┌─────────────────────────────────────┐
│  多源素材搜集                       │
│  • Amazon US 评论                  │
│  • Amazon UK 评论                  │
│  • YouTube 评测视频                 │
│  • Reddit 讨论                     │
│  • Quora 问答                      │
│  • 专业评测网站                     │
└─────────────────────────────────────┘
  │
  ▼
处理: 清洗、去重、情感分析
  │
  ▼
输出: 素材数据库
```

#### 技术实现
```python
# app/material_collector/collectors.py

class AmazonReviewsCollector:
    """Amazon 评论收集器"""

    def collect(self, asin: str, market: str = "US") -> List[Review]:
        """收集指定市场的评论"""

class YouTubeCollector:
    """YouTube 视频收集器"""

    def search_reviews(self, product_name: str) -> List[Video]:
        """搜索评测视频"""

    def get_transcript(self, video_id: str) -> str:
        """获取视频字幕"""

class RedditCollector:
    """Reddit 讨论收集器"""

    def search_discussions(self, product_name: str) -> List[Discussion]:
        """搜索相关讨论"""
```

#### 存储设计
```sql
-- 素材表
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20),
    source_type VARCHAR(50),  -- amazon_review, youtube, reddit, etc.
    source_id VARCHAR(100),
    raw_content JSONB,
    processed_content TEXT,
    sentiment_score DECIMAL,
    collected_at TIMESTAMP
);
```

---

### 模块3: 内容创作自动化 (Content Creator)

#### 功能
```
输入: 产品 ASIN + 素材
  │
  ▼
┌─────────────────────────────────────────────┐
│  AI 内容生成                               │
│  • 选题生成 (基于素材)                     │
│  • 大纲生成                                 │
│  • 正文撰写                                 │
│  • SEO 优化                                 │
│  • 图片生成 (DALL-E/Midjourney)            │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│  人工质检                                   │
│  • 内容审核                                 │
│  • 事实核查                                 │
│  • 风格调整                                 │
└─────────────────────────────────────────────┘
  │
  ▼
输出: 成品内容
```

#### 技术实现
```python
# app/content_creator/creator.py

class ContentCreator:
    """内容创作器"""

    def generate_topic(self, asin: str, materials: List[Material]) -> List[Topic]:
        """基于素材生成选题"""

    def generate_outline(self, topic: Topic) -> Outline:
        """生成文章大纲"""

    def generate_article(self, outline: Outline, style: str = "casual") -> Article:
        """生成文章正文"""
        # 调用 AI API (Claude/GPT)

    def optimize_seo(self, article: Article) -> Article:
        """SEO 优化"""

    def generate_images(self, article: Article) -> List[Image]:
        """生成配图"""
        # 调用 DALL-E/Midjourney API

class ContentReviewer:
    """内容质检器"""

    def check_quality(self, article: Article) -> ReviewResult:
        """检查内容质量"""

    def detect_ai_traces(self, text: str) -> float:
        """检测 AI 痕迹"""

    def check_affiliate_compliance(self, article: Article) -> bool:
        """检查联盟计划合规性"""
```

#### 内容模板系统
```python
# app/content_creator/templates.py

CONTENT_TEMPLATES = {
    "review_article": {
        "sections": ["intro", "pros", "cons", "verdict", "price", "conclusion"],
        "tone": "honest, casual",
        "min_length": 1500,
        "max_length": 3000
    },
    "science_article": {
        "sections": ["hook", "explanation", "myth_vs_fact", "practical_tips"],
        "tone": "educational",
        "min_length": 1200,
        "max_length": 2500
    },
    "buying_guide": {
        "sections": ["overview", "top_picks", "comparison", "recommendation"],
        "tone": "helpful",
        "min_length": 2000,
        "max_length": 4000
    }
}
```

---

### 模块4: 多平台发布自动化 (Publisher)

#### 功能
```
输入: 成品内容
  │
  ▼
┌─────────────────────────────────────────────┐
│  格式适配                                   │
│  • Markdown → HTML                        │
│  • 图片处理                                 │
│  • 外链插入                                 │
└─────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│  多平台发布                                   │
│  • Blogger (API)                            │
│  • Medium (Web/API)                         │
│  • WordPress (API)                          │
│  • LinkedIn (API)                           │
│  • 自己的博客 (API)                         │
└─────────────────────────────────────────────┘
  │
  ▼
输出: 发布报告 + 各平台链接
```

#### 技术实现
```python
# app/publisher/publisher.py

class MultiPlatformPublisher:
    """多平台发布器"""

    def publish(self, content: Content, platforms: List[str]) -> PublishReport:
        """一键发布到多平台"""

    def get_platform_links(self, task_id: str) -> Dict[str, str]:
        """获取各平台发布链接"""

class PlatformAdapter(ABC):
    """平台适配器基类"""

    @abstractmethod
    def format_content(self, content: Content) -> PlatformContent:
        """格式转换"""

    @abstractmethod
    def publish(self, content: PlatformContent) -> PublishResult:
        """发布内容"""

    @abstractmethod
    def get_status(self, post_id: str) -> PostStatus:
        """获取发布状态"""
```

---

### 模块5: 数据追踪自动化 (Analytics Tracker)

#### 功能
```
┌────────────────────────────────────────────────────────────────┐
│                      数据收集层                                  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ 平台API │  │ 像素追踪 │  │ 链接追踪 │  │ 转化追踪 │        │
│  │ (Medium │  │         │  │ (UTM)   │  │ (Amazon │        │
│  │ Blogger)│  │         │  │         │  │  Tag)   │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│       │            │            │            │                │
│       └────────────┴────────────┴────────────┘                │
│                      ▼                                        │
│              ┌──────────────┐                                  │
│              │ 统一数据仓库 │                                  │
│              └──────────────┘                                  │
└────────────────────────────────────────────────────────────────┘
```

#### 技术实现
```python
# app/analytics/tracker.py

class DataCollector:
    """数据收集器"""

    def collect_platform_stats(self) -> PlatformStats:
        """收集平台统计数据 (阅读量、点赞等)"""

    def collect_affiliate_clicks(self) -> List<ClickEvent]:
        """收集联盟点击数据"""

    def collect_conversion_data(self) -> List<ConversionEvent]:
        """收集转化数据"""

class PerformanceAnalyzer:
    """表现分析器"""

    def calculate_roi(self, content_id: str) -> ROIReport:
        """计算投资回报率"""

    def analyze_best_performing_topics(self) -> List<TopicInsight>
        """分析最佳选题"""

    def generate_recommendations(self) -> List<Recommendation>
        """生成优化建议"""
```

#### 追踪指标
```sql
-- 追踪数据表
CREATE TABLE tracking_events (
    id SERIAL PRIMARY KEY,
    content_id INTEGER,
    event_type VARCHAR(50),  -- view, click, conversion, etc.
    platform VARCHAR(50),
    url VARCHAR(500),
    referrer VARCHAR(500),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP
);

-- 每日统计表
CREATE TABLE daily_stats (
    date DATE,
    content_id INTEGER,
    platform VARCHAR(50),
    views INTEGER,
    clicks INTEGER,
    conversions INTEGER,
    revenue DECIMAL(10,2),
    PRIMARY KEY (date, content_id, platform)
);
```

---

## 🔄 数据流与任务调度

### 任务调度设计

```python
# app/scheduler/tasks.py

from celery import Celery

app = Celery('content_automation')

# 每日任务
@app.task(daily)
def daily_product_scan():
    """每日扫描新产品"""
    products = product_hunter.scan_category("Coffee Machines")
    # 保存到候选库

@app.task(daily)
def daily_content_generation():
    """每日内容生成"""
    candidates = get_uncovered_products()
    for product in candidates:
        content = creator.generate(product)
        review.review(content)

@app.task(daily)
def daily_publishing():
    """每日发布"""
    pending_contents = get_approved_contents()
    for content in pending_contents:
        publisher.publish(content)

@app.task(hourly)
def hourly_stats_collection():
    """每小时收集统计数据"""
    collector.collect_all_platforms()

@app.task(hourly)
def hourly_performance_analysis():
    """每小时分析表现"""
    analyzer.generate_reports()
```

### 工作流编排

```python
# app/workflows/content_pipeline.py

class ContentPipeline:
    """内容生产流水线"""

    def run_full_pipeline(self, product_asin: str):
        """运行完整流水线"""

        # 1. 搜集素材
        materials = collector.collect_all(asin)

        # 2. 生成内容
        content = creator.generate(asin, materials)

        # 3. 人工质检 (触发通知)
        review_result = review.request_review(content)

        if review_result.approved:
            # 4. 发布
            publish_report = publisher.publish(content)

            # 5. 开始追踪
            tracker.start_tracking(publish_report.links)

            return publish_report
        else:
            return {"status": "rejected", "reason": review_result.reason}
```

---

## 🎨 前端界面设计

### 主要页面

#### 1. 内容管理看板
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Content Dashboard                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 待发布   │  │ 已发布   │  │ 数据分析 │  │ 任务调度 │  │
│  │   12     │  │   48     │  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  快速操作: [✨ AI生成] [📤 批量发布] [📊 生成报告]         │
└─────────────────────────────────────────────────────────────┘
```

#### 2. 产品候选库
```
┌─────────────────────────────────────────────────────────────┐
│  📦 Product Candidates                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ De'Longhi ECAM 22.110                                │   │
│  │ $349 | 4.2★ | 1.2k reviews                         │   │
│  │ [生成内容] [查看素材] [添加到队列]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 3. 数据分析报告
```
┌─────────────────────────────────────────────────────────────┐
│  📈 Analytics                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  总收入: $1,234 | 总阅读: 45.6k | 转化率: 2.3%           │
│                                                             │
│  [最佳内容] [最佳平台] [最佳选题] [趋势图]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ 数据库设计

### 核心表结构

```sql
-- 产品候选表
CREATE TABLE product_candidates (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20) UNIQUE,
    title VARCHAR(500),
    category VARCHAR(100),
    price DECIMAL(10,2),
    rating DECIMAL(3,1),
    review_count INTEGER,
    affiliate_available BOOLEAN,
    competition_score INTEGER,
    potential_score INTEGER,
    status VARCHAR(50),  -- pending, researching, covered, ignored
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 素材表
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    asin VARCHAR(20),
    source_type VARCHAR(50),
    source_url TEXT,
    raw_content JSONB,
    processed_content TEXT,
    sentiment_score DECIMAL(3,2),
    collected_at TIMESTAMP,
    INDEX (asin)
);

-- 内容表
CREATE TABLE contents (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(200) UNIQUE,
    asin VARCHAR(20),
    title VARCHAR(500),
    content_type VARCHAR(50),  -- review, science, guide
    content_text TEXT,
    status VARCHAR(50),  -- draft, reviewing, approved, published
    ai_generated BOOLEAN,
    human_reviewed BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX (status)
);

-- 发布记录表
CREATE TABLE publish_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES contents(id),
    platform VARCHAR(50),
    platform_post_id VARCHAR(200),
    platform_url TEXT,
    status VARCHAR(50),  -- pending, success, failed
    error_message TEXT,
    published_at TIMESTAMP,
    INDEX (content_id, platform)
);

-- 追踪事件表
CREATE TABLE tracking_events (
    id SERIAL PRIMARY KEY,
    content_id INTEGER,
    publish_log_id INTEGER REFERENCES publish_logs(id),
    event_type VARCHAR(50),
    platform VARCHAR(50),
    url VARCHAR(500),
    metadata JSONB,
    created_at TIMESTAMP,
    INDEX (content_id, created_at)
);

-- 任务调度表
CREATE TABLE scheduled_tasks (
    id SERIAL PRIMARY KEY,
    task_type VARCHAR(50),
    payload JSONB,
    status VARCHAR(50),  -- pending, running, completed, failed
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    result JSONB,
    error_message TEXT,
    INDEX (status, scheduled_at)
);
```

---

## 🚀 实施路线图

### Phase 1: MVP - 手动辅助 (2-3周)

**目标**: 工具化现有流程，人工决策 + 工具执行

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 产品筛选 | Amazon 扫描 + 手动选择 | P0 |
| 素材搜集 | 评论爬取 + 存储 | P0 |
| 内容创作 | Markdown 模板 + AI 辅助 | P0 |
| 多平台发布 | Blogger/Medium 格式转换 | P0 |
| 数据追踪 | 手动记录 + 简单报表 | P1 |

### Phase 2: 自动化增强 (3-4周)

**目标**: 核心流程自动化，人工只做质检

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 产品筛选 | 自动筛选 + 候选评分 | P0 |
| 素材搜集 | 多源自动搜集 + 存储 | P0 |
| 内容创作 | AI 生成初稿 + 人工审核 | P0 |
| 多平台发布 | API 自动发布 | P0 |
| 数据追踪 | API 自动收集 + 仪表板 | P0 |

### Phase 3: 全自动 + 智能化 (4-6周)

**目标**: 最小人工干预，AI 持续优化

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 产品筛选 | 智能评分 + 自动入库 | P1 |
| 素材搜集 | 持续监控 + 增量更新 | P1 |
| 内容创作 | AI 全自动 + 定期质检 | P1 |
| 多平台发布 | 智能调度 + 优化 | P1 |
| 数据追踪 | 实时监控 + 自动优化 | P1 |

---

## 🔌 与现有系统集成

### 集成方案

```
┌─────────────────────────────────────────────────────────────┐
│                    现有系统                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (Vue)          Backend (Go)          AI Service   │
│     │                        │                    │            │
│     └────────────┬───────────┴────────────┬────────────┘            │
│                  │                          │                      │
│                  ▼                          ▼                      │
│         ┌──────────────────────────────────────────┐              │
│         │    Content Automation System (新增)   │              │
│         │       Python FastAPI 独立服务         │              │
│         └──────────────────────────────────────────┘              │
│                        │                                │
│         ┌──────────────┴──────────────┐                        │
│         │  PostgreSQL (共享数据库)    │                        │
│         └─────────────────────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API 设计

```python
# content_automation/app/api/routes.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Content Automation API")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 产品相关 API
@app.get("/api/v1/products/candidates")
async def get_candidates():
    """获取候选产品列表"""

@app.post("/api/v1/products/scan")
async def scan_products(category: str):
    """扫描指定类目的产品"""

@app.get("/api/v1/products/{asin}/materials")
async def get_materials(asin: str):
    """获取产品素材"""

# 内容相关 API
@app.get("/api/v1/contents")
async def get_contents(status: str = None):
    """获取内容列表"""

@app.post("/api/v1/contents/generate")
async def generate_content(asin: str, content_type: str):
    """生成内容 (AI)"""

@app.put("/api/v1/contents/{id}/review")
async def review_content(id: int, review_data: ReviewRequest):
    """审核内容"""

@app.post("/api/v1/contents/{id}/publish")
async def publish_content(id: int, platforms: List[str]):
    """发布内容"""

# 发布相关 API
@app.get("/api/v1/publish/status")
async def get_publish_status(task_id: str):
    """获取发布任务状态"""

# 分析相关 API
@app.get("/api/v1/analytics/dashboard")
async def get_dashboard():
    """获取数据看板"""

@app.get("/api/v1/analytics/report")
async def generate_report(start_date: str, end_date: str):
    """生成数据分析报告"""
```

---

## 🎯 当下立即行动

### 针对现有测试项目

```
┌─────────────────────────────────────────────────────────────┐
│                  立即实施计划                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  本周 (手动辅助阶段)                                         │
│  ─────────────────────                                         │
│  1. 巩具化素材搜集                                            │
│     • Python 脚本爬取 Amazon 评论                             │
│     • 整理存储到本地文件                                      │
│                                                             │
│  2. 工具化内容转换                                            │
│     • Markdown → 各平台格式转换脚本                           │
│     • 批量操作脚本                                             │
│                                                             │
│  3. 简单数据记录                                              │
│     • 手动记录发布链接                                        │
│     • 手动记录浏览数据                                         │
│                                                             │
│  下周 (自动化阶段)                                           │
│  ─────────────────────                                         │
│  1. 产品候选库                                                │
│  2. 素材数据库                                                │
│  3. AI 辅助创作                                              │
│  4. 自动发布工具                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ 请确认

请告诉我：

1. **整体架构**：Python 独立服务 + 共享数据库，这样可以吗？
2. **实施优先级**：从 Phase 1 MVP 开始还是直接 Phase 2？
3. **当前重点**：先做哪个模块？
   - 选品自动化
   - 素材搜集自动化
   - 内容创作自动化
   - 发布自动化
   - 数据追踪自动化

4. **技术选型确认**：
   - 后端框架: FastAPI ✅
   - 任务队列: Celery + Redis ✅
   - 数据库: PostgreSQL (共享) ✅
   - 前端: Vue (复用现有) ✅

确认后我开始设计详细的 API 和数据模型。
