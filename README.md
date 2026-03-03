# Affi-Marketing

商业模式测试与统一管理平台 - 用于验证多种电商流量变现模式

## 项目概述

本项目是一个可扩展的商业模式测试平台，支持：
- 程序化 SEO + 联盟营销
- GEO (生成式引擎优化)
- AI 代理电商
- 自建联盟营销 SaaS

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + TypeScript + Element Plus |
| 后端 | Go 1.21 + Gin |
| AI服务 | Python + FastAPI + 多模型 |
| 数据库 | PostgreSQL + Redis |
| 存储 | MinIO (香港节点) |
| 部署 | Railway + Vercel + Cloudflare Workers |

## 域名

- `hub.zenconsult.top` - 前端控制台
- `api-hub.zenconsult.top` - 后端 API
- `tracker.zenconsult.top` - 追踪脚本
- `ai-api.zenconsult.top` - AI 服务

## 团队角色

项目由 6 个工程师角色协作完成：

| 角色 | 文件 | 时长 |
|------|------|------|
| 架构师 | `roles/01-architect.md` | 16h |
| 前端工程师 | `roles/02-frontend.md` | 24h |
| 数据库工程师 | `roles/03-database.md` | 8h |
| AI工程师 | `roles/04-ai-engine.md` | 20h |
| 后端工程师 | `roles/05-backend.md` | 32h |
| 部署测试 | `roles/06-devops.md` | 16h |

## 如何开始

### 作为工程师

1. 获取你的角色任务卡
2. 在 Claude Code 新会话中导入任务卡
3. 按照任务卡执行开发

**启动命令示例**:
```
导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/01-architect.md
```

### 启动顺序建议

1. **第一批**: 01-架构师 + 03-数据库工程师 (可并行)
2. **第二批**: 02-前端 + 04-AI + 05-后端 (等待第一批)
3. **第三批**: 06-部署测试 (等待第二批)

## 目录结构

```
Affi-Marketing/
├── roles/                   # 角色任务卡
├── backend-go/              # Go 后端
├── frontend/                # Vue 前端
├── ai-service/              # AI 服务
├── migrations/              # 数据库迁移
├── docs/                    # 架构文档
└── deployments/             # 部署配置
```

## 项目状态

查看 `PROJECT_STATUS.md` 获取最新项目状态。

## 基础设施

- **阿里云杭州**: PostgreSQL, Redis
- **香港**: MinIO, Chatwoot
- **云平台**: Railway, Vercel, Cloudflare

## 许可证

MIT
