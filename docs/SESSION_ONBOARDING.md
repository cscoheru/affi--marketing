# Affi-Marketing 会话入职指南

**文档用途**: 新会话导入任务卡后，首先阅读本文档
**更新时间**: 2026-03-03
**当前阶段**: 第二阶段准备

---

## 🎯 30秒速览

### 项目是什么？
**Affi-Marketing** - 商业模式测试与统一管理平台
- 支持程序化 SEO + 联盟营销
- 多种 AI 模型集成 (通义千问、OpenAI、智谱)
- 实验管理和流量追踪系统

### 当前状态？
- ✅ 第一阶段 (MVP) 已完成并上线
- ⏳ 第二阶段 (优化) 准备中

### 在线服务
- 🌐 前端: https://hub.zenconsult.top
- 🔧 后端: https://api-hub.zenconsult.top
- 🤖 AI服务: https://ai-api.zenconsult.top

### 你的工作目录
```
/Users/kjonekong/Documents/Affi-Marketing/
```

---

## 💼 与老板协作

### 老板的工作方式

**老板只做两件事**:
1. 导入任务卡启动会话
2. 查看控制台验收成果

**老板不频繁介入**，不要经常打扰！

### 如何联系老板

**只有以下情况才联系老板**：

#### 🔴 紧急情况 (立即联系)

```
在 docs/ALERTS.md 添加：

## 🔴 [会话ID] 紧急问题

**时间**: HH:MM
**问题**: [描述]

### 需要老板
- [ ] 确认决策
- [ ] 提供资源
```

#### 🟡 需要决策 (今天内)

```
在 docs/ALERTS.md 添加：

## 🟡 [会话ID] 决策请求

### 决策事项
[描述清楚需要决定什么]

### 选项
- A: [选项A]
- B: [选项B]

请老板选择: [ ] A / [ ] B / [ ] C
```

#### 🟢 信息更新 (不用联系)

```
完成任务后，在 docs/SESSION_LOG.md 记录即可
老板会定期查看控制台了解进度
```

### ❌ 不要做的事

- 不要问老板 "下一步怎么做？" - 看任务卡
- 不要问老板 "Yes or No?" - 在 ALERTS 中提交决策请求
- 不要让老板传递消息 - 用 MESSAGES 系统直接联系对方会话
- 不要频繁打扰 - 老板很忙，只在必要时联系

### 📝 老板关注的文件

老板主要看这些：
- `docs/BOSS_DASHBOARD.md` - 老板控制台
- `docs/ALERTS.md` - 紧急通知
- `docs/MESSAGES/R0-PM.md` - 给老板的消息

**老板不看的**：
- 具体的代码实现
- 会话之间的技术讨论
- 日常进度细节

---

## 📚 完整项目架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      用户层                                 │
│  浏览器用户 ── 移动用户 ── SEO爬虫                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      接入层                                 │
│  Vercel CDN ── Cloudflare Workers ── Railway LB             │
│  hub.zenconsult ─ tracker.zenconsult ─ api-hub.zenconsult  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      应用层                                 │
│  Vue3前端 ── Go后端 ── Python AI服务                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                 │
│  PostgreSQL ── Redis ── MinIO                             │
│  (阿里云杭州)    (阿里云)   (香港)                          │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Element Plus + Vite |
| 后端 | Go 1.21 + Gin + GORM |
| AI服务 | Python + FastAPI + 多模型适配器 |
| 数据库 | PostgreSQL 15 + Redis 7 |
| 存储 | MinIO |
| 部署 | Railway + Vercel + Cloudflare |

---

## 📁 代码结构一览

```
/Users/kjonekong/Documents/Affi-Marketing/
│
├── 📂 frontend/                    # Vue 3 前端应用
│   ├── src/
│   │   ├── views/                   # 页面组件
│   │   ├── components/              # 业务组件
│   │   ├── api/                     # API 客户端
│   │   ├── stores/                  # Pinia 状态
│   │   └── router/                  # 路由配置
│   ├── package.json
│   └── vite.config.ts
│
├── 📂 backend-go/                   # Go 后端服务
│   ├── cmd/server/main.go           # 应用入口
│   ├── internal/
│   │   ├── core/                    # 核心业务逻辑
│   │   ├── controller/              # HTTP 控制器
│   │   ├── service/                 # 业务服务
│   │   ├── model/                   # 数据模型
│   │   ├── plugin/                  # 插件系统
│   │   └── middleware/              # 中间件
│   ├── pkg/                         # 公共包
│   │   ├── database/postgres.go
│   │   ├── cache/redis.go
│   │   └── logger/logger.go
│   ├── go.mod
│   └── Dockerfile.railway
│
├── 📂 ai-service/                   # Python AI 服务
│   ├── app/
│   │   ├── main.py                  # FastAPI 入口
│   │   ├── services/
│   │   │   ├── manager.py           # AI 服务管理器
│   │   │   ├── seo/                 # SEO 内容生成
│   │   │   └── affiliate/           # 联盟链接注入
│   │   ├── adapters/                # 模型适配器
│   │   │   ├── qwen_adapter.py      # 通义千问
│   │   │   ├── openai_adapter.py    # OpenAI
│   │   │   └── chatglm_adapter.py   # 智谱AI
│   │   ├── api/                     # API 模型
│   │   └── prompts/                 # 提示词模板
│   ├── requirements.txt
│   └── .env                         # 环境配置
│
├── 📂 migrations/                   # 数据库迁移
│   ├── 000_init_database.sql
│   ├── 001_core_tables.sql
│   ├── 002_seo_tables.sql
│   ├── 003_affiliate_tables.sql
│   └── 004_geo_tables.sql
│
├── 📂 docs/                         # 项目文档
│   ├── ARCHITECTURE.md              # 系统架构
│   ├── PLUGIN_SYSTEM.md             # 插件系统
│   ├── DATA_MODELS.md               # 数据模型
│   ├── API_SPEC.md                  # API 规范
│   ├── DATABASE_SCHEMA.md           # 数据库结构
│   └── DEPLOYMENT_ARCHITECTURE.md   # 部署架构
│
├── 📂 roles/                        # 角色任务卡
│   ├── 01-architect.md              # 第一阶段 (已完成)
│   ├── 02-frontend.md
│   ├── 03-database.md
│   ├── 04-ai-engine.md
│   ├── 05-backend.md
│   ├── 06-devops.md
│   ├── 07-product-manager.md        # 第二阶段 (待启动)
│   ├── 08-frontend-optimization.md
│   ├── 09-backend-optimization.md
│   ├── 10-data-engineering.md
│   ├── 11-testing-engineering.md
│   └── INDEX.md                    # 任务卡索引
│
└── 📂 output/                       # 通用输出
```

---

## 🌐 部署信息

### 在线服务地址

| 服务 | 地址 | 平台 | 状态 |
|------|------|------|------|
| 前端 | https://hub.zenconsult.top | Vercel | ✅ 运行中 |
| 后端API | https://api-hub.zenconsult.top | Railway | ✅ 运行中 |
| AI服务 | https://ai-api.zenconsult.top | Railway | ✅ 运行中 |
| 追踪脚本 | https://tracker.zenconsult.top | Cloudflare | ⏳ 未实现 |

### 域名配置

```
主域名: zenconsult.top

子域名:
- hub.zenconsult.top        → 前端
- api-hub.zenconsult.top   → 后端API
- ai-api.zenconsult.top    → AI服务
- tracker.zenconsult.top   → 追踪脚本
```

### 部署平台

| 服务 | 平台 | 仓库 | 分支 |
|------|------|------|------|
| 前端 | Vercel | GitHub | main |
| 后端 | Railway | GitHub | main |
| AI服务 | Railway | GitHub | main |

---

## 💻 基础设施

### 数据库 (阿里云杭州)

```
类型: PostgreSQL 15
地址: 139.224.42.111:5432
数据库: business_hub
用户: postgres
```

**迁移脚本位置**: `migrations/`

### Redis (阿里云杭州)

```
地址: 139.224.42.111:6379
密码: (见 .env 文件)
```

### MinIO (香港)

```
地址: 103.59.103.85:9000
用途: 对象存储 (静态资源、生成内容)
```

---

## 🔑 环境配置

### 本地开发环境变量

每个服务都有 `.env` 或 `.env.example` 文件：

#### 后端 (backend-go/.env)
```bash
# 服务器
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# 数据库
DATABASE_URL=postgres://...
REDIS_URL=redis://...

# AI 服务
AI_SERVICE_URL=http://localhost:8000
```

#### AI 服务 (ai-service/.env)
```bash
# AI API Keys
DASHSCOPE_API_KEY=sk-...
OPENAI_API_KEY=sk-...
CHATGLM_API_KEY=...

# 数据库
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://...
```

#### 前端 (frontend/.env.development)
```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_AI_API_BASE_URL=http://localhost:8000
```

---

## 🚀 本地运行指南

### 启动顺序

1. **确保基础设施运行**
   ```bash
   # PostgreSQL 和 Redis 已启动
   # 或使用远程服务器
   ```

2. **启动 AI 服务**
   ```bash
   cd ai-service
   python3 -m uvicorn app.main:app --reload --port 8000
   # 访问: http://localhost:8000
   ```

3. **启动后端服务**
   ```bash
   cd backend-go
   go run cmd/server/main.go
   # 访问: http://localhost:8080
   ```

4. **启动前端**
   ```bash
   cd frontend
   npm run dev
   # 访问: http://localhost:5176
   ```

### 验证服务

```bash
# 健康检查
curl http://localhost:8080/health     # 后端
curl http://localhost:8000/health     # AI服务

# API 文档
http://localhost:8000/docs              # AI服务文档
```

---

## 📊 第一阶段交付成果

### 已完成功能

| 模块 | 功能 | 状态 |
|------|------|------|
| 前端 | Vue 3 应用完整框架 | ✅ |
| 前端 | 仪表板、实验管理、插件管理页面 | ✅ |
| 前端 | API 客户端 + Mock 支持 | ✅ |
| 后端 | Go + Gin 框架 | ✅ |
| 后端 | 实验管理 API | ✅ |
| 后端 | 追踪服务 | ✅ |
| 后端 | 归因引擎 (3种算法) | ✅ |
| 后端 | 结算服务 | ✅ |
| 后端 | 插件系统 | ✅ |
| AI服务 | 多模型适配器 | ✅ |
| AI服务 | SEO 内容生成 | ✅ |
| AI服务 | 联盟链接注入 | ✅ |
| 数据库 | 完整表结构 | ✅ |
| 部署 | 所有服务上线 | ✅ |

### 代码统计

- 前端: 20+ Vue 组件
- 后端: 25+ Go 源文件
- AI服务: 20+ Python 模块
- 数据库: 5 个迁移脚本

---

## 🤝 会话协作系统

### 核心文件

| 文件 | 用途 | 何时查看 |
|------|------|----------|
| `docs/SESSION_REGISTRY.md` | 查看所有会话状态 | 启动时 |
| `docs/SESSION_LOG.md` | 查看项目大事记 | 需要历史时 |
| `docs/COLLABORATION_QUICK_START.md` | 协作快速指南 | 不清楚流程时 |
| `docs/SESSION_COLLABORATION.md` | 完整协作协议 | 需要详细规则 |
| `docs/MESSAGES/{你的会话ID}.md` | 查看发给你的消息 | 定期查看 |
| `docs/API_CHANGES.md` | API 变更提案 | 修改 API 时 |
| `docs/SCHEMA_CHANGES.md` | 数据变更提案 | 修改数据时 |

### 协作流程

```
┌─────────────────────────────────────────────────────────────┐
│                   会话协作流程                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 新会话启动                                               │
│     │                                                        │
│     ├─→ 查看 docs/SESSION_REGISTRY.md                        │
│     ├─→ 查看本文档 (会话入职指南)                            │
│     └─→ 查看任务卡了解具体任务                               │
│                                                              │
│  2. 开始工作                                                 │
│     │                                                        │
│     ├─→ 定期查看 docs/MESSAGES/{会话ID}.md                   │
│     ├─→ 需要变更 API? → docs/API_CHANGES.md                  │
│     └─→ 需要变更数据? → docs/SCHEMA_CHANGES.md               │
│                                                              │
│  3. 完成任务                                                 │
│     │                                                        │
│     ├─→ 更新 docs/SESSION_LOG.md                            │
│     ├─→ 通知依赖会话 (通过 MESSAGES/)                        │
│     └─→ 更新 docs/SESSION_REGISTRY.md                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📖 必读文档列表

### 新会话必读

1. **本指南** (会话入职指南.md) - 你正在阅读
2. **docs/COLLABORATION_QUICK_START.md** - 协作快速入门
3. **docs/SESSION_REGISTRY.md** - 当前会话状态
4. **你的角色任务卡** - 具体任务

### 根据角色选读

| 角色 | 必读文档 |
|------|----------|
| 07-产品经理 | docs/ARCHITECTURE.md, docs/API_SPEC.md |
| 08-前端优化 | frontend/README.md, docs/API_SPEC.md |
| 09-后端优化 | backend-go/IMPLEMENTATION_SUMMARY.md, docs/DATABASE_SCHEMA.md |
| 10-数据工程 | docs/DATA_MODELS.md, docs/DATABASE_SCHEMA.md |
| 11-测试工程 | docs/API_SPEC.md, 所有代码 |

---

## ⚠️ 常见问题

### Q: 我不知道从哪里开始？
A:
1. 阅读你的角色任务卡 (`roles/XX-角色.md`)
2. 查看 `docs/SESSION_REGISTRY.md` 了解依赖状态
3. 查看 `docs/MESSAGES/{你的会话ID}.md` 是否有留言

### Q: 我需要修改 API，但不知道影响谁？
A: 在 `docs/API_CHANGES.md` 提交变更提案，相关会话会响应

### Q: 我被其他会话阻塞了怎么办？
A: 在 `docs/MESSAGES/{阻塞会话ID}.md` 发送消息，同时上报项目经理

### Q: 我不知道某个服务的配置在哪？
A: 查看各服务目录下的 `.env.example` 文件

### Q: 我需要了解某个模块的实现细节？
A: 查看对应的文档：
- 前端: `frontend/README.md`
- 后端: `backend-go/IMPLEMENTATION_SUMMARY.md`
- AI服务: `ai-service/README.md`

---

## 📞 获取帮助

| 问题类型 | 查看文档 | 联系会话 |
|----------|----------|----------|
| 不了解项目 | 本指南 | R0-PM |
| 不了解协作 | COLLABORATION_QUICK_START.md | R0-PM |
| API 变更 | API_CHANGES.md | S09-BEOPT |
| 数据变更 | SCHEMA_CHANGES.md | S03-DB |
| 代码问题 | 具体模块 README | 相关开发会话 |

---

## ✅ 新会话启动清单

启动会话后，按顺序完成：

- [ ] 1. 阅读本入职指南
- [ ] 2. 阅读 `docs/COLLABORATION_QUICK_START.md`
- [ ] 3. 查看 `docs/SESSION_REGISTRY.md`
- [ ] 4. 查看 `docs/MESSAGES/{你的会话ID}.md`
- [ ] 5. 阅读你的角色任务卡
- [ ] 6. 查看依赖是否满足
- [ ] 7. 开始工作

---

**版本**: 1.0.0
**最后更新**: 2026-03-03 15:30 UTC+8
**维护者**: R0-PM (项目经理会话)
