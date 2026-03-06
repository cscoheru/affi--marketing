# Affi-Marketing 前端统一项目 - 新人入职指南

> 最后更新：2026年3月6日
> 项目状态：开发中（核心功能已完成）

---

## 📋 目录

1. [项目概况](#项目概况)
2. [技术架构](#技术架构)
3. [核心模块](#核心模块)
4. [当前进度](#当前进度)
5. [未完成任务](#未完成任务)
6. [已知问题](#已知问题)
7. [过去解决的工作](#过去解决的工作)
8. [快速开始](#快速开始)
9. [开发指南](#开发指南)
10. [常见问题](#常见问题)

---

## 项目概况

### 🎯 项目定位

Affi-Marketing 是一个联盟营销管理平台，整合了以下核心功能：

- **联盟营销控制台**：管理实验、插件、数据分析、佣金结算
- **内容自动化系统**：产品管理、素材库、AI内容生成、多平台发布
- **博客系统**：完整的内容发布平台，支持文章管理、分类、评论、SEO

### 🏗️ 架构特点

本项目采用**微前端 + 模块化**架构：

```
统一仪表板 (Next.js 16 + React 19)
├── Vue微应用 (联盟营销控制台)
├── React原生模块 (内容自动化)
└── React原生模块 (博客系统)
```

**核心设计理念**：
- 统一的Dashboard布局和导航
- 模块间独立开发，统一部署
- 共享UI组件库（shadcn/ui）
- 统一的状态管理和API层

---

## 技术架构

### 🛠️ 技术栈

| 层级 | 技术选型 | 版本 | 说明 |
|------|---------|------|------|
| **前端框架** | Next.js | 16.1.6 | App Router + Route Groups |
| **UI框架** | React | 19.2.3 | 最新版本 |
| **状态管理** | Zustand | 5.0.11 | 轻量级状态管理 |
| **微前端** | Module Federation | - | 集成Vue控制台 |
| **UI组件** | shadcn/ui | - | 基于Radix UI |
| **样式** | Tailwind CSS | 4.x | 新版 @import 语法 |
| **表单** | React Hook Form | 7.71.2 | 表单管理 |
| **日期处理** | date-fns | 4.1.0 | 日期格式化 |
| **图标** | Lucide React | 0.577.0 | 图标库 |

### 📁 项目结构

```
frontend-unified/
├── app/                        # Next.js App Router
│   ├── (dashboard)/           # Dashboard路由组（不显示在URL中）
│   │   ├── layout.tsx         # 统一Dashboard布局
│   │   ├── page.tsx           # Dashboard首页
│   │   ├── blog/              # 📝 博客系统模块
│   │   │   ├── page.tsx       # 博客首页
│   │   │   ├── [slug]/        # 文章详情页
│   │   │   │   └── page.tsx
│   │   │   ├── category/      # 分类页面
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   └── admin/         # 博客后台管理
│   │   │       ├── page.tsx   # 文章管理（Tab页）
│   │   │       ├── new/       # 新建文章
│   │   │       │   └── page.tsx
│   │   │       ├── edit/      # 编辑文章
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx
│   │   │       ├── categories/ # 分类管理
│   │   │       │   └── page.tsx
│   │   │       └── settings/  # 博客设置
│   │   │           └── page.tsx
│   │   ├── products/          # 📦 产品管理
│   │   ├── materials/         # 📄 素材库
│   │   ├── publish/           # 📤 发布中心
│   │   └── content/           # ✍️ 内容自动化
│   │       └── page.tsx       # 内容管理（含同步功能）
│   ├── (content)/             # 独立Content路由组
│   │   └── content/           # 内容自动化备用路由
│   ├── login/                 # 登录页
│   ├── layout.tsx             # 根布局
│   ├── page.tsx               # 首页重定向
│   └── globals.css            # 全局样式
│
├── components/                # React组件
│   ├── blog/                  # 博客组件
│   │   ├── admin-article-card.tsx    # 管理文章卡片
│   │   ├── article-card.tsx          # 前台文章卡片
│   │   ├── ai-content-dialog.tsx     # AI生成对话框
│   │   ├── category-filter.tsx       # 分类筛选
│   │   ├── search-sort.tsx           # 搜索排序
│   │   ├── comment-section.tsx       # 评论区域
│   │   └── comment-item.tsx          # 单条评论
│   ├── ui/                    # shadcn/ui组件
│   └── unified-sidebar.tsx    # 统一侧边栏
│
├── lib/                       # 核心库
│   ├── blog/                  # 博客核心
│   │   ├── store.ts          # Zustand状态管理
│   │   ├── types.ts          # TypeScript类型定义
│   │   └── sample-articles.ts # Mock数据
│   ├── api.ts                 # 统一API客户端
│   ├── store.ts               # 全局状态（UI、Auth）
│   └── utils.ts               # 工具函数
│
├── hooks/                     # React Hooks
│   └── use-toast.ts           # Toast通知
│
├── docs/                      # 文档
│   ├── PROJECT_ONBOARDING.md  # 本文档
│   └── BLOG_INTEGRATION_PLAN.md # 博客集成方案
│
└── public/                    # 静态资源
```

---

## 核心模块

### 1️⃣ 联盟营销控制台 (Vue微应用)

**路由**: `/dashboard`, `/experiments`, `/plugins`, `/analytics`, `/settlements`

**功能**:
- 📊 仪表板：数据概览
- 🔬 实验管理：A/B测试
- 🔌 插件市场：扩展功能
- 📈 数据分析：业绩报表
- 💰 佣金结算：收入管理

**技术**: Vue 3 微应用，通过Module Federation集成

---

### 2️⃣ 内容自动化系统

**路由**: `/products`, `/materials`, `/content`, `/publish`

**核心工作流**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  产品管理     │────▶│  内容创建     │────▶│  多平台发布   │
│  (ASIN/价格)  │     │  (AI生成)     │     │  (Blogger等) │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  博客同步     │
                    │  (自动/手动)  │
                    └──────────────┘
```

**数据模型**:

```typescript
// 内容类型
type ContentType = 'review' | 'science' | 'guide' | 'blog' | 'social' | 'video' | 'email'

// 内容状态
type ContentStatus = 'draft' | 'review' | 'published' | 'rejected'

interface ContentItem {
  id: number
  slug: string
  asin: string          // 关联产品ASIN
  title: string
  type: ContentType
  content: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  status: ContentStatus
  aiGenerated: boolean
  wordCount: number
}
```

**关键功能**:
- **内容同步**: 审核通过的内容可同步到博客草稿
- **批量操作**: 一键同步多篇待发布内容
- **状态追踪**: 实时显示同步状态

---

### 3️⃣ 博客系统

**路由**: `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/admin/*`

#### 3.1 前台展示

**博客首页** (`/blog`)
- Hero区域展示
- 精选文章大卡片
- 分类筛选（水平滚动）
- 搜索和排序功能
- 加载更多按钮

**文章详情** (`/blog/[slug]`)
- 面包屑导航
- 封面图展示
- 作者信息和日期
- 文章正文（支持Markdown）
- 标签显示
- 点赞和分享功能
- 评论系统（支持嵌套回复）
- 相关文章推荐

**分类页面** (`/blog/category/[slug]`)
- 分类信息展示
- 该分类下的文章列表
- 分页加载更多

#### 3.2 后台管理

**文章管理** (`/blog/admin`)
- Tab切换：全部/草稿/审核中/已发布
- 统计卡片显示各状态数量
- 文章操作：编辑/发布/删除
- AI同步文章显示"AI同步"徽章

**文章编辑器** (`/blog/admin/new`, `/blog/admin/edit/[id]`)
- **基础信息**: 标题、URL别名、摘要、正文
- **发布设置**: 分类选择、封面图、标签管理
- **SEO设置**: Meta描述（160字符限制）
- **AI生成**:
  - 主题输入
  - 语调选择（专业严谨/轻松随意/友好热情）
  - 内容长度（简短/中等/详细）
  - 分类选择
  - 生成预览确认

**分类管理** (`/blog/admin/categories`)
- 分类列表（名称、描述、颜色、文章数）
- 颜色选择器（18种预设颜色）
- 新建/编辑/删除分类
- 删除保护（有文章的分类不能删除）

**博客设置** (`/blog/admin/settings`)
- **基本设置**: 站点名称、描述、URL
- **评论设置**:
  - 启用/禁用评论
  - 评论需要审核
  - 登录才能评论
- **SEO设置**: 默认Meta描述、每页文章数
- **功能开关**:
  - 阅读进度条
  - 分享按钮
  - 相关文章推荐
  - 目录索引
- **内容同步**:
  - 待同步内容数量
  - 自动同步开关
  - 上次同步时间

#### 3.3 数据模型

```typescript
// 文章状态
type ArticleStatus = 'draft' | 'review' | 'published'

// 文章接口
interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  category: Category
  author: Author
  status: ArticleStatus
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  tags: string[]
  likes: number
  comments: Comment[]
  metaDescription?: string
  contentItemId?: number  // 关联内容自动化ID
}

// 分类接口
interface Category {
  id: string
  slug: string              // URL友好的标识
  name: string              // 显示名称
  description?: string
  color: string             // Tailwind颜色类
  icon?: string
  order: number
  articleCount?: number
  createdAt: Date
  updatedAt: Date
}

// 评论接口
interface Comment {
  id: string
  articleId: string
  author: Author
  content: string
  createdAt: Date
  updatedAt: Date
  likes: number
  status: 'pending' | 'approved' | 'rejected'
  parentId?: string         // 父评论ID（用于嵌套）
  replies?: Comment[]       // 子评论
}

// 作者接口
interface Author {
  id: string
  name: string
  avatar: string
  userId: string
  role: 'admin' | 'editor' | 'author' | 'viewer'
}
```

#### 3.4 AI内容生成

```typescript
// AI生成选项
interface AIGenerationOptions {
  topic: string              // 主题
  tone: 'professional' | 'casual' | 'friendly'
  length: 'short' | 'medium' | 'long'
  category?: string
}

// AI生成结果
interface AIGenerationResult {
  title: string
  content: string
  excerpt: string
  tags: string[]
  metaDescription: string
  suggestedSlug?: string
}
```

---

### 4️⃣ 内容自动化 ↔ 博客集成

**核心工作流**:

```
内容自动化 (Content Automation)
│
├─ 1. 创建内容（AI生成或手动）
├─ 2. 内容审核（review → approve）
│
├─ 3. 同步到博客 ← 可手动或自动
│   └─ 创建博客草稿（status=draft）
│
├─ 4. 博客编辑
│   └─ 编辑内容、设置分类、添加标签
│
└─ 5. 发布文章
    └─ status → published
```

**类型映射**:

| 内容自动化类型 | 博客分类 |
|---------------|----------|
| review | 评测 |
| blog | 文章 |
| guide | 指南 |
| science | 科普 |
| social | 社媒 |

**同步状态追踪**:

```typescript
interface ContentSyncStatus {
  pendingCount: number       // 待同步内容数量
  autoSyncEnabled: boolean   // 是否启用自动同步
  lastSyncAt?: string        // 上次同步时间
}
```

**关键API**:

```typescript
// 博客Store中的同步方法
interface BlogStore {
  // 单个同步
  syncFromContent: (contentItemId: number) => Promise<Article>

  // 批量同步
  syncAllPendingContent: () => Promise<{ synced: number; failed: number }>

  // 获取同步状态
  fetchSyncStatus: () => Promise<void>

  // 切换自动同步
  toggleAutoSync: (enabled: boolean) => void
}
```

---

## 当前进度

### ✅ 已完成功能

#### 联盟营销控制台
- ✅ Vue微应用集成
- ✅ 统一Dashboard布局
- ✅ 侧边栏导航
- ✅ 路由守卫

#### 内容自动化系统
- ✅ 产品管理页面
- ✅ 素材库管理
- ✅ 内容创建和编辑
- ✅ 内容审核流程
- ✅ **内容同步到博客功能**
- ✅ 同步状态显示

#### 博客系统 - 前台展示
- ✅ 博客首页（Hero + 精选文章）
- ✅ 文章详情页（完整设计）
- ✅ 分类页面
- ✅ 文章卡片组件
- ✅ 评论系统（UI完成）
- ✅ 分类筛选组件
- ✅ 搜索排序组件
- ✅ 自定义Prose样式

#### 博客系统 - 后台管理
- ✅ 文章管理（Tab页 + 统计）
- ✅ 文章编辑器（新建/编辑）
- ✅ **AI内容生成集成**
- ✅ 分类管理（CRUD + 颜色选择）
- ✅ 博客设置（完整功能）
- ✅ **内容同步状态显示**

#### 核心架构
- ✅ Zustand状态管理（BlogStore）
- ✅ TypeScript类型定义
- ✅ Mock数据（用于开发）
- ✅ API客户端封装
- ✅ shadcn/ui组件库集成

---

## 未完成任务

### 📋 高优先级

#### 1. 会员系统统一
**状态**: 待实现
**描述**: 博客作者与系统用户的关联

**需要实现**:
```typescript
// 从Auth Store获取当前用户
const getCurrentUser = (): User => {
  return useAuthStore.getState().user
}

// 用户角色映射到博客权限
const roleToPermissions: Record<UserRole, BlogPermission[]> = {
  admin: ['view_articles', 'create_articles', 'edit_all_articles', 'publish_articles', 'delete_articles', 'manage_settings'],
  editor: ['view_articles', 'create_articles', 'edit_all_articles', 'publish_articles'],
  author: ['view_articles', 'create_articles', 'edit_own_articles'],
  viewer: ['view_articles'],
}
```

#### 2. 图片上传功能
**状态**: 待实现
**描述**: 封面图和内容图片的上传/管理

**技术方案**:
- 使用 `/api/v1/materials/upload` API
- 集成文件上传组件
- 图片预览和裁剪

#### 3. 富文本编辑器升级
**状态**: 待实现
**描述**: 当前使用Textarea，需要升级

**推荐方案**:
- [MDX Editor](https://mdx-editor.com/) - Markdown编辑
- [Tiptap](https://tiptap.dev/) - 所见即所得
- [Novel](https://novel.sh/) - Notion风格编辑器

### 📋 中优先级

#### 4. 评论系统后端集成
**状态**: UI完成，后端待对接
**描述**: 评论数据的持久化

#### 5. AI内容生成真实集成 ✅
**状态**: 已完成 (2026-03-06)
**描述**: 连接真实AI服务，支持多模型选择
**详情**: 见 `docs/FIXES_2026-03-06.md`

**需要实现**:
- 评论API接口
- 评论审核功能
- 评论通知

#### 5. SEO优化
**状态**: 基础完成，高级功能待实现
**需要实现**:
- 动态Meta标签
- 结构化数据（JSON-LD）
- Sitemap生成
- Robots.txt

#### 6. 社交分享功能
**状态**: 基础完成，需要优化
**需要实现**:
- 分享卡片预览
- 社交媒体Meta标签
- 分享统计

### 📋 低优先级

#### 7. 文章版本历史
**状态**: 待规划
**描述**: 保存文章编辑历史

#### 8. 文章定时发布
**状态**: 待规划
**描述**: 设置文章发布时间

#### 9. 多语言支持
**状态**: 待规划
**描述**: 中英文内容切换

---

## 已知问题

### ✅ 已修复 (2026-03-06)

#### 1. 素材上传错误处理 ✅
**问题**: 上传文件时报错"请求失败"，错误信息不详细
**修复**: 改进错误处理逻辑，提供更详细的错误信息
**详情**: 见 `docs/FIXES_2026-03-06.md`

#### 2. AI内容生成真实集成 ✅
**问题**: AI生成使用mock数据，没有连接真实大模型
**修复**:
- 创建AI服务API客户端 (`lib/ai-service.ts`)
- 连接真实AI服务: `https://ai-api.zenconsult.top`
- 支持多模型选择: 通义千问/OpenAI/智谱GLM
- 添加AI服务健康状态显示
- 实现Fallback机制
**详情**: 见 `docs/FIXES_2026-03-06.md`

### 🐛 待解决问题

#### 1. 数据持久化
**问题描述**: 当前使用Mock数据，数据在刷新后会丢失

**临时方案**: Zustand persist中间件（仅本地存储）

**解决方案**:
- 后端API完成数据持久化
- 或集成Supabase/PostgreSQL

#### 2. 图片CDN配置
**问题描述**: Unsplash图片需要在next.config.ts中配置

**已解决**: 已添加到remotePatterns

```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**',
    },
  ],
}
```

#### 3. API认证
**问题描述**: API请求可能需要token认证

**解决方案**:
```typescript
// lib/api.ts
api.setToken(token) // 登录后设置
api.clearToken() // 登出时清除
```

### ⚠️ 注意事项

1. **Tailwind CSS v4语法变更**
   - 使用 `@import "tailwindcss"` 而非 `@tailwind`
   - 主题定义使用 `@theme inline`

2. **Next.js Route Groups**
   - `(dashboard)` 不会显示在URL中
   - 路由为 `/blog` 而非 `/dashboard/blog`

3. **Zustand Persist**
   - 状态保存在localStorage
   - 敏感数据不应持久化

---

## 过去解决的工作

### 🎯 博客系统集成

**问题**: 原有博客功能简陋，用户体验差

**解决方案**:
1. 深度分析v0博客架构
2. 完整集成v0的UI组件
3. 添加内容自动化同步功能
4. 创建统一的数据层

**成果**:
- 完整的博客前台展示
- 强大的后台管理功能
- AI内容生成集成
- 内容自动化工作流集成

### 🎯 路由架构优化

**问题**: 路由混乱，`/dashboard/blog` 和 `/blog` 不一致

**解决方案**:
- 理解Next.js Route Groups机制
- 统一所有博客路由为 `/blog/*`
- 更新侧边栏和内部链接

**代码对比**:
```typescript
// 错误 ❌
{ path: '/dashboard/blog', label: '博客首页' }

// 正确 ✅
{ path: '/blog', label: '博客首页' }
```

### 🎯 UI组件缺失问题

**问题**: 缺少shadcn/ui组件

**解决方案**:
```bash
npm install @radix-ui/react-alert-dialog
npm install @radix-ui/react-tabs
npm install @radix-ui/react-switch
```

### 🎯 Prose样式问题

**问题**: Tailwind CSS v4不支持 `@tailwindcss/typography`

**解决方案**: 自定义prose样式在globals.css中

```css
/* 自定义prose样式 */
.prose {
  color: var(--color-foreground);
  max-width: 65ch;
  line-height: 1.75;
}
.prose h1 { font-size: 2.25em; }
/* ...更多样式 */
```

### 🎯 内容同步功能实现

**问题**: 内容自动化与博客需要数据同步

**解决方案**:
1. 在Article类型添加 `contentItemId` 字段
2. 实现同步方法：`syncFromContent`, `syncAllPendingContent`
3. 内容页面添加同步按钮
4. 博客设置显示同步状态

---

## 快速开始

### 🚀 环境准备

**系统要求**:
- Node.js 20+
- npm 或 bun

**克隆项目**:
```bash
git clone <repository-url>
cd frontend-unified
```

**安装依赖**:
```bash
npm install
# 或
bun install
```

### 🔧 配置

**环境变量** (`.env.local`):
```bash
# API地址
NEXT_PUBLIC_API_URL=http://localhost:8080

# 可选：认证token（开发测试）
AUTH_TOKEN=your-dev-token
```

### ▶️ 启动开发服务器

```bash
npm run dev
# 或
bun dev
```

访问：http://localhost:3000

### 📦 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Webpack） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 代码检查 |
| `npm test` | Playwright测试 |

---

## 开发指南

### 📝 代码规范

#### TypeScript类型
```typescript
// ✅ 正确 - 明确类型
const article: Article = { ... }

// ❌ 错误 - 使用any
const article: any = { ... }
```

#### 组件定义
```typescript
// ✅ 正确 - 使用函数声明
export function ArticleCard({ article }: Props) { ... }

// ❌ 错误 - 使用箭头函数（除非必要）
export const ArticleCard = ({ article }: Props) => { ... }
```

#### 状态管理
```typescript
// ✅ 使用Zustand
const { articles, fetchArticles } = useBlogStore()

// ❌ 避免过度使用useState
const [articles, setArticles] = useState([])
```

### 🎨 UI开发

#### 使用shadcn/ui组件
```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

#### Tailwind样式
```typescript
// ✅ 使用语义化颜色类
className="bg-primary text-primary-foreground"

// ✅ 使用响应式前缀
className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"

// ✅ 使用条件类名
className={cn(
  "base-class",
  condition && "conditional-class",
  variant === "primary" && "variant-class"
)}
```

### 🔌 API调用

#### 使用统一的API客户端
```typescript
import { contentApi, productsApi } from '@/lib/api'

// ✅ 正确
const content = await contentApi.get(id)

// ❌ 错误 - 不要直接使用fetch
const content = await fetch(`/api/contents/${id}`)
```

#### 错误处理
```typescript
// ✅ 正确
try {
  const result = await apiCall()
} catch (error) {
  toast({
    title: '操作失败',
    description: error instanceof Error ? error.message : '未知错误',
    variant: 'destructive',
  })
}
```

### 📂 添加新功能

#### 1. 添加新页面
```bash
# 在 (dashboard) 组下添加页面
app/(dashboard)/new-feature/page.tsx
```

#### 2. 更新侧边栏
```typescript
// components/unified-sidebar.tsx
const navItems: NavItem[] = [
  // ...
  { id: 'new-feature', label: '新功能', icon: '🆕', path: '/new-feature', type: 'react', category: '新分类' },
]
```

#### 3. 添加状态管理
```typescript
// lib/new-feature/store.ts
import { create } from 'zustand'

export const useNewFeatureStore = create<FeatureState>((set, get) => ({
  // 状态和方法
}))
```

### 🧪 测试

```bash
# 运行测试
npm test

# UI模式
npm run test:ui

# 调试模式
npm run test:debug

# 查看报告
npm run test:report
```

---

## 常见问题

### Q1: 如何添加新的博客分类？

**A**:
1. 访问 `/blog/admin/categories`
2. 点击"新建分类"
3. 填写名称、描述、选择颜色
4. 保存

### Q2: AI生成的内容可以再次编辑吗？

**A**: 可以。AI生成的内容会填充到编辑器中，您可以自由修改后再保存/发布。

### Q3: 内容自动化的文章如何同步到博客？

**A**:
1. 在内容自动化页面，审核通过内容（状态变为"已审核"）
2. 点击"同步"按钮或顶部的"同步X篇到博客"
3. 文章会作为草稿出现在博客管理中
4. 在博客管理中编辑并发布

### Q4: 如何修改博客的SEO设置？

**A**:
1. 访问 `/blog/admin/settings`
2. 在"SEO设置"部分修改默认Meta描述
3. 在文章编辑器中可以为每篇文章单独设置Meta描述

### Q5: 评论功能如何配置？

**A**:
1. 访问 `/blog/admin/settings`
2. 在"评论设置"中：
   - 启用/禁用评论
   - 设置评论需要审核
   - 设置登录才能评论

### Q6: 如何部署项目？

**A**:
```bash
# 构建
npm run build

# 部署到Vercel
vercel deploy

# 或部署到其他平台
# 上传 .next/ 和 public/ 目录
# 运行 npm start
```

### Q7: 开发时遇到端口冲突怎么办？

**A**:
```bash
# 方法1: 修改端口
npm run dev -- -p 3001

# 方法2: 关闭占用3000端口的进程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 联系方式

### 项目负责人
- **技术问题**: 提交GitHub Issue
- **功能建议**: 项目看板

### 相关文档
- [Next.js文档](https://nextjs.org/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
- [shadcn/ui文档](https://ui.shadcn.com)
- [Zustand文档](https://zustand-demo.pmnd.rs)

### 版本历史
- **v0.1.0** (2025-03-05): 项目初始化
- **v0.2.0** (2025-03-06): 博客系统集成完成
- **v0.3.0** (2026-03-06): 内容自动化集成完成

---

**祝您开发愉快！🎉**
