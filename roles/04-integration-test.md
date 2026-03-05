# 任务卡: 04-集成测试工程师

> **角色**: 集成测试工程师
> **项目**: Affi-Marketing 前端整合
> **工期**: 5-7天
> **优先级**: 🟢 低
> **依赖**: 02-React前端工程师、03-Vue迁移工程师完成

---

## 🎯 任务目标

对整合后的系统进行全面测试，包括跨框架功能测试、性能测试、SEO验证和部署配置。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/roles/00-project-overview.md` | 项目总览 |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/` | 完整的前端项目 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 了解其他角色的完成情况 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/app/(dashboard)/layout.tsx` | 测试目标 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/app/(content)/layout.tsx` | 测试目标 |

**重要**: 确认02和03角色的工作已完成，再开始测试。

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
│   │   └── cross-framework.test.ts
│   ├── e2e/                 ← 端到端测试
│   │   ├── user-flow.spec.ts
│   │   └── blog-flow.spec.ts
│   └── performance/         ← 性能测试
│       └── lighthouse.config.js
│
├── deployment/              ← 你需要创建
│   ├── vercel.json          ← Vercel部署配置
│   ├── .env.example         ← 环境变量模板
│   └── README.md            ← 部署说明
│
└── docs/                    ← 你需要创建
    └── TEST_REPORT.md       ← 测试报告
```

---

## 🔧 具体任务

### 任务1: 环境验证 (Day 1)

确保项目可以正常运行：

```bash
cd frontend-unified
npm install
npm run dev
```

验证清单：
- [ ] 项目可以启动
- [ ] 浏览器访问 `http://localhost:3000` 正常
- [ ] 没有控制台错误
- [ ] 所有依赖安装成功

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

  test('登录后可以访问所有页面', async ({ page }) => {
    // 先登录
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // 测试各个页面
    const pages = ['/dashboard', '/experiments', '/products', '/blog']
    for (const path of pages) {
      await page.goto(`http://localhost:3000${path}`)
      await expect(page).toHaveURL(`http://localhost:3000${path}`)
    }
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
  })

  test('侧边栏导航正常', async ({ page }) => {
    // 点击侧边栏导航
    await page.click('text=实验管理')
    await expect(page).toHaveURL('/experiments')

    await page.click('text=产品管理')
    await expect(page).toHaveURL('/products')
  })

  test('侧边栏折叠功能正常', async ({ page }) => {
    // 检查侧边栏展开状态
    const sidebar = page.locator('aside')
    await expect(sidebar).toHaveClass(/w-64/)

    // 点击折叠按钮
    await page.click('button:has-text("←")')

    // 检查侧边栏折叠状态
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
    // 登录
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')
  })

  test('仪表板Vue组件加载成功', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard')

    // 等待Vue组件加载
    await page.waitForSelector('.vue-dashboard-wrapper', { timeout: 5000 })

    // 检查组件内容
    await expect(page.locator('text=仪表板')).toBeVisible()
  })

  test('实验管理Vue组件加载成功', async ({ page }) => {
    await page.goto('http://localhost:3000/experiments')

    await page.waitForSelector('[data-vue-component]', { timeout: 5000 })
    await expect(page.locator('text=实验管理')).toBeVisible()
  })
})
```

#### 2.4 跨框架状态同步测试

**文件**: `frontend-unified/tests/integration/cross-framework.test.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('跨框架状态同步', () => {
  test('登录状态在Vue和React间同步', async ({ page }) => {
    // 在React页面登录
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'demo@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button[type="submit"]')

    // 导航到Vue页面
    await page.goto('http://localhost:3000/dashboard')

    // 检查Vue组件可以访问用户状态
    const userInfo = await page.evaluate(() => {
      return localStorage.getItem('auth_token')
    })
    expect(userInfo).toBeTruthy()
  })
})
```

### 任务3: 性能测试 (Day 3-4)

**文件**: `frontend-unified/tests/performance/lighthouse.config.js`

```javascript
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  },
  passes: [
    {
      passName: 'defaultPass',
      recordTrace: true,
      useThrottling: true,
    },
  ],
}
```

运行性能测试：

```bash
npx lighthouse http://localhost:3000 --output=html --output-path=./reports/lighthouse.html
npx lighthouse http://localhost:3000/blog --output=html --output-path=./reports/lighthouse-blog.html
```

性能目标：
- [ ] Performance Score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] SEO Score > 90

### 任务4: 部署配置 (Day 4-5)

#### 4.1 Vercel配置

**文件**: `frontend-unified/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "headers": [
    {
      "source": "/vue-remote/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/vue-remote/:path*",
      "destination": "https://vue-remote.zenconsult.top/:path*"
    }
  ]
}
```

#### 4.2 环境变量

**文件**: `frontend-unified/.env.example`

```bash
# API配置
NEXT_PUBLIC_API_URL=https://api-hub.zenconsult.top
NEXT_PUBLIC_AI_API_URL=https://ai-api.zenconsult.top

# Vue远程模块
NEXT_PUBLIC_VUE_REMOTE_URL=https://hub.zenconsult.top/vue-remote

# 认证
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://hub.zenconsult.top
```

#### 4.3 部署说明

**文件**: `frontend-unified/deployment/README.md`

```markdown
# 部署指南

## 前置条件
- Vercel账号
- 域名配置: hub.zenconsult.top

## 部署步骤

1. 连接Vercel仓库
2. 配置环境变量
3. 部署主应用
4. 部署Vue远程模块 (可选)
5. 配置域名DNS

## 验证检查
- [ ] 主应用部署成功
- [ ] 所有页面可以访问
- [ ] Vue组件正常加载
- [ ] API调用正常
- [ ] SEO验证通过
```

### 任务5: SEO验证 (Day 5)

**文件**: `frontend-unified/tests/seo/checklist.md`

```markdown
# SEO验证清单

## 基础SEO
- [ ] 每个页面有唯一的title
- [ ] 每个页面有meta description
- [ ] 使用语义化HTML标签
- [ ] 图片有alt属性

## 结构化数据
- [ ] 实现JSON-LD结构化数据
- [ ] 配置Open Graph标签
- [ ] 配置Twitter Card标签

## 技术SEO
- [ ] 生成sitemap.xml
- [ ] 生成robots.txt
- [ ] 配置canonical标签
- [ ] 实现RSS feed

## 性能SEO
- [ ] Lighthouse SEO分数 > 90
- [ ] 页面加载速度 < 3s
- [ ] 移动端友好
- [ ] HTTPS已启用

## 内容SEO
- [ ] 博客文章有正确的标题层级
- [ ] URL结构清晰
- [ ] 内部链接合理
- [ ] 外部链接有rel="nofollow"
```

### 任务6: 编写测试报告 (Day 5-6)

**文件**: `frontend-unified/docs/TEST_REPORT.md`

```markdown
# 测试报告

**测试日期**: YYYY-MM-DD
**测试工程师**: 04-集成测试工程师
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

### 任务7: 修复问题 (Day 6-7)

根据测试结果，修复发现的问题：

1. **功能Bug**: 与对应角色协作修复
2. **性能问题**: 优化代码和资源
3. **SEO问题**: 添加缺失的元数据

---

## ✅ 完成标准

- [ ] 所有测试用例执行完成
- [ ] 测试报告编写完成
- [ ] 部署配置完成
- [ ] SEO验证通过
- [ ] 性能测试达标
- [ ] 关键问题修复完成
- [ ] 项目可以部署到生产环境

---

## 📤 交付物

完成后，请更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 04-集成测试工程师 - 集成测试与部署
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- frontend-unified/tests/: 测试用例
- frontend-unified/deployment/: 部署配置
- frontend-unified/docs/TEST_REPORT.md: 测试报告
- frontend-unified/vercel.json: Vercel配置

**测试结果**:
- [ ] 功能测试通过率 > 90%
- [ ] 性能测试LCP < 2.5s
- [ ] SEO分数 > 90
- [ ] 可以部署到生产环境

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [04-集成测试工程师] [问题简述]
**提出时间**: YYYY-MM-DD
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要02-React前端工程师修复: (具体问题)
- [ ] 需要03-Vue迁移工程师修复: (具体问题)

**状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD
**解决方案**: ...
```

---

## 📞 协作提示

1. 你需要 **02-React前端工程师** 和 **03-Vue迁移工程师** 的代码完成才能开始测试
2. 发现问题时，详细记录并通知对应角色
3. 阻塞性问题立即写入问题文件，并通知项目经理
4. 部署配置需要与DevOps角色协调

---

**任务卡版本**: v1.0
**创建时间**: 2026-03-05
