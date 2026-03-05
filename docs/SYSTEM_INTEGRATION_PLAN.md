# Affi-Marketing 系统整合方案

> **创建日期**: 2026-03-05
> **目的**: 从商业逻辑角度整合三个割裂的前端系统

---

## 📊 现状分析

### 三个独立的系统

| 系统 | 技术栈 | 域名 | 核心功能 |
|------|--------|------|----------|
| **联盟营销控制台** | Vue 3 + Element Plus | hub.zenconsult.top | 实验、插件、分析、结算 |
| **博客系统** | Vue 3 (内嵌) | hub.zenconsult.top/blog | 评测文章、购买指南 |
| **内容自动化系统** | Next.js 15 | (待部署) | 产品管理、AI生成、发布 |

### 当前问题

❌ **用户体验割裂**:
- 三个独立登录系统
- 不同的UI设计语言
- 数据无法打通

❌ **商业流程断裂**:
- 博客内容需要手动复制
- 转化数据无法关联内容
- 实验结果无法指导内容生成

---

## 🎯 商业逻辑整合

### 核心商业闭环

```
┌─────────────────────────────────────────────────────────┐
│                    用户旅程地图                          │
└─────────────────────────────────────────────────────────┘

1. 流量获取阶段
   用户搜索咖啡机评测 → 搜索引擎 → 博客文章
   │
   ▼
2. 内容消费阶段
   阅读评测文章 → 查看购买建议 → 点击联盟链接
   │
   ▼
3. 购买转化阶段
   跳转到Amazon → 购买产品 → 产生佣金
   │
   ▼
4. 数据分析阶段
   转化数据回传 → 控制台分析 → 优化实验
   │
   ▼
5. 内容优化阶段 (新增)
   分析热门产品 → AI生成新内容 → 自动发布到博客
   │
   └── 回到流量获取 (闭环)
```

### 三个系统的商业定位

```
┌────────────────────────────────────────────────────────────┐
│  博客系统               │  内容自动化系统        │  控制台     │
│  (流量入口)            │  (内容生产引擎)       │  (数据中心)  │
├────────────────────────┼───────────────────────┼─────────────┤
│  • 公开访问            │  • 需要登录           │  • 需要登录  │
│  • SEO优化             │  • 产品候选库         │  • 实验管理  │
│  • 联盟链接            │  • AI内容生成         │  • 转化分析  │
│  • 评测内容            │  • 内容审核           │  • 佣金结算  │
│  • 购买指南            │  • 多平台发布         │  • A/B测试   │
└────────────────────────┴───────────────────────┴─────────────┘
```

---

## 🔄 数据流转设计

### 数据流向图

```
                    ┌─────────────────┐
                    │   内容自动化系统  │
                    │  (生产者)        │
                    ├─────────────────┤
                    │ • 产品库 (4个)   │
                    │ • 素材库 (6条)   │
                    │ • 内容库 (22篇)  │
                    │ • 发布记录       │
                    └────────┬─────────┘
                             │
                             │ 发布内容
                             ▼
                    ┌─────────────────┐
                    │   博客系统       │
                    │  (消费者/展示)   │
                    ├─────────────────┤
                    │ • 公开文章 (10篇)│
                    │ • 联盟链接       │
                    │ • SEO元数据      │
                    └────────┬─────────┘
                             │
                             │ 产生流量
                             ▼
                    ┌─────────────────┐
                    │   Amazon        │
                    │  (转化平台)      │
                    └────────┬─────────┘
                             │
                             │ 佣金数据
                             ▼
                    ┌─────────────────┐
                    │   控制台         │
                    │  (数据中枢)      │
                    ├─────────────────┤
                    │ • 转化追踪       │
                    │ • 实验数据       │
                    │ • 佣金结算       │
                    │ • 热门产品分析   │
                    └────────┬─────────┘
                             │
                             │ 热门产品
                             ▼
                    回到内容自动化系统
                    (生成新内容)
```

### 关键数据关联

| 数据类型 | 来源系统 | 消费系统 | 关联方式 |
|---------|---------|---------|----------|
| 产品数据 | 控制台/手工导入 | 内容自动化 | ASIN作为唯一标识 |
| 发布内容 | 内容自动化 | 博客 | slug/content_id |
| 联盟链接 | 控制台 | 博客 | tracking_id |
| 转化数据 | Amazon | 控制台 | transaction_id |
| 热门产品 | 控制台分析 | 内容自动化 | 产品ASIN |

---

## 🏗️ 系统架构整合方案

### 方案A: 统一应用入口 (推荐)

```
hub.zenconsult.top
│
├── / (登录后重定向)
│   └── → /dashboard (统一控制台)
│
├── /blog (公开博客 - 无需登录)
│   ├── /blog/ (博客列表)
│   ├── /blog/:slug (文章详情)
│   └── /feed.xml (RSS)
│
└── /app (内容自动化 - 需要登录)
    ├── /app/products (产品候选库)
    ├── /app/materials (素材库)
    ├── /app/content (内容管理)
    ├── /app/publish (发布中心)
    └── /app/analytics (内容数据分析)
```

**优势**:
- ✅ 单一域名，统一品牌
- ✅ 博客公开访问利于SEO
- ✅ 内容后台受保护
- ✅ 用户旅程连贯

**技术实现**:
- Next.js作为主框架
- 博客路由公开 (`/blog/*`)
- 内容后台路由保护 (`/app/*`)
- Vue控制台作为子应用或迁移

### 方案B: 子域名分离

```
├── hub.zenconsult.top (控制台 - Vue)
│   ├── / (控制台Dashboard)
│   ├── /experiments (实验管理)
│   ├── /analytics (数据分析)
│   └── /settlements (佣金结算)
│
├── blog.zenconsult.top (博客 - Next.js)
│   ├── / (博客首页)
│   ├── /:slug (文章详情)
│   └── /feed.xml (RSS)
│
└── content.zenconsult.top (内容自动化 - Next.js)
    ├── / (产品候选库)
    ├── /materials (素材库)
    ├── /content (内容管理)
    └── /publish (发布中心)
```

**优势**:
- ✅ 系统解耦，独立部署
- ✅ 技术栈独立演进
- ✅ 故障隔离

**劣势**:
- ❌ 用户需要多次登录
- ❌ 跨域数据共享复杂

---

## 🎨 UI/UX 整合设计

### 统一导航结构

```typescript
// 统一导航菜单 (根据登录状态动态显示)
interface NavigationItem {
  label: string
  path: string
  public: boolean    // 是否公开访问
  icon: string
  section: 'blog' | 'content' | 'console'
}

const navigation: NavigationItem[] = [
  // 公开区域 - Blog
  {
    label: '博客首页',
    path: '/blog',
    public: true,
    icon: 'home',
    section: 'blog'
  },
  {
    label: '产品评测',
    path: '/blog?category=reviews',
    public: true,
    icon: 'star',
    section: 'blog'
  },
  {
    label: '购买指南',
    path: '/blog?category=guides',
    public: true,
    icon: 'book',
    section: 'blog'
  },

  // 需要登录 - 内容自动化
  {
    label: '产品候选库',
    path: '/app/products',
    public: false,
    icon: 'package',
    section: 'content'
  },
  {
    label: '内容管理',
    path: '/app/content',
    public: false,
    icon: 'file-text',
    section: 'content'
  },
  {
    label: '发布中心',
    path: '/app/publish',
    public: false,
    icon: 'send',
    section: 'content'
  },

  // 需要登录 - 控制台
  {
    label: '控制台',
    path: '/dashboard',
    public: false,
    icon: 'dashboard',
    section: 'console'
  },
  {
    label: '实验管理',
    path: '/dashboard/experiments',
    public: false,
    icon: 'flask',
    section: 'console'
  },
  {
    label: '数据分析',
    path: '/dashboard/analytics',
    public: false,
    icon: 'chart',
    section: 'console'
  }
]
```

### 统一布局设计

```tsx
// 主布局组件 (Next.js)
export default function RootLayout({ children }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const isBlogRoute = pathname.startsWith('/blog')
  const isAppRoute = pathname.startsWith('/app')
  const isConsoleRoute = pathname.startsWith('/dashboard')

  return (
    <html lang="zh-CN">
      <body>
        {/* 公开导航 - Blog */}
        {isBlogRoute && <PublicHeader />}

        {/* 需要登录的导航 */}
        {!isBlogRoute && (
          <ProtectedLayout>
            {/* 侧边栏导航 */}
            <Sidebar>
              <NavItem section="content" />
              <NavItem section="console" />
            </Sidebar>

            {/* 主内容区 */}
            <MainContent>
              {children}
            </MainContent>
          </ProtectedLayout>
        )}
      </body>
    </html>
  )
}
```

---

## 🔐 认证整合

### 统一认证系统

```typescript
// 认证状态共享
interface AuthState {
  token: string
  user: {
    id: string
    email: string
    role: 'admin' | 'editor' | 'viewer'
  }
  permissions: {
    canAccessConsole: boolean    // 控制台权限
    canAccessContent: boolean    // 内容系统权限
    canPublishBlog: boolean      // 发布博客权限
  }
}

// 路由权限控制
const routePermissions = {
  '/blog/*': { requireAuth: false },           // 公开博客
  '/app/products': { requireAuth: true, role: 'editor' },
  '/app/publish': { requireAuth: true, role: 'admin' },
  '/dashboard': { requireAuth: true, role: 'viewer' },
  '/dashboard/experiments': { requireAuth: true, role: 'admin' }
}
```

### SSO单点登录

```typescript
// JWT Token结构
interface JWTPayload {
  sub: string              // 用户ID
  email: string
  roles: string[]          // ['content_editor', 'console_admin']
  exp: number
  iat: number

  // 跨系统共享
  iss: 'hub.zenconsult.top'
  aud: ['blog', 'content', 'console']
}
```

---

## 📡 API整合策略

### 统一API网关

```
                    ┌──────────────────┐
                    │  API Gateway     │
                    │  (Go后端)        │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Blog API    │   │  Content API  │   │  Console API  │
│   (公开)      │   │  (需认证)     │   │  (需认证)     │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ GET /blog     │   │ GET /products │   │ GET /experiments│
│ GET /blog/:id │   │ POST /content │   │ GET /analytics  │
│               │   │ POST /publish │   │ GET /settlements│
└───────────────┘   └───────────────┘   └───────────────┘
```

### 数据库设计整合

```sql
-- 用户表 (统一认证)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  roles JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 产品表 (内容系统使用)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  asin VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(500),
  ...其他字段
);

-- 博客文章表 (博客系统使用)
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(500),
  content_id INTEGER REFERENCES contents(id),  -- 关联生成的内容
  published_at TIMESTAMP,
  ...其他字段
);

-- 转化记录表 (控制台使用)
CREATE TABLE conversions (
  id SERIAL PRIMARY KEY,
  blog_post_id INTEGER REFERENCES blog_posts(id),
  product_asin VARCHAR(20) REFERENCES products(asin),
  amount DECIMAL(10,2),
  ...其他字段
);
```

---

## 🚀 实施计划

### 阶段1: 基础整合 (1-2周)

**目标**: 统一域名和导航

- [ ] 将内容自动化系统部署到 `hub.zenconsult.top/app`
- [ ] 配置Next.js路由规则
- [ ] 实现统一导航组件
- [ ] 配置公开/受保护路由

**优先级**: 🔴 高

### 阶段2: 认证整合 (1周)

**目标**: 单点登录

- [ ] 实现JWT统一认证
- [ ] 配置跨系统token共享
- [ ] 迁移用户数据到统一表
- [ ] 实现权限控制

**优先级**: 🔴 高

### 阶段3: 数据打通 (2周)

**目标**: 内容关联转化数据

- [ ] 博客文章关联生成内容ID
- [ ] 转化数据关联博客文章
- [ ] 热门产品自动推荐到内容系统
- [ ] 实现数据看板

**优先级**: 🟡 中

### 阶段4: UI统一 (1周)

**目标**: 统一设计语言

- [ ] 将Vue控制台迁移到Next.js (或使用iframe)
- [ ] 统一组件库 (shadcn/ui)
- [ ] 统一主题色和样式
- [ ] 响应式设计优化

**优先级**: 🟢 低

### 阶段5: 功能增强 (按需)

- [ ] 博客文章编辑器集成
- [ ] 一键发布到博客
- [ ] 自动SEO优化
- [ ] A/B测试集成

**优先级**: 🟢 低

---

## 💡 技术决策

### 决策1: 使用Next.js作为主框架

**理由**:
1. 博客需要SEO (SSR/SSG)
2. 内容系统正在用Next.js开发
3. Vue控制台可以渐进式迁移或嵌入

### 决策2: 保持数据库统一

**理由**:
1. 数据关联更容易
2. 查询性能更好
3. 用户权限管理统一

### 决策3: API端点统一

**理由**:
1. CORS问题更少
2. 认证逻辑统一
3. 维护成本更低

---

## 📋 待确认事项

1. **域名策略**: 使用统一域名还是子域名分离？
2. **Vue控制台**: 是迁移到Next.js还是保留并嵌入？
3. **用户迁移**: 现有用户数据如何处理？
4. **部署环境**: Vercel、Railway还是自建服务器？
5. **优先级**: 哪些功能优先实现？

---

## 🎯 成功指标

### 用户体验指标
- ✅ 单次登录访问所有功能
- ✅ 统一的导航和视觉体验
- ✅ 流量到转化的完整追踪

### 商业指标
- ✅ 内容生产效率提升50%
- ✅ 转化率提升20%
- ✅ 用户停留时间增加30%

---

**文档版本**: v1.0
**创建日期**: 2026-03-05
**下次更新**: 根据确认事项决策后
