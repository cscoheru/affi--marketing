// ==================== 核心实体 ====================

export interface Author {
  id: string
  name: string
  avatar: string
  // 与系统用户关联
  userId?: string
  // 博客角色
  role?: 'admin' | 'editor' | 'author' | 'viewer'
}

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  color: string // Tailwind color class
  icon?: string
  order: number
  articleCount?: number
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  articleId: string
  author: Author
  content: string
  createdAt: Date
  updatedAt: Date
  likes: number
  parentId?: string
  replies?: Comment[]
  // 审核状态
  status: 'pending' | 'approved' | 'rejected'
}

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage?: string
  category: Category
  author: Author
  status: 'draft' | 'review' | 'published'
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
  tags: string[]
  likes: number
  comments: Comment[]
  metaDescription?: string
  // SEO 相关
  canonicalUrl?: string
  ogImage?: string
  // 阅读统计
  views?: number
  readTime?: number
  // 与内容自动化的关联
  contentItemId?: number
}

// ==================== AI 生成 ====================

export type AITone = 'professional' | 'casual' | 'friendly'
export type AILength = 'short' | 'medium' | 'long'
export type AIModel = 'qwen' | 'openai' | 'chatglm'

export interface AIGenerationOptions {
  topic: string
  tone: AITone
  length: AILength
  category?: string
  model?: AIModel
  // 自定义指令
  customInstructions?: string
}

export interface AIGenerationResult {
  title: string
  content: string
  excerpt: string
  tags: string[]
  metaDescription: string
  suggestedSlug?: string
}

// ==================== 筛选和分页 ====================

export interface BlogFilters {
  category: string
  search: string
  sort: 'latest' | 'most-liked' | 'most-commented' | 'most-viewed'
  tags?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
}

export interface PaginationOptions {
  page: number
  size: number
  total?: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  size: number
  totalPages: number
}

// ==================== 博客设置 ====================

export interface BlogSettings {
  // 基本设置
  siteName: string
  siteDescription: string
  siteUrl: string
  logo?: string
  favicon?: string

  // 评论设置
  commentsEnabled: boolean
  commentsRequireApproval: boolean
  commentsRequireLogin: boolean

  // SEO 设置
  defaultMetaDescription: string
  defaultKeywords: string[]
  ogImage?: string

  // 社交分享
  defaultShareTitle: string
  defaultShareDescription: string
  defaultShareImage?: string

  // 文章设置
  articlesPerPage: number
  autoPublishFromContent: boolean // 是否自动发布内容自动化创建的文章

  // 功能开关
  features: {
    readingProgress: boolean
    shareButtons: boolean
    relatedArticles: boolean
    tableOfContents: boolean
  }
}

// ==================== 会员权限 ====================

export type BlogPermission =
  | 'view_articles'
  | 'create_articles'
  | 'edit_own_articles'
  | 'edit_all_articles'
  | 'publish_articles'
  | 'review_articles'
  | 'delete_articles'
  | 'manage_categories'
  | 'manage_settings'
  | 'moderate_comments'

export interface BlogRole {
  id: string
  name: string
  permissions: BlogPermission[]
  description?: string
}

// ==================== 内容自动化集成 ====================

export interface ContentSyncStatus {
  lastSyncAt?: Date
  pendingCount: number
  autoSyncEnabled: boolean
}

export interface ContentItemSync {
  contentItemId: number
  articleId?: string
  status: 'pending' | 'synced' | 'failed'
  syncedAt?: Date
  error?: string
}

// ==================== 统计数据 ====================

export interface BlogStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  reviewArticles: number
  totalViews: number
  totalLikes: number
  totalComments: number
  topCategories: Array<{
    category: Category
    count: number
  }>
  recentActivity: Array<{
    type: 'article' | 'comment' | 'like'
    articleId: string
    articleTitle: string
    timestamp: Date
  }>
}
