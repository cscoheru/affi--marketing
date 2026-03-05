# 内容自动化子模块计划

> **版本**: v1.0
> **创建时间**: 2026-03-04
> **状态**: 规划中

---

## 📋 模块概述

**目标**: 构建一个可扩展的内容发布自动化系统，支持多平台一键发布

**定位**: 独立子模块，与现有系统松耦合集成

---

## 🏗️ 系统架构

### 现有系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Affi-Marketing 现有系统                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │  Frontend    │    │  Backend     │    │  AI Service  │ │
│  │  Vue 3 + TS  │◄──►│  Go + Gin    │◄──►│  Python + F  │ │
│  │  (Vercel)    │    │  (Railway)   │    │  (Railway)   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘       │
│                              │                             │
│                    ┌───────────────┐                    │
│                    │  PostgreSQL  │                    │
│                    │  + Redis      │                    │
│                    └───────────────┘                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 新增子模块：内容发布器 (Content Publisher)

```
┌─────────────────────────────────────────────────────────────┐
│                  Content Publisher 子模块                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [Content Sources]          [Publish Targets]              │
│         │                            ▲                      │
│         ▼                            │                      │
│  ┌──────────────┐              ┌─────────┴─────────┐        │
│  │  Content     │              │  Publisher Core  │        │
│  │  Manager     │─────────────►│  (Python/Go)      │        │
│  └──────────────┘              └─────────┬─────────┘        │
│                                          │                  │
│                           ┌────────────┴────────────┐       │
│                           │  Platform Adapters       │       │
│                           ├─────────────────────────┤       │
│                           │ • Blog (Self)           │       │
│                           │ • Blogger (API)         │       │
│                           │ • Medium (Web)          │       │
│                           │ • LinkedIn (API)       │       │
│                           │ • WordPress (API)      │       │
│                           └─────────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                    ▲
                    │ 集成点 (松耦合)
                    │
         ┌──────────┴──────────┐
         │  现有 Backend API   │
         │  (可选)             │
         └─────────────────────┘
```

---

## 🔧 技术栈选择

### 方案对比

| 方案 | 优势 | 劣势 | 推荐 |
|------|------|------|------|
| **Python 独立服务** | 与 AI 服务技术栈一致，AI 功能集成方便 | 新增服务实例 | ⭐⭐⭐⭐⭐ |
| **Go 微服务** | 与后端技术栈一致，性能好 | 集成 AI 功能需要跨服务调用 | ⭐⭐⭐ |
| **Node.js 插件** | 与前端技术栈一致，全栈 JS | 与现有后端分离 | ⭐⭐ |
| **无服务器函数** | 成本低，按需计费 | 执行时间限制，调试困难 | ⭐⭐ |

### **推荐方案：Python 独立服务**

**理由**：
1. AI 服务已用 Python，复用技术栈
2. 丰富的内容处理库 (markdown, rss, etc.)
3. 方便集成 AI 功能 (内容生成、优化)
4. 独立部署，不影响现有系统

---

## 📐 模块设计

### 目录结构

```
Affi-Marketing/
├── content-publisher/           # 新增子模块
│   ├── app/                     # FastAPI 应用
│   │   ├── __init__.py
│   │   ├── main.py              # 应用入口
│   │   ├── api/                 # API 路由
│   │   ├── core/                # 核心业务逻辑
│   │   ├── models/              # 数据模型
│   │   ├── services/            # 发布服务
│   │   └── adapters/            # 平台适配器
│   ├── tests/                   # 测试
│   ├── scripts/                 # 脚本工具
│   ├── Dockerfile
│   ├── requirements.txt
│   └── railway.toml             # Railway 部署配置
│
├── frontend/                    # 现有前端
│   └── src/
│       └── modules/
│           └── publisher/       # 新增前端模块 (可选)
│               ├── api.ts
│               └── types.ts
│
├── backend-go/                  # 现有后端
│   └── ...
│
└── ai-service/                  # 现有 AI 服务
    └── ...
```

### 核心组件

#### 1. Content Manager (内容管理器)
```python
# app/core/content_manager.py

class ContentManager:
    """内容管理器 - 负责读取、验证、预处理内容"""

    def load_from_markdown(file_path: str) -> Content
    def validate_content(content: Content) -> ValidationResult
    def transform_to_platform(content: Content, platform: str) -> PlatformContent
    def extract_metadata(content: Content) -> ContentMetadata
```

#### 2. Publisher Core (发布核心)
```python
# app/core/publisher.py

class Publisher:
    """发布核心 - 协调多平台发布"""

    def publish_single(content: Content, platforms: List[str]) -> PublishResult
    def publish_batch(contents: List[Content], platforms: List[str]) -> BatchResult
    def get_publish_status(task_id: str) -> TaskStatus
```

#### 3. Platform Adapters (平台适配器)
```python
# app/adapters/base.py

class PlatformAdapter(ABC):
    """平台适配器基类"""

    @abstractmethod
    def publish(self, content: PlatformContent) -> PublishResult:
        pass

    @abstractmethod
    def verify_credentials(self) -> bool:
        pass

# app/adapters/blogger_adapter.py
# app/adapters/medium_adapter.py
# app/adapters/wordpress_adapter.py
```

---

## 🔌 与现有系统集成

### 集成方式（3种，可渐进实施）

#### Level 1: 独立运行（Phase 1）
```
Content Publisher 作为独立服务运行
通过 CLI 或 API 触发发布
```

#### Level 2: API 集成（Phase 2）
```
┌──────────────┐
│  Frontend    │
│  Vue App     │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────────┐
│  Backend     │────►│ Content Publisher│
│  Go API      │     │  Python Service   │
│  /api/...    │     │  /publish/*       │
└──────────────┘     └──────────────────┘
```

#### Level 3: 深度集成（Phase 3）
```
- 内容同步到主数据库
- 前端内容管理界面
- 发布任务调度和监控
```

---

## 🚀 实施计划

### Phase 1: MVP（1-2周）

**目标**: 基础功能，支持 2-3 个平台

| 功能模块 | 优先级 | 工作量 |
|---------|--------|--------|
| FastAPI 框架搭建 | P0 | 4h |
| Markdown 内容读取 | P0 | 4h |
| Blogger API 集成 | P0 | 8h |
| Medium 爬虫/模拟 | P0 | 8h |
| CLI 发布工具 | P1 | 4h |
| 基础日志和错误处理 | P1 | 4h |

**交付物**:
- 独立运行的发布服务
- CLI 命令行工具
- 支持发布到 Blogger 和导出 Medium 格式

### Phase 2: 平台扩展（1周）

**目标**: 支持更多平台

| 功能模块 | 优先级 | 工作量 |
|---------|--------|--------|
| WordPress API 集成 | P1 | 6h |
| LinkedIn API 集成 | P1 | 6h |
| 批量发布优化 | P2 | 4h |
| 发布状态追踪 | P2 | 4h |
| 简单 Web UI | P3 | 8h |

**交付物**:
- 支持 WordPress、LinkedIn
- 批量发布功能
- 发布进度追踪

### Phase 3: 深度集成（按需）

**目标**: 与主系统完全集成

| 功能模块 | 优先级 | 工作量 |
|---------|--------|--------|
| 后端 API 集成 | P1 | 8h |
| 前端内容管理界面 | P2 | 16h |
| 数据库同步 | P2 | 8h |
| 定时任务调度 | P3 | 6h |
| AI 内容优化集成 | P3 | 8h |

---

## 🎯 未来扩展方向

### 内容源扩展
```
┌─────────────────────────────────────────────────────────┐
│                    Content Sources                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Markdown │  │  Notion │  │ Google  │  │   AI    │   │
│  │   文件   │  │   API   │  │  Docs   │  │ 生成   │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 发布目标扩展
```
┌─────────────────────────────────────────────────────────┐
│                  Publish Targets                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  博客平台: Blogger, Medium, WordPress, Substack         │
│  社交媒体: LinkedIn, Twitter/X, Facebook                │
│  内容社区: Reddit, Dev.to, Hashnode                     │
│  视频平台: YouTube (描述生成)                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### AI 能力扩展
```
┌─────────────────────────────────────────────────────────┐
│                   AI Enhancements                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  • 内容优化: SEO、可读性、标题优化                       │
│  • 图片生成: DALL-E/Midjourney 集成                      │
│  • 摘要生成: 自动生成各平台摘要                          │
│  • 标签推荐: 基于内容智能推荐标签                        │
│  • A/B 测试: 不同版本效果对比                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 数据流设计

### 发布流程

```
┌─────────────────────────────────────────────────────────┐
│                     发布流程                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 用户选择内容                                         │
│     │                                                   │
│     ▼                                                   │
│  2. Content Manager 加载并验证                           │
│     │                                                   │
│     ▼                                                   │
│  3. 为每个目标平台转换格式                               │
│     │                                                   │
│     ├─► Blogger 格式                                    │
│     ├─► Medium 格式                                     │
│     └─► WordPress 格式                                  │
│     │                                                   │
│     ▼                                                   │
│  4. Platform Adapters 并发发布                          │
│     │                                                   │
│     ├─► Blogger API                                     │
│     ├─► Medium (Web)                                    │
│     └─► WordPress API                                   │
│     │                                                   │
│     ▼                                                   │
│  5. 收集结果并记录                                       │
│     │                                                   │
│     ▼                                                   │
│  6. 返回发布报告                                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 数据库设计（可选，Phase 3）

```sql
-- 内容表
CREATE TABLE contents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    slug VARCHAR(200),
    source_path TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 发布记录表
CREATE TABLE publish_logs (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES contents(id),
    platform VARCHAR(50),
    platform_post_id TEXT,
    status VARCHAR(50),
    error_message TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP
);

-- 平台配置表
CREATE TABLE platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    credentials JSONB,
    enabled BOOLEAN,
    created_at TIMESTAMP
);
```

---

## 🔐 安全考虑

| 风险 | 解决方案 |
|------|----------|
| API 密钥泄露 | 环境变量 + 加密存储 |
| 发布失败 | 重试机制 + 死信队列 |
| 内容篡改 | 内容哈希校验 |
| 限流 | 平台级限流控制 |
| 权限控制 | API Key 验证 |

---

## 📈 监控指标

| 指标 | 说明 |
|------|------|
| 发布成功率 | 各平台发布成功比例 |
| 发布耗时 | 从触发到完成的时间 |
| API 调用次数 | 各平台 API 使用量 |
| 错误类型统计 | 常见错误分类统计 |

---

## ✅ 验收标准

### Phase 1 MVP
- [ ] 支持 Markdown 内容读取
- [ ] 支持发布到 Blogger
- [ ] 支持 Medium 格式导出
- [ ] CLI 工具可用
- [ ] 基础错误处理

### Phase 2
- [ ] 支持 5+ 发布平台
- [ ] 批量发布功能
- [ ] 发布状态追踪
- [ ] Web UI (可选)

### Phase 3
- [ ] 与现有后端 API 集成
- [ ] 前端内容管理界面
- [ ] 发布任务调度
- [ ] 数据库持久化

---

## 🎯 下一步

请确认以下问题后开始开发：

1. **技术栈确认**: 使用 Python FastAPI 独立服务？
2. **起始 Phase**: 从 Phase 1 MVP 开始？
3. **优先平台**: Blogger + Medium 还是其他？
4. **集成深度**: Phase 1 独立运行还是直接做 API 集成？

---

**准备好后告诉我，我开始设计详细的 API 接口和数据模型。**
