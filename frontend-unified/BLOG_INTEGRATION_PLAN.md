# 博客系统集成方案

## 一、架构设计

### 1.1 模块划分

```
┌─────────────────────────────────────────────────────────────┐
│                        统一Dashboard                         │
├─────────────────────────────────────────────────────────────┤
│  侧边栏导航                                                    │
│  ├─ 控制台 (Vue微应用)                                        │
│  ├─ 内容自动化 (React)                                        │
│  │   ├─ 产品管理                                              │
│  │   ├─ 素材库                                                │
│  │   ├─ 内容管理 ← 创建内容 → 博客草稿                         │
│  │   └─ 发布中心                                              │
│  └─ 博客系统 (React)                                          │
│      ├─ 博客首页 (前台展示)                                    │
│      ├─ 文章管理 (后台管理)                                    │
│      ├─ 分类管理                                              │
│      └─ 博客设置                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 会员统一

```typescript
// 统一的用户模型
interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'editor' | 'author' | 'viewer'
  permissions: Permission[]
}

// 博客作者与系统用户关联
interface BlogAuthor {
  userId: User['id']
  displayName: string
  bio?: string
}
```

### 1.3 内容工作流

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 内容自动化    │────▶│   博客草稿    │────▶│   内容审核    │
│  (创建内容)   │     │  (status=    │     │  (status=    │
│              │     │   'draft')   │     │  'review')   │
└──────────────┘     └──────────────┘     └──────────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │   已发布     │
                                      │ (status=     │
                                      │ 'published') │
                                      └──────────────┘
```

---

## 二、功能模块详细设计

### 2.1 博客文章管理 (BlogAdmin)

**路由**: `/blog/admin`

**功能**:
- 文章列表 (Tab: 全部/草稿/待审核/已发布)
- 统计卡片 (草稿数/待审核数/已发布数)
- 文章操作: 编辑/发布/删除
- 与内容自动化的集成显示

**与内容自动化联动**:
- 内容自动化创建的内容 → 自动进入博客草稿
- 可以从博客管理界面编辑草稿后发布

### 2.2 文章编辑器 (ArticleEditor)

**路由**: `/blog/admin/new`, `/blog/admin/edit/[id]`

**功能**:
- 基础信息: 标题/Slug/摘要/内容
- 发布设置: 分类/封面图/标签
- SEO设置: Meta描述
- **AI生成集成**: 主题/语调/长度选择 + 生成预览

**AI生成流程**:
```
用户输入主题 → AI生成内容 → 预览确认 → 填充到编辑器 → 可手动调整
```

### 2.3 分类管理 (CategoryManager)

**路由**: `/blog/admin/categories`

**功能**:
- 分类列表 (名称/描述/颜色/文章数)
- 新建/编辑/删除分类
- 拖拽排序
- 批量操作

**数据模型**:
```typescript
interface Category {
  id: string
  slug: string
  name: string
  description?: string
  color: string // Tailwind color class
  icon?: string
  order: number
  articleCount: number
}
```

### 2.4 博客设置 (BlogSettings)

**路由**: `/blog/admin/settings`

**功能**:
- 基本设置: 站点标题/描述/Logo
- 评论设置: 开关/审核/登录才能评论
- SEO设置: 默认Meta描述/关键词
- 社交分享: 默认分享图片/文本

### 2.5 前台展示 (BlogFront)

**路由**: `/blog` (集成到Dashboard layout)

**页面**:
- 博客首页: Hero + 精选文章 + 分类筛选 + 搜索排序
- 文章详情: 面包屑 + 内容 + 评论
- 分类页面: 分类文章列表

---

## 三、技术实现方案

### 3.1 状态管理 (Zustand)

```typescript
// lib/blog/store.ts
interface BlogState {
  // 数据
  articles: Article[]
  categories: Category[]
  currentArticle: Article | null
  settings: BlogSettings

  // 文章操作
  fetchArticles: () => Promise<void>
  createArticle: (data: Partial<Article>) => Promise<Article>
  updateArticle: (id: string, data: Partial<Article>) => Promise<void>
  publishArticle: (id: string) => Promise<void>
  deleteArticle: (id: string) => Promise<void>

  // 分类操作
  fetchCategories: () => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<Category>
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  reorderCategories: (ids: string[]) => Promise<void>

  // AI生成
  generateWithAI: (options: AIGenerationOptions) => Promise<AIGenerationResult>

  // 评论操作
  addComment: (articleId: string, content: string, parentId?: string) => Promise<void>
  likeArticle: (id: string) => Promise<void>
}
```

### 3.2 API集成

```typescript
// 与后端Content API的映射
const contentToBlogArticle = (item: ContentItem): Article => ({
  id: String(item.id),
  slug: item.slug,
  title: item.title,
  excerpt: item.excerpt,
  content: item.content,
  status: item.status, // draft/review/published
  category: categories.find(c => c.slug === item.type),
  author: getAuthorFromUserId(item.createdBy),
  tags: item.seoKeywords?.split(',') || [],
  metaDescription: item.seoDescription,
  // ...
})

// 反向映射：博客文章 → Content API
const blogArticleToContent = (article: Article): CreateContentDTO => ({
  slug: article.slug,
  asin: '', // 博客文章不需要ASIN
  title: article.title,
  type: article.category.slug as ContentItemType,
  content: article.content,
  seoDescription: article.metaDescription,
  seoKeywords: article.tags.join(','),
})
```

### 3.3 路由结构

```
app/
├── (dashboard)/
│   ├── layout.tsx           # 统一Dashboard布局
│   │   ├── UnifiedSidebar   # 侧边栏导航
│   │   └── 内容区域
│   │
│   ├── blog/               # 博客模块
│   │   ├── page.tsx        # 博客首页 (前台)
│   │   ├── [slug]/
│   │   │   └── page.tsx    # 文章详情
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx # 分类页面
│   │   │
│   │   └── admin/          # 博客后台管理
│   │       ├── page.tsx    # 文章管理列表
│   │       ├── new/
│   │       │   └── page.tsx # 新建文章
│   │       ├── edit/
│   │       │   └── [id]/
│   │       │       └── page.tsx # 编辑文章
│   │       ├── categories/
│   │       │   └── page.tsx # 分类管理
│   │       └── settings/
│   │           └── page.tsx # 博客设置
│   │
│   └── content/            # 内容自动化模块
│       └── page.tsx        # 内容创建 → 自动同步到博客草稿
│
└── login/
    └── page.tsx
```

---

## 四、实施步骤

### Phase 1: 核心数据层 (优先级: P0)
1. ✅ 统一类型定义 (基于v0的types.ts)
2. ✅ Zustand store (整合Content API)
3. ⬜ 会员系统集成 (作者映射)

### Phase 2: 后台管理 (优先级: P0)
4. ⬜ 文章管理页面 (Tab + 统计)
5. ⬜ 文章编辑器 (含AI生成)
6. ⬜ 分类管理 (CRUD)
7. ⬜ 与内容自动化的集成 (草稿同步)

### Phase 3: 前台展示 (优先级: P1)
8. ⬜ 博客首页 (v0的Hero + 精选文章)
9. ⬜ 文章详情页 (v0的完整设计)
10. ⬜ 分类页面
11. ⬜ 评论系统

### Phase 4: 增强功能 (优先级: P2)
12. ⬜ 博客设置
13. ⬜ SEO优化
14. ⬜ 社交分享
15. ⬜ 富文本编辑器升级

---

## 五、UI/UX改进点 (v0的优点)

1. **更好的视觉设计**
   - Hero区域展示
   - 精选文章大卡片
   - 统一的配色方案

2. **更流畅的交互**
   - Tab切换不同状态的文章
   - AI生成预览再确认
   - 标签输入体验

3. **更完整的功能**
   - 评论嵌套回复
   - 文章点赞/分享
   - SEO元数据管理

---

## 六、待解决问题

1. **会员统一**: 博客作者与系统用户的关联
2. **权限控制**: 谁可以发布/审核文章
3. **内容同步**: 内容自动化 → 博客草稿的自动同步机制
4. **富文本编辑**: 当前是Textarea，需要升级为Markdown编辑器或WYSIWYG
5. **图片上传**: 封面图和内容图片的上传/管理

---

## 七、技术债务清理

1. 移除当前简陋的博客实现
2. 统一使用v0的UI组件
3. 建立清晰的模块边界
4. 完善错误处理和加载状态
