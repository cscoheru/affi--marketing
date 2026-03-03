# Affi-Marketing 部署指南

本文档提供 Affi-Marketing 项目的完整部署指南。

## 目录

- [服务概览](#服务概览)
- [前提条件](#前提条件)
- [Railway 部署](#railway-部署)
- [Vercel 部署](#vercel-部署)
- [DNS 配置](#dns-配置)
- [环境变量配置](#环境变量配置)
- [验证部署](#验证部署)

## 服务概览

| 服务 | 平台 | 域名 | 仓库路径 |
|------|------|------|----------|
| Backend API | Railway | api-hub.zenconsult.top | backend-go/ |
| AI Service | Railway | ai-api.zenconsult.top | ai-service/ |
| Frontend | Vercel | hub.zenconsult.top | frontend/ |

## 前提条件

### 必需账户

- [Railway](https://railway.app/) 账户
- [Vercel](https://vercel.com/) 账户
- [Cloudflare](https://www.cloudflare.com/) 账户
- GitHub 账户

### 必需工具

```bash
# Railway CLI
npm install -g @railway/cli

# Vercel CLI
npm install -g vercel

# Git
# 已安装
```

### 外部服务

- PostgreSQL 数据库
- Redis 缓存
- MinIO 对象存储

## Railway 部署

### 1. Backend API 部署

```bash
cd backend-go

# 初始化 Railway 项目
railway init

# 配置环境变量
railway variables set CORS_ALLOWED_ORIGINS "https://hub.zenconsult.top,http://localhost:5173"
railway variables set CORS_ALLOWED_METHODS "GET,POST,PUT,DELETE,OPTIONS"
railway variables set CORS_ALLOWED_HEADERS "*"
railway variables set DATABASE_URL "your_database_url"
railway variables set REDIS_URL "your_redis_url"

# 部署
railway up
```

### 2. AI Service 部署

```bash
cd ai-service

# 链接到现有 Railway 项目
railway link

# 设置 Root Directory 为 ai-service (在 Railway Dashboard)

# 配置环境变量
railway variables set CORS_ORIGINS "*"
railway variables set DASHSCOPE_API_KEY "your_dashscope_key"
railway variables set OPENAI_API_KEY "your_openai_key"

# 部署
railway up
```

### Railway 配置文件

**railway.toml** (Backend):
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 30000
```

**railway.toml** (AI Service):
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30000
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Vercel 部署

### 1. 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 部署到 Vercel
vercel --prod
```

### 2. 环境变量配置

在 Vercel Dashboard 中添加以下环境变量:

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_API_BASE_URL` | `https://api-hub.zenconsult.top/api/v1` | Production |
| `VITE_USE_MOCK` | `false` | Production |

或使用 CLI:

```bash
vercel env add VITE_API_BASE_URL production --value https://api-hub.zenconsult.top/api/v1
vercel env add VITE_USE_MOCK production --value false
```

### 3. 自定义域名配置

1. 在 Vercel Dashboard → Settings → Domains
2. 添加域名: `hub.zenconsult.top`
3. Vercel 会自动配置 DNS 验证

## DNS 配置

在 Cloudflare DNS 中添加以下记录:

| 类型 | 名称 | 目标 | 代理状态 |
|------|------|------|----------|
| CNAME | api-hub | affi-marketing-production.up.railway.app | DNS only |
| CNAME | hub | cname.vercel-dns.com | Proxied |
| CNAME | ai-api | ai-service-production-9f1b.up.railway.app | DNS only |

## 环境变量配置

### Backend 环境变量

```bash
# Server
GIN_MODE=release
SERVER_PORT=8080

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_MAX_OPEN_CONNS=100
DATABASE_MAX_IDLE_CONNS=10

# Redis
REDIS_HOST=host
REDIS_PORT=6379
REDIS_PASSWORD=password

# JWT
JWT_SECRET=your_secret_key

# CORS
CORS_ALLOWED_ORIGINS=https://hub.zenconsult.top,http://localhost:5173
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=*

# AI Service
AI_SERVICE_URL=https://ai-api.zenconsult.top
AI_SERVICE_TIMEOUT=30s

# MinIO
MINIO_ENDPOINT=your_minio_endpoint
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key
```

### AI Service 环境变量

```bash
# Application
ENVIRONMENT=production
DEBUG=false
API_PORT=8000

# CORS
CORS_ORIGINS=*

# AI API Keys
DASHSCOPE_API_KEY=your_dashscope_key
OPENAI_API_KEY=your_openai_key
CHATGLM_API_KEY=your_chatglm_key

# Model Configuration
DEFAULT_MODEL=qwen-turbo
FALLBACK_MODEL=gpt-3.5-turbo

# Budget
DAILY_TOKEN_LIMIT=1000000
DAILY_COST_LIMIT=100
```

### Frontend 环境变量

```bash
# API
VITE_API_BASE_URL=https://api-hub.zenconsult.top/api/v1
VITE_USE_MOCK=false
```

## 验证部署

### 1. 健康检查

```bash
# Backend
curl https://api-hub.zenconsult.top/

# AI Service
curl https://ai-api.zenconsult.top/health

# Frontend
curl -I https://hub.zenconsult.top/
```

### 2. API 测试

```bash
# 实验列表
curl -H "Origin: https://hub.zenconsult.top" \
  https://api-hub.zenconsult.top/api/v1/experiments

# AI 模型列表
curl https://ai-api.zenconsult.top/api/v1/models
```

### 3. 集成测试

```bash
# 运行集成测试脚本
./docs/integration-test.sh

# 验证 DNS
./docs/verify-dns.sh
```

## 故障排除

### CORS 错误

**症状**: `origin not allowed`

**解决方案**:
1. 检查 Railway Backend 的 `CORS_ALLOWED_ORIGINS` 环境变量
2. 确保包含前端域名
3. 重新部署 Backend 服务

### Network Error

**症状**: 前端无法连接后端 API

**解决方案**:
1. 检查 Vercel 环境变量 `VITE_API_BASE_URL`
2. 检查 Vercel 部署日志
3. 重新部署前端

### DNS 传播延迟

**症状**: 域名无法访问

**解决方案**:
1. 使用 `dig` 命令检查 DNS: `dig hub.zenconsult.top`
2. 等待 DNS 传播 (最多 48 小时)
3. 清除本地 DNS 缓存

## 维护命令

### Railway

```bash
# 查看状态
railway status

# 查看日志
railway logs --tail 50

# 重新部署
railway up

# 打开控制台
railway open
```

### Vercel

```bash
# 查看部署列表
vercel list

# 查看环境变量
vercel env ls

# 重新部署
vercel --prod

# 打开项目
vercel open
```

## 更新部署

### 更新 Backend

```bash
cd backend-go
git add .
git commit -m "feat: description"
git push
# Railway 会自动部署
```

### 更新 Frontend

```bash
cd frontend
git add .
git commit -m "feat: description"
git push
# Vercel 会自动部署
```

### 更新 AI Service

```bash
cd ai-service
git add .
git commit -m "feat: description"
git push
# Railway 会自动部署
```

## 监控和日志

### Railway 监控

- 访问 Railway Dashboard
- 查看 Metrics 标签
- 设置告警规则

### Vercel Analytics

- 访问 Vercel Dashboard
- 查看 Analytics 标签
- 配置 Web Vitals

### 日志聚合

- Railway: Dashboard → Logs
- Vercel: Dashboard → Logs

## 联系支持

如有问题，请联系:
- GitHub Issues: https://github.com/cscoheru/affi--marketing/issues
- 技术文档: /docs
