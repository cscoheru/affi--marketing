# 角色任务卡: 集成测试与部署工程师 (Integration Test & DevOps)

> **角色**: 集成测试与部署工程师
> **项目**: Affi-Marketing 集成测试与生产部署
> **工期**: 5-7天
> **当前状态**: 🟡 进行中 (集成测试完成，等待生产部署)
> **最后更新**: 2026-03-05 23:30

---

## 📊 当前进度

| 阶段 | 状态 | 进度 | 说明 |
|------|------|------|------|
| 集成测试 | ✅ 完成 | 100% | 170个测试用例，88%通过率 |
| 部署配置 | ✅ 完成 | 100% | Vercel + Railway 配置已就绪 |
| 生产部署 | ⏸️ 待执行 | 0% | 等待执行 |
| 部署验证 | ⏸️ 待执行 | 0% | 部署后验证 |

---

## 🎯 剩余任务：生产环境部署

### ⚠️ 部署前准备

**重要**: 在开始部署前，必须先推送代码到 GitHub！

```bash
cd /Users/kjonekong/Documents/Affi-Marketing

# 检查当前状态
git status

# 当前状态显示:
# - Your branch is ahead of 'origin/main' by 41 commits
# - 有未提交的修改文件
# - 有未跟踪的新文件 (测试文件、修复任务卡等)

# 第一步：提交所有更改
git add -A
git commit -m "feat: complete integration testing and deployment preparation

- React frontend: 100% (29/29 tests passed)
- Vue integration: 92% (12/13 tests passed)
- Backend API: 79% (75/95 tests passed, all critical issues fixed)
- AI service: 100% (21/21 tests passed)
- Performance: 100% (12/12 tests passed)

Backend fixes:
- BE-03: Added /api/v1/settlements alias route
- BE-02: Updated Redis password placeholder
- BE-04: Removed duplicate auth controller, re-enabled content.RegisterRoutes

Deployment configurations ready:
- Vercel: frontend-unified/vercel.json
- Railway: backend-go/railway.toml, ai-service/railway.toml
- Environment templates: .env.example files

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# 第二步：推送到 GitHub
git push origin main

# 第三步：验证推送成功
git status
# 应该显示: "Your branch is up to date with 'origin/main'"
```

---

## 📋 已完成的测试工作

### 测试结果汇总 (v1.3.0)

| 测试类型 | 用例数 | 通过数 | 失败数 | 通过率 |
|---------|--------|--------|--------|--------|
| React前端功能 | 29 | 29 | 0 | 100% |
| Vue组件集成 | 13 | 12 | 1 | 92% |
| 后端API连接 | 95 | 75 | 20 | 79% |
| AI服务API | 21 | 21 | 0 | 100% |
| 性能测试 | 12 | 12 | 0 | 100% |
| **总计** | **170** | **149** | **21** | **88%** |

### 已创建的测试文件

```
frontend-unified/tests/
├── integration/
│   ├── auth.test.ts              # React认证测试 ✅
│   ├── navigation.test.ts        # React导航测试 ✅
│   ├── react-pages.test.ts       # React页面测试 ✅
│   ├── vue-components.test.ts    # Vue组件集成测试 ✅
│   ├── api-connection.test.ts    # 后端API测试 ✅
│   ├── ai-service.test.ts        # AI服务测试 ✅
│   └── performance.test.ts       # 性能测试 ✅
└── playwright.config.ts          # Playwright配置
```

### 已创建的部署配置

```
frontend-unified/
├── vercel.json                   # Vercel部署配置 ✅
├── .env.example                  # 环境变量模板 ✅
└── deployment/
    └── README.md                 # 部署文档 ✅

backend-go/
├── railway.toml                  # Railway部署配置 ✅
└── .env.example                  # 环境变量模板 ✅

ai-service/
├── railway.toml                  # Railway部署配置 ✅
└── .env.example                  # 环境变量模板 ✅

项目根目录/
└── DEPLOYMENT_GUIDE.md           # 完整部署指南 ✅
```

### 已创建的文档

```
frontend-unified/docs/
├── TEST_REPORT.md                # 测试报告 v1.3.0 ✅
└── DEPLOYMENT_LOG.md             # 部署日志 ✅

项目根目录/
├── DEPLOYMENT_GUIDE.md           # 部署指南 ✅
├── PROJECT_PROGRESS.md           # 项目进度 ✅
└── PROJECT_ISSUES.md             # 问题追踪 ✅
```

---

## 🚀 生产部署步骤

### 步骤1: Vercel 前端部署

#### 方案选择

| 方案 | 适用场景 | 操作 |
|------|----------|------|
| 🆕 新建项目 | 首次部署 | `vercel` → `vercel --prod` |
| 🔄 更新现有 | 已有项目 | `vercel link` → `vercel --prod` |

#### 执行步骤

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 进入前端目录
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified

# 4a. 首次部署 (新建项目)
vercel
# - Set up and deploy: Yes
# - Which scope: 选择你的账号
# - Link to existing project: No
# - Project name: affi-marketing-frontend
# - In which directory: . (当前目录)
# - Override settings: No

# 4b. 更新现有项目
# vercel link
# 选择现有项目

# 5. 生产环境部署
vercel --prod
```

#### 配置环境变量

访问: https://vercel.com/dashboard → 项目 → Settings → Environment Variables

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `NEXT_PUBLIC_API_URL` | `https://api-hub.zenconsult.top` | Production, Preview |
| `NEXT_PUBLIC_AI_URL` | `https://ai-api.zenconsult.top` | Production, Preview |
| `NEXTAUTH_SECRET` | `[openssl rand -base64 32]` | Production |
| `NEXTAUTH_URL` | `https://hub.zenconsult.top` | Production |

#### 配置自定义域名

1. 进入项目 → Settings → Domains
2. 添加域名: `hub.zenconsult.top`
3. Vercel 会显示 DNS 配置

---

### 步骤2: Railway 后端部署

#### 方案选择

| 方案 | 适用场景 | 操作 |
|------|----------|------|
| 🆕 新建项目 | 首次部署 | `railway new` → `railway add` |
| 🔄 更新现有 | 已有项目 | `railway link` → `railway up` |

#### 执行步骤

```bash
# 1. 安装 Railway CLI
npm install -g @railway/cli

# 2. 登录 Railway
railway login

# 3. 创建新项目 (如果需要)
railway new
# 选择: Empty Project

# 4. 进入后端目录
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go

# 5. 添加后端服务
railway add
# 选择: Dockerfile

# 6. 配置环境变量
railway variables set DATABASE_HOST "139.224.42.111"
railway variables set DATABASE_PORT "5432"
railway variables set DATABASE_USER "postgres"
railway variables set DATABASE_PASSWORD "WhjQTPAwInc5Vav3sDWe"
railway variables set DATABASE_DB_NAME "business_hub"
railway variables set DATABASE_SSL_MODE "disable"
railway variables set REDIS_HOST "139.224.42.111"
railway variables set REDIS_PORT "6379"
railway variables set REDIS_PASSWORD "[在Railway Dashboard中设置]"
railway variables set REDIS_DB "0"
railway variables set JWT_SECRET "[生成随机字符串]"
railway variables set AI_SERVICE_URL "https://ai-api.zenconsult.top"
railway variables set CORS_ALLOWED_ORIGINS "https://hub.zenconsult.top"
railway variables set SERVER_MODE "release"

# 7. 配置域名
railway domain
# 输入: api-hub.zenconsult.top

# 8. 部署
railway up
```

---

### 步骤3: Railway AI服务部署

```bash
# 1. 进入 AI 服务目录
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service

# 2. 在同一个 Railway 项目中添加新服务
railway add
# 选择: Python 或 Dockerfile

# 3. 配置环境变量
railway variables set OPENAI_API_KEY "[你的OpenAI密钥]"
railway variables set ANTHROPIC_API_KEY "[你的Anthropic密钥]"
railway variables set DASHSCOPE_API_KEY "[你的通义千问密钥]"
railway variables set CHATGLM_API_KEY "[你的ChatGLM密钥]"
railway variables set PORT "8000"

# 4. 配置域名
railway domain
# 输入: ai-api.zenconsult.top

# 5. 部署
railway up
```

---

### 步骤4: DNS 配置

#### 获取域名信息

**Vercel**: Dashboard → Settings → Domains → 复制 CNAME 目标
**Railway**: Dashboard → Settings → Domains → 复制每个服务的 CNAME

#### 配置 DNS 记录

登录 zenconsult.top 域名管理面板，添加以下记录：

| 类型 | 名称 | 值 | TTL |
|------|------|-----|-----|
| CNAME | hub | cname.vercel-dns.com | 3600 |
| CNAME | api-hub | [Railway后端域名] | 3600 |
| CNAME | ai-api | [Railway AI服务域名] | 3600 |
| CNAME | www | hub.zenconsult.top | 3600 |

---

### 步骤5: 部署验证

#### 前端验证

```bash
# 1. 检查主页
curl https://hub.zenconsult.top

# 2. 在浏览器测试
# - 访问 https://hub.zenconsult.top
# - 测试登录 (demo@example.com / demo123456)
# - 检查控制台无错误
```

#### 后端验证

```bash
# 健康检查
curl https://api-hub.zenconsult.top/health

# 登录测试
curl -X POST https://api-hub.zenconsult.top/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123456"}'
```

#### AI服务验证

```bash
# 健康检查
curl https://ai-api.zenconsult.top/health

# 模型列表
curl https://ai-api.zenconsult.top/api/v1/models
```

#### DNS验证

```bash
# 检查域名解析
dig hub.zenconsult.top
dig api-hub.zenconsult.top
dig ai-api.zenconsult.top
```

---

## ✅ 部署检查清单

### 前端 (Vercel)
- [ ] 代码已推送到 GitHub
- [ ] Vercel项目已创建/连接
- [ ] 环境变量已配置
- [ ] 自定义域名已添加
- [ ] 主页可访问: https://hub.zenconsult.top
- [ ] 登录功能正常
- [ ] 静态资源加载正常
- [ ] 控制台无错误

### 后端 (Railway)
- [ ] Railway项目已创建
- [ ] 后端服务已添加
- [ ] 环境变量已配置
- [ ] 自定义域名已配置
- [ ] 健康检查正常: /health
- [ ] API响应正常
- [ ] 数据库连接成功
- [ ] Redis连接成功

### AI服务 (Railway)
- [ ] AI服务已添加
- [ ] API密钥已配置
- [ ] 自定义域名已配置
- [ ] 健康检查正常: /health
- [ ] AI模型加载正常

### DNS
- [ ] 所有CNAME记录已添加
- [ ] DNS传播完成
- [ ] SSL证书有效
- [ ] 无浏览器安全警告

---

## 📝 部署后任务

### 1. 更新 DEPLOYMENT_LOG.md

```markdown
## 🚀 生产环境部署完成 (2026-03-05)

### 部署记录

#### 前端部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Vercel
- 域名: https://hub.zenconsult.top
- 状态: ✅ 成功
- 部署ID: [vercel-deployment-id]

#### 后端部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Railway
- 域名: https://api-hub.zenconsult.top
- 状态: ✅ 成功
- 服务ID: [railway-service-id]

#### AI服务部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Railway
- 域名: https://ai-api.zenconsult.top
- 状态: ✅ 成功
- 服务ID: [railway-service-id]

### DNS配置
- 配置时间: YYYY-MM-DD HH:MM
- 传播状态: ✅ 完成
- SSL证书: ✅ 有效

### 验证结果
- [ ] 前端健康检查通过
- [ ] 后端健康检查通过
- [ ] AI服务健康检查通过
- [ ] 用户登录功能正常
- [ ] API调用正常
- [ ] Vue组件加载正常
```

### 2. 更新 PROJECT_PROGRESS.md

```markdown
### 05-集成测试与部署
**状态**: ✅完成
**完成时间**: 2026-03-05

**产出文件**:
- [x] 所有测试文件
- [x] 所有部署配置
- [x] TEST_REPORT.md v1.3.0
- [x] DEPLOYMENT_LOG.md
- [x] DEPLOYMENT_GUIDE.md

**部署状态**:
- [x] 前端已部署: https://hub.zenconsult.top
- [x] 后端已部署: https://api-hub.zenconsult.top
- [x] AI服务已部署: https://ai-api.zenconsult.top

**测试结果**:
- [x] 功能测试: 88% (149/170)
- [x] 性能测试: 100% (12/12)
- [x] 所有服务健康检查通过
```

### 3. 设置监控 (可选)

- 配置 UptimeRobot 监控健康检查端点
- 设置 Vercel Analytics
- 配置 Railway 日志告警

---

## 🔧 故障排查

### Vercel 部署失败

```bash
# 查看部署日志
vercel logs

# 本地构建测试
cd frontend-unified
npm run build

# 强制重新部署
vercel --force
```

### Railway 服务启动失败

```bash
# 查看日志
railway logs

# 检查环境变量
railway variables list

# 重启服务
railway up --detach
```

### DNS 未生效

```bash
# 检查 DNS 传播
dig hub.zenconsult.top
nslookup hub.zenconsult.top

# 清除本地 DNS 缓存 (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 使用临时域名测试
# Vercel: https://affi-marketing-frontend.vercel.app
# Railway: 查看Dashboard显示的临时域名
```

---

## 📚 相关文档

| 文档 | 路径 | 用途 |
|------|------|------|
| 完整部署指南 | `/DEPLOYMENT_GUIDE.md` | 详细步骤说明 |
| 部署文档 | `/frontend-unified/deployment/README.md` | 部署参考 |
| 测试报告 | `/frontend-unified/docs/TEST_REPORT.md` | 测试结果 |
| 部署日志 | `/frontend-unified/docs/DEPLOYMENT_LOG.md` | 部署记录 |
| 项目进度 | `/PROJECT_PROGRESS.md` | 进度追踪 |
| 问题追踪 | `/PROJECT_ISSUES.md` | 问题记录 |

---

## ✅ 完成标准

- [ ] 代码已推送到 GitHub
- [ ] 前端已部署到 Vercel
- [ ] 后端已部署到 Railway
- [ ] AI服务已部署到 Railway
- [ ] DNS配置完成并传播
- [ ] 所有服务健康检查通过
- [ ] 功能验证通过
- [ ] DEPLOYMENT_LOG.md已更新
- [ ] PROJECT_PROGRESS.md已更新

---

## 📤 交付物模板

完成后，更新 `/PROJECT_PROGRESS.md`:

```markdown
### 05-集成测试与部署
**状态**: ✅完成
**完成时间**: [YYYY-MM-DD HH:MM]

**测试结果**:
- React前端: 100% (29/29)
- Vue组件集成: 92% (12/13)
- 后端API: 79% (75/95)
- AI服务: 100% (21/21)
- 性能测试: 100% (12/12)
- **总计**: 88% (149/170)

**部署状态**:
- [x] 前端: https://hub.zenconsult.top (Vercel)
- [x] 后端: https://api-hub.zenconsult.top (Railway)
- [x] AI服务: https://ai-api.zenconsult.top (Railway)
- [x] DNS配置完成
- [x] SSL证书有效

**遗留问题**:
- [ ] (如有，在此列出)
```

---

## ❓ 遇到问题

遇到问题时，写入 `/PROJECT_ISSUES.md`:

```markdown
### [05-集成测试与部署] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 🚀 快速启动命令

```bash
# 推送代码
git add -A && git commit -m "feat: complete integration testing" && git push origin main

# Vercel部署
cd frontend-unified
vercel login && vercel --prod

# Railway后端部署
cd ../backend-go
railway login && railway up

# Railway AI服务部署
cd ../ai-service
railway up

# 验证部署
curl https://hub.zenconsult.top
curl https://api-hub.zenconsult.top/health
curl https://ai-api.zenconsult.top/health
```

---

**任务卡版本**: v2.0
**创建时间**: 2026-03-05
**最后更新**: 2026-03-05 23:30
**更新内容**: 更新为部署执行阶段，包含完整的部署步骤和验证清单

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/05-integration-devops.md"
