# Affi-Marketing 角色任务卡索引

**项目**: Affi-Marketing (商业模式测试与统一管理平台)
**工作目录**: `/Users/kjonekong/Documents/Affi-Marketing`
**域名**: `zenconsult.top`
**团队规模**: 6人角色

---

## 🚀 快速启动

给工程师的角色任务卡位于 `/Users/kjonekong/Documents/Affi-Marketing/roles/`

**启动命令**: 在 Claude Code 新会话中说：
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/[角色文件名].md
```

---

## 📋 角色列表

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
