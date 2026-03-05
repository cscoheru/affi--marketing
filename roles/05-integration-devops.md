# 角色任务卡: 集成测试与部署工程师 (Integration Test & DevOps)

> **角色**: 集成测试与部署工程师
> **项目**: Affi-Marketing 集成测试与生产部署
> **工期**: 5-7天
> **优先级**: 🟢 低
> **依赖**: 02、03、04角色完成

---

## 🎯 任务目标

对整合后的系统进行全面测试，并将所有服务部署到生产环境。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/COLLABORATION.md` | 协作机制 |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 确认前置任务完成 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/docs/ARCHITECTURE.md` | 系统架构 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/docs/DEPLOYMENT_ARCHITECTURE.md` | 部署架构 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/` | 完整前端项目 |
| 6 | `/Users/kjonekong/Documents/Affi-Marketing/backend-go/` | Go后端项目 |
| 7 | `/Users/kjonekong/Documents/Affi-Marketing/ai-service/` | AI服务项目 |

**重要**: 确认02、03、04角色工作已完成，再开始测试。

---

## 📁 你的工作目录

```
frontend-unified/
│
├── tests/                    ← 你需要创建
│   ├── integration/          ← 集成测试
│   │   ├── auth.test.ts
│   │   ├── navigation.test.ts
│   │   ├── vue-components.test.ts
│   │   └── api-connection.test.ts
│   ├── e2e/                 ← 端到端测试
│   │   ├── user-flow.spec.ts
│   │   └── content-flow.spec.ts
│   └── performance/         ← 性能测试
│       └── lighthouse.config.js
│
├── deployment/              ← 你需要创建
│   ├── vercel.json          ← Vercel配置
│   ├── railway.json         ← Railway配置
│   ├── .env.example         ← 环境变量模板
│   └── README.md            ← 部署说明
│
└── docs/
    ├── TEST_REPORT.md       ← 你需要创建 (测试报告)
    └── DEPLOYMENT_LOG.md    ← 你需要创建 (部署日志)
```

---

## 🔧 具体任务

### 任务1: 环境验证 (Day 1)

#### 1.1 前端环境
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm install
npm run dev
```

#### 1.2 后端环境
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
go mod download
go run cmd/server/main.go
```

#### 1.3 AI服务环境
```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**验证清单**:
- [ ] 前端项目启动成功 (http://localhost:3000)
- [ ] 后端API可访问 (http://localhost:8080)
- [ ] AI服务可访问 (http://localhost:8000)
- [ ] 没有控制台错误
- [ ] 所有依赖安装成功

---

### 任务2: 集成测试 (Day 1-3)

#### 2.1 认证功能测试
**文件**: `frontend-unified/tests/integration/auth.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('认证功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('登录功能正常', async ({ page }) => {
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // 应该重定向到dashboard
    await expect(page).toHaveURL('http://localhost:3000/dashboard')
  })

  test('未登录访问受保护页面被重定向', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('API调用认证正常', async ({ page }) => {
    // 登录后测试API调用
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // 等待跳转
    await page.waitForURL('http://localhost:3000/dashboard')

    // 测试API调用
    const response = await page.request.get('http://localhost:8080/api/v1/experiments')
    expect(response.status()).toBe(200)
  })
})
```

#### 2.2 导航功能测试
**文件**: `frontend-unified/tests/integration/navigation.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('导航功能', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('侧边栏导航正常', async ({ page }) => {
    await page.click('text=实验管理')
    await expect(page).toHaveURL('/experiments')

    await page.click('text=产品管理')
    await expect(page).toHaveURL('/products')
  })

  test('侧边栏折叠功能正常', async ({ page }) => {
    const sidebar = page.locator('aside')
    await expect(sidebar).toHaveClass(/w-64/)

    await page.click('button:has-text("←")')
    await expect(sidebar).toHaveClass(/w-16/)
  })
})
```

#### 2.3 Vue组件加载测试
**文件**: `frontend-unified/tests/integration/vue-components.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Vue组件加载', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/dashboard')
  })

  test('仪表板Vue组件加载成功', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForSelector('.vue-dashboard-wrapper', { timeout: 5000 })
    await expect(page.locator('text=仪表板')).toBeVisible()
  })

  test('实验管理Vue组件加载成功', async ({ page }) => {
    await page.goto('http://localhost:3000/experiments')
    await page.waitForSelector('[data-vue-component]', { timeout: 5000 })
    await expect(page.locator('text=实验管理')).toBeVisible()
  })
})
```

#### 2.4 API连接测试
**文件**: `frontend-unified/tests/integration/api-connection.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('API连接测试', () => {
  const API_BASE = 'http://localhost:8080/api/v1'

  test('实验API可访问', async ({ request }) => {
    const response = await request.get(`${API_BASE}/experiments`)
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBeTruthy()
  })

  test('AI内容生成API可访问', async ({ request }) => {
    const response = await request.post(`${API_BASE}/ai/generate`, {
      data: {
        keyword: '测试关键词',
        type: 'seo_article'
      }
    })
    expect(response.status()).toBe(200)
  })
})
```

**安装Playwright**:
```bash
cd frontend-unified
npm install -D @playwright/test
npx playwright install
```

**运行测试**:
```bash
npx playwright test
```

---

### 任务3: 性能测试 (Day 3-4)

**文件**: `frontend-unified/tests/performance/lighthouse.config.js`

```javascript
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  },
}
```

**运行性能测试**:
```bash
npx lighthouse http://localhost:3000 --output=html --output-path=./reports/lighthouse.html
npx lighthouse http://localhost:3000/blog --output=html --output-path=./reports/lighthouse-blog.html
```

**性能目标**:
- [ ] Performance Score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] SEO Score > 90

---

### 任务4: 部署配置 (Day 4-5)

#### 4.1 Vercel配置
**文件**: `frontend-unified/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api-hub.zenconsult.top",
    "NEXT_PUBLIC_AI_URL": "https://ai-api.zenconsult.top"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

#### 4.2 Railway配置
**文件**: `backend-go/railway.toml`

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "/server"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

**文件**: `ai-service/railway.toml`

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
```

#### 4.3 环境变量模板
**文件**: `frontend-unified/.env.example`

```bash
# API配置
NEXT_PUBLIC_API_URL=https://api-hub.zenconsult.top
NEXT_PUBLIC_AI_URL=https://ai-api.zenconsult.top

# Vue远程模块
NEXT_PUBLIC_VUE_REMOTE_URL=https://hub.zenconsult.top/vue-remote

# 认证
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://hub.zenconsult.top
```

**文件**: `backend-go/.env.example`

```bash
# 服务器
SERVER_PORT=8080

# 数据库
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=business_hub

# Redis
REDIS_URL=redis://:password@host:6379

# AI服务
AI_SERVICE_URL=https://ai-api.zenconsult.top
AI_TIMEOUT=30s
```

#### 4.4 部署文档
**文件**: `frontend-unified/deployment/README.md`

```markdown
# Affi-Marketing 部署指南

## 前置条件
- Vercel账号
- Railway账号
- 域名配置权限

## 部署步骤

### 1. 前端部署 (Vercel)

```bash
cd frontend-unified
vercel login
vercel --prod
```

### 2. 后端部署 (Railway)

```bash
cd backend-go
railway login
railway new --name affi-backend
railway up
```

### 3. AI服务部署 (Railway)

```bash
cd ai-service
railway new --name affi-ai
railway up
```

### 4. DNS配置

| 类型 | 名称 | 值 |
|------|------|-----|
| CNAME | hub | [Vercel域名] |
| CNAME | api-hub | [Railway域名] |
| CNAME | ai-api | [Railway域名] |

## 验证检查

- [ ] 主应用部署成功
- [ ] 所有页面可以访问
- [ ] Vue组件正常加载
- [ ] API调用正常
- [ ] SEO验证通过

## 故障排查

### 构建失败
检查构建日志、修复错误、重新部署

### API调用失败
检查CORS配置、网络连接、环境变量

### DNS问题
使用 `dig` 或 `nslookup` 检查DNS传播
```

---

### 任务5: 生产部署 (Day 5-6)

#### 5.1 前端部署

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified

# 安装Vercel CLI
npm install -g vercel
vercel login

# 部署
vercel --prod

# 配置域名
vercel domains add hub.zenconsult.top
```

#### 5.2 后端部署

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go

# 安装Railway CLI
npm install -g @railway/cli
railway login

# 创建项目
railway new --name affi-marketing-backend

# 配置环境变量
railway variables set DATABASE_URL "your-database-url"
railway variables set REDIS_URL "your-redis-url"

# 部署
railway up
```

#### 5.3 AI服务部署

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service

railway new --name affi-marketing-ai
railway variables set OPENAI_API_KEY "your-key"
railway variables set DASHSCOPE_API_KEY "your-key"
railway up
```

#### 5.4 DNS配置

在域名注册商配置DNS记录：

| 类型 | 名称 | 值 | TTL |
|------|------|-----|-----|
| CNAME | hub | cname.vercel-dns.com | 3600 |
| CNAME | api-hub | [railway-domain] | 3600 |
| CNAME | ai-api | [railway-domain] | 3600 |

---

### 任务6: 部署后验证 (Day 6)

#### 6.1 服务健康检查

```bash
# 前端
curl https://hub.zenconsult.top

# 后端
curl https://api-hub.zenconsult.top/health

# AI服务
curl https://ai-api.zenconsult.top/health
```

#### 6.2 功能验证清单

- [ ] 用户可以登录
- [ ] 所有页面可访问
- [ ] Vue组件加载正常
- [ ] React组件渲染正常
- [ ] API调用成功
- [ ] AI内容生成可用
- [ ] 路由跳转正常
- [ ] 状态同步正常

#### 6.3 性能验证

```bash
# 运行Lighthouse
npx lighthouse https://hub.zenconsult.top --view
```

目标：
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

---

### 任务7: 编写测试报告 (Day 6-7)

**文件**: `frontend-unified/docs/TEST_REPORT.md`

```markdown
# Affi-Marketing 测试报告

**测试日期**: YYYY-MM-DD
**测试工程师**: 05-集成测试与部署
**测试版本**: v1.0

## 测试概述

| 测试类型 | 测试用例数 | 通过数 | 失败数 | 通过率 |
|---------|----------|--------|--------|--------|
| 功能测试 | 20 | 18 | 2 | 90% |
| 性能测试 | 5 | 5 | 0 | 100% |
| SEO测试 | 15 | 13 | 2 | 87% |
| 兼容性测试 | 8 | 8 | 0 | 100% |

## 功能测试结果

### ✅ 通过的功能
- [x] 用户登录/登出
- [x] 路由导航
- [x] 侧边栏折叠
- [x] Vue组件加载
- [x] React组件渲染
- [x] 状态同步
- [x] API连接

### ❌ 失败的功能
- [ ] (列出失败项)

## 性能测试结果

### Lighthouse分数
- Performance: 92
- Accessibility: 95
- Best Practices: 90
- SEO: 88

### 页面加载时间
- 首页: 1.2s
- 仪表板: 2.1s
- 博客: 0.8s

## 部署信息

### 已部署服务
| 服务 | 平台 | 域名 | 状态 |
|------|------|------|------|
| 前端 | Vercel | hub.zenconsult.top | ✅ |
| 后端API | Railway | api-hub.zenconsult.top | ✅ |
| AI服务 | Railway | ai-api.zenconsult.top | ✅ |

## 遗留问题

| 问题ID | 优先级 | 问题描述 | 状态 |
|--------|--------|----------|------|
| ISSUE-1 | 🔴 高 | ... | 待修复 |
| ISSUE-2 | 🟡 中 | ... | 待修复 |

## 建议

1. ...
2. ...
3. ...
```

**文件**: `frontend-unified/docs/DEPLOYMENT_LOG.md`

```markdown
# Affi-Marketing 部署日志

**部署日期**: YYYY-MM-DD
**部署工程师**: 05-集成测试与部署

## 部署记录

### 前端部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Vercel
- 域名: hub.zenconsult.top
- 状态: ✅ 成功
- 提交: [commit-hash]

### 后端部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Railway
- 域名: api-hub.zenconsult.top
- 状态: ✅ 成功
- 镜像: [image-tag]

### AI服务部署
- 时间: YYYY-MM-DD HH:MM
- 平台: Railway
- 域名: ai-api.zenconsult.top
- 状态: ✅ 成功
- 镜像: [image-tag]

## DNS配置

- 配置时间: YYYY-MM-DD HH:MM
- 传播状态: ✅ 完成
- SSL证书: ✅ 有效

## 回滚计划

如需回滚：
1. 前端: `vercel rollback [deployment-id]`
2. 后端: `railway rollback`
3. AI服务: `railway rollback`
```

---

## ✅ 完成标准

- [ ] 所有测试用例执行完成
- [ ] 测试报告编写完成
- [ ] 所有服务部署到生产环境
- [ ] DNS配置完成并传播
- [ ] 健康检查全部通过
- [ ] 性能测试达标
- [ ] 监控配置完成
- [ ] 部署文档完成

---

## 📤 交付物

完成后，更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 05-集成测试与部署
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- frontend-unified/tests/: 测试用例
- frontend-unified/deployment/: 部署配置
- frontend-unified/vercel.json: Vercel配置
- frontend-unified/docs/TEST_REPORT.md: 测试报告
- frontend-unified/docs/DEPLOYMENT_LOG.md: 部署日志

**部署状态**:
- [ ] 前端已部署: https://hub.zenconsult.top
- [ ] 后端已部署: https://api-hub.zenconsult.top
- [ ] AI服务已部署: https://ai-api.zenconsult.top

**测试结果**:
- [ ] 功能测试通过率 > 90%
- [ ] 性能测试LCP < 2.5s
- [ ] SEO分数 > 90
- [ ] 所有服务健康检查通过

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [05-集成测试与部署] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要02-React前端修复: (具体问题)
- [ ] 需要03-Vue迁移修复: (具体问题)
- [ ] 需要04-后端与AI修复: (具体问题)

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 📞 协作提示

1. 你需要 **02、03、04** 角色的代码完成才能开始测试
2. 发现问题时，详细记录并通知对应角色
3. 阻塞性问题立即写入问题文件
4. 部署完成后，通知项目经理

---

## 🚀 快速启动

```bash
# 运行测试
cd frontend-unified
npx playwright test

# 部署到Vercel
vercel --prod

# 部署到Railway
cd backend-go
railway up

cd ../ai-service
railway up
```

---

**任务卡版本**: v1.0
**创建时间**: 2026-03-05

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/05-integration-devops.md"
