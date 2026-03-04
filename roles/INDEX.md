# Affi-Marketing 角色任务卡索引

**项目**: Affi-Marketing (商业模式测试与统一管理平台)
**工作目录**: `/Users/kjonekong/Documents/Affi-Marketing`
**域名**: `zenconsult.top`
**当前阶段**: 第二阶段准备

---

## 📊 项目状态

**第一阶段**: ✅ 完成 (2026-03-03)
**第二阶段**: ⏳ 准备中

**在线服务**:
- 🌐 前端: https://hub.zenconsult.top
- 🔧 后端: https://api-hub.zenconsult.top
- 🤖 AI服务: https://ai-api.zenconsult.top

---

## 🚀 快速启动

**启动命令**: 在 Claude Code 会话中说：
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/[角色文件名].md
```

**协作指南**: 查看 `docs/COLLABORATION_QUICK_START.md`

---

# 第一阶段角色 (已完成)

### 01-架构师 (Architect)

**文件**: `01-architect.md`
**时长**: 16 小时
**状态**: ⏳ 待开始

**主要任务**:
- 系统架构设计
- 插件系统设计
- 数据模型设计
- API 接口规范
- 部署架构设计

**输出**:
- `docs/ARCHITECTURE.md`
- `docs/PLUGIN_SYSTEM.md`
- `docs/DATA_MODELS.md`
- `docs/API_SPEC.md`

**启动**: 导入角色任务卡 `roles/01-architect.md`

---

### 02-前端工程师 (Frontend Engineer)

**文件**: `02-frontend.md`
**时长**: 24 小时
**状态**: ⏳ 待开始

**主要任务**:
- Vue 3 项目初始化
- 布局与路由
- API 客户端
- 状态管理
- 页面开发 (仪表板、实验管理、插件管理)

**输出**:
- `frontend/src/` (完整应用)
- `frontend/vercel.json`

**启动**: 导入角色任务卡 `roles/02-frontend.md`

---

### 03-数据库工程师 (Database Engineer)

**文件**: `03-database.md`
**时长**: 8 小时
**状态**: ⏳ 待开始

**主要任务**:
- 创建 business_hub 数据库
- 执行迁移脚本
- 创建 MinIO 存储桶
- 配置备份策略
- 数据库文档

**输出**:
- `migrations/*.sql`
- `docs/DATABASE_SCHEMA.md`

**启动**: 导入角色任务卡 `roles/03-database.md`

---

### 04-AI工程师 (AI Engineer)

**文件**: `04-ai-engine.md`
**时长**: 20 小时
**状态**: ⏳ 待开始

**主要任务**:
- AI 服务管理器设计
- 模型适配器开发 (通义千问、OpenAI、智谱)
- SEO 内容生成服务
- 联盟链接智能注入
- 提示词工程
- 成本监控

**输出**:
- `ai-service/services/`
- `ai-service/prompts/`

**启动**: 导入角色任务卡 `roles/04-ai-engine.md`

---

### 05-后端工程师 (Backend Engineer)

**文件**: `05-backend.md`
**时长**: 32 小时
**状态**: ⏳ 待开始

**主要任务**:
- Go 项目初始化
- 核心框架 (配置/DB/日志)
- 插件系统实现
- 实验管理 API
- 追踪服务
- 归因引擎
- 结算服务
- SEO 插件实现

**输出**:
- `backend-go/internal/`
- `backend-go/cmd/server/main.go`
- `backend-go/Dockerfile.railway`

**启动**: 导入角色任务卡 `roles/05-backend.md`

---

### 06-部署测试工程师 (DevOps Engineer)

**文件**: `06-devops.md`
**时长**: 16 小时
**状态**: ⏳ 待开始

**主要任务**:
- Railway 后端部署
- Vercel 前端部署
- Cloudflare Workers 部署
- AI 服务部署
- DNS 配置
- 监控配置
- 端到端测试

**输出**:
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/TEST_REPORT.md`

**启动**: 导入角色任务卡 `roles/06-devops.md`

---

## 📊 角色依赖关系

```
01-架构师
    │
    ├─→ 02-前端工程师 (需要 API 规范)
    │
    ├─→ 03-数据库工程师 (需要数据模型)
    │
    ├─→ 04-AI工程师 (需要集成规范)
    │
    └─→ 05-后端工程师 (需要接口定义和数据模型)
              │
              └─→ 06-部署测试 (需要所有代码完成)
```

---

## 🎯 建议启动顺序

### 第1批 (可立即启动)
- **01-架构师** - 设计整体架构
- **03-数据库工程师** - 准备数据库 (可并行)

### 第2批 (等待第1批)
- **02-前端工程师** - 前端开发
- **04-AI工程师** - AI服务开发
- **05-后端工程师** - 后端开发

### 第3批 (等待第2批)
- **06-部署测试** - 部署与验证

---

## 📁 项目目录结构

```
/Users/kjonekong/Documents/Affi-Marketing/
├── roles/                   ← 角色任务卡 (给工程师)
│   ├── 01-architect.md
│   ├── 02-frontend.md
│   ├── 03-database.md
│   ├── 04-ai-engine.md
│   ├── 05-backend.md
│   ├── 06-devops.md
│   └── INDEX.md             (本文件)
│
├── backend-go/              ← 后端工程师工作目录
├── frontend/                ← 前端工程师工作目录
├── ai-service/              ← AI工程师工作目录
├── migrations/              ← 数据库工程师工作目录
├── deployments/             ← 部署工程师工作目录
├── docs/                    ← 架构师输出目录
├── output/                  ← 通用输出目录
├── .project-sync.json       ← 项目状态文件
└── PROJECT_STATUS.md        ← 项目仪表板
```

---

## ⚠️ 重要说明

1. **每个角色一个独立会话**: 不要在同一个会话中切换角色
2. **按依赖顺序启动**: 先启动无依赖的角色
3. **通过代码通信**: 角色间通过 Git 仓库共享代码
4. **参考架构文档**: 其他角色的输入主要来自架构师的文档

---

## 📞 给工程师的说明

当你收到角色任务卡时：

1. **仔细阅读**任务卡中的所有内容
2. **检查依赖**是否已满足
3. **按照步骤**执行开发任务
4. **完成后**更新相关状态文件

---

**版本**: 2.0.0 (角色协作版)
**最后更新**: 2026-03-03

---

# 实验验证阶段 (当前阶段)

## 🎯 战略调整说明

**基于老板反馈** (`docs/boss_feedback/ergent.ini.md`)：
- ❌ 所有开发任务暂停（07-11 角色暂时停用）
- ✅ 转为手动验证商业模式
- ✅ 唯一目标：咖啡机评测 SEO + Amazon US 联盟
- ✅ 寄生策略：Medium.com（不购买域名）

---

## 📋 实验验证角色列表

### 12-SEO 内容创作者 (SEO Content Creator)

**文件**: `12-seo-content-creator.md`
**时长**: 8 小时
**状态**: ⏳ 待启动
**优先级**: 🔴 最高

**主要任务**:
- 素材收集（Amazon、YouTube）
- 创建 7 篇科普文章（AI 快速生成）
- 创建 3 篇评测文章（基于真实素材）

**输出**:
- `docs/content_material/` - 产品素材文件
- `docs/content/drafts/` - 文章草稿

**启动**: 导入角色任务卡 `roles/12-seo-content-creator.md`

---

### 13-Medium 发布员 (Medium Publisher)

**文件**: `13-medium-publisher.md`
**时长**: 4 小时
**状态**: ⏳ 待启动
**优先级**: 🔴 高
**依赖**: 12-SEO 内容创作者

**主要任务**:
- Medium Publication 设置
- 发布 7 篇科普文章（Day 1-3）
- 发布 3 篇评测文章（Day 4-7）
- SEO 优化和 GSC 设置
- 提交 Amazon Associates 申请（Day 8）

**输出**:
- Medium Publication（10 篇文章）
- `docs/deployment/publish_log.md` - 发布记录

**启动**: 导入角色任务卡 `roles/13-medium-publisher.md`

---

### 14-流量推广员 (Traffic Promoter)

**文件**: `14-traffic-promoter.md`
**时长**: 6 小时
**状态**: ⏳ 待启动
**优先级**: 🔴 高
**依赖**: 13-Medium 发布员

**主要任务**:
- Reddit 推广（钓鱼法：Bait & Hook）
- Quora 问答推广
- Pinterest 图片推广
- 生成推广素材

**输出**:
- `docs/promotion/reddit_log.md` - Reddit 发帖记录
- `docs/promotion/quora_log.md` - Quora 回答记录
- `docs/promotion/pinterest_log.md` - Pinterest 记录

**启动**: 导入角色任务卡 `roles/14-traffic-promoter.md`

---

### 15-数据追踪员 (Data Tracker)

**文件**: `15-data-tracker.md`
**时长**: 4 小时（持续）
**状态**: ⏳ 待启动
**优先级**: 🟡 中（持续任务）
**依赖**: 13-Medium 发布员, 14-流量推广员

**主要任务**:
- 设置追踪系统
- 每日数据记录
- 每周分析报告
- 里程碑检查（止损线）
- 异常警报

**输出**:
- `docs/tracking/daily_log.md` - 每日数据日志
- `docs/tracking/weekly_report.md` - 每周分析报告

**启动**: 导入角色任务卡 `roles/15-data-tracker.md`

---

## 🔄 实验验证依赖关系

```
12-SEO 内容创作者 (8h)
    │
    └─→ 13-Medium 发布员 (4h)
              │
              ├─→ 14-流量推广员 (6h)
              │       │
              │       └─→ 15-数据追踪员 (持续)
              │
              └─→ 15-数据追踪员 (持续)
```

---

## ⚠️ 已暂停的角色

**暂停原因**: 在手动验证成功前，暂停所有开发任务

| 角色 | 文件 | 状态 |
|------|------|------|
| 07-产品经理 | `07-product-manager.md` | ⏸️ 暂停 |
| 08-前端优化 | `08-frontend-optimization.md` | ⏸️ 暂停 |
| 09-后端优化 | `09-backend-optimization.md` | ⏸️ 暂停 |
| 10-数据工程 | `10-data-engineering.md` | ⏸️ 暂停 |
| 11-测试工程 | `11-testing-engineering.md` | ⏸️ 暂停 |

---

## 📁 实验验证文件结构

```
/Users/kjonekong/Documents/Affi-Marketing/
├── docs/
│   ├── PHASE2_REQUIREMENTS.md     # 完整需求文档 (v3.1.1)
│   ├── content_material/          # 产品素材
│   ├── content/
│   │   └── drafts/                # 文章草稿
│   ├── deployment/                # 发布记录
│   ├── promotion/                 # 推广记录
│   └── tracking/                  # 数据追踪
└── roles/
    ├── 12-seo-content-creator.md
    ├── 13-medium-publisher.md
    ├── 14-traffic-promoter.md
    └── 15-data-tracker.md
```

---

## 🚀 启动顺序

### Week 1 Day 1-2: 内容准备
```
导入角色任务卡 roles/12-seo-content-creator.md
```

### Week 1 Day 3-4: 发布上线
```
导入角色任务卡 roles/13-medium-publisher.md
```

### Week 1 Day 5-6: 流量推广
```
导入角色任务卡 roles/14-traffic-promoter.md
```

### Week 1 Day 7-8: 数据追踪（启动后持续运行）
```
导入角色任务卡 roles/15-data-tracker.md
```

---

## 📊 Week 1 目标

| 阶段 | 日期 | 目标 | 负责角色 |
|------|------|------|----------|
| 素材收集 | Day 1-2 | 3 款产品素材 | 12-内容 |
| 内容创建 | Day 3-5 | 10 篇文章草稿 | 12-内容 |
| 发布上线 | Day 4-7 | 10 篇 Medium 文章 | 13-发布 |
| 流量推广 | Day 5-8 | Reddit/Quora/Pinterest | 14-推广 |
| 数据追踪 | Day 8-持续 | 每日数据记录 | 15-追踪 |

---

**版本**: 4.0.0 (实验验证阶段)
**最后更新**: 2026-03-04
**基于需求**: PHASE2_REQUIREMENTS.md v3.1.1

---

# 第二阶段角色 (已暂停)

## 📋 第二阶段角色列表

### 07-产品经理 (Product Manager)

**文件**: `07-product-manager.md`
**时长**: 16 小时
**状态**: ⏳ 待启动
**依赖**: 第一阶段上线运行

**主要任务**:
- 收集用户反馈
- 分析使用数据
- 制定功能优先级
- 编写用户故事

**输出**:
- `docs/PHASE2_REQUIREMENTS.md`
- `docs/USER_STORIES.md`

**启动**: 导入角色任务卡 `roles/07-product-manager.md`

---

### 08-前端优化工程师 (Frontend Optimization)

**文件**: `08-frontend-optimization.md`
**时长**: 20 小时
**状态**: ⏳ 待启动
**依赖**: 07-产品经理

**主要任务**:
- UI/UX 改进
- 性能优化 (代码分割、懒加载)
- 组件库完善
- 状态管理优化

**输出**:
- `frontend/src/components/common/` (完善组件库)
- `frontend/src/styles/` (设计规范)

**启动**: 导入角色任务卡 `roles/08-frontend-optimization.md`

---

### 09-后端优化工程师 (Backend Optimization)

**文件**: `09-backend-optimization.md`
**时长**: 24 小时
**状态**: ⏳ 待启动
**依赖**: 07-产品经理

**主要任务**:
- 性能优化 (查询、缓存)
- 并发处理 (连接池、队列)
- 测试补充 (单元、集成)
- 监控完善

**输出**:
- `backend-go/internal/cache/`
- `backend-go/internal/queue/`
- `backend-go/tests/`

**启动**: 导入角色任务卡 `roles/09-backend-optimization.md`

---

### 10-数据工程师 (Data Engineering)

**文件**: `10-data-engineering.md`
**时长**: 16 小时
**状态**: ⏳ 待启动
**依赖**: 07-产品经理

**主要任务**:
- 用户行为分析
- 转化漏斗分析
- 报表系统开发
- 数据可视化

**输出**:
- `ai-service/app/services/analytics/`
- 报表查询 API

**启动**: 导入角色任务卡 `roles/10-data-engineering.md`

---

### 11-测试工程师 (Testing Engineering)

**文件**: `11-testing-engineering.md`
**时长**: 12 小时
**状态**: ⏳ 待启动
**依赖**: 08, 09, 10

**主要任务**:
- 自动化测试 (E2E, API, UI)
- 压力测试 (并发、负载)
- 质量保证 (Bug分类、回归)

**输出**:
- `tests/e2e/`
- `tests/performance/`
- `docs/TEST_REPORT.md`

**启动**: 导入角色任务卡 `roles/11-testing-engineering.md`

---

## 🔄 第二阶段依赖关系

```
07-产品经理
    │
    ├─→ 08-前端优化 (需求输入)
    │
    ├─→ 09-后端优化 (性能目标)
    │
    └─→ 10-数据工程 (分析需求)

08-前端优化 ──┐
              │
09-后端优化 ───┼──→ 11-测试工程
              │
10-数据工程 ──┘
```

---

## 📁 协作文件

| 文件 | 用途 |
|------|------|
| `docs/PHASE2_PLAN.md` | 第二阶段详细计划 |
| `docs/SESSION_COLLABORATION.md` | 会话协作协议 |
| `docs/SESSION_REGISTRY.md` | 会话状态注册表 |
| `docs/SESSION_LOG.md` | 项目会话日志 |
| `docs/COLLABORATION_QUICK_START.md` | 协作快速指南 |
| `docs/MESSAGES/` | 跨会话消息 |

---

**版本**: 3.0.0 (第二阶段准备)
**最后更新**: 2026-03-03 15:00 UTC+8
