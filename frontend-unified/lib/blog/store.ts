'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Article,
  BlogFilters,
  Category,
  Comment,
  AIGenerationOptions,
  AIGenerationResult,
  BlogSettings,
  BlogStats,
  ContentSyncStatus,
} from './types'
import { contentApi, publishApi } from '@/lib/api'
import { mockArticles, categories as mockCategories } from './sample-articles'
import { aiService } from '@/lib/ai-service'

// 默认博客设置
const defaultSettings: BlogSettings = {
  siteName: 'Affi-Marketing 博客',
  siteDescription: '探索联盟营销、SEO 优化、技术教程和产品测评的最新内容',
  siteUrl: '',
  commentsEnabled: true,
  commentsRequireApproval: false,
  commentsRequireLogin: false,
  defaultMetaDescription: '',
  defaultKeywords: [],
  defaultShareTitle: 'Affi-Marketing 博客',
  defaultShareDescription: '探索联盟营销、SEO 优化、技术教程和产品测评的最新内容',
  articlesPerPage: 12,
  autoPublishFromContent: false,
  features: {
    readingProgress: true,
    shareButtons: true,
    relatedArticles: true,
    tableOfContents: true,
  },
}

// 默认作者（从系统用户获取）
const getDefaultAuthor = () => {
  // TODO: 从 auth store 获取当前用户
  return {
    id: 'current-user',
    name: 'Affi Marketing',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=affi',
    userId: 'current-user',
    role: 'admin' as const,
  }
}

// 转换后端 ContentItem 到 Article
const contentToArticle = (item: any, categories: Category[]): Article => {
  const category = categories.find(c => c.slug === item.type) || categories[0]
  return {
    id: String(item.id),
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt || item.content?.substring(0, 200) + '...',
    content: item.content || '',
    coverImage: undefined,
    category,
    author: getDefaultAuthor(),
    status: item.status,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    tags: item.seoKeywords?.split(',').filter(Boolean) || [],
    likes: 0,
    comments: [],
    metaDescription: item.seoDescription,
    contentItemId: item.id,
  }
}

interface BlogState {
  // 数据状态
  articles: Article[]
  currentArticle: Article | null
  categories: Category[]
  settings: BlogSettings
  stats: BlogStats | null
  syncStatus: ContentSyncStatus

  // UI 状态
  filters: BlogFilters
  loading: boolean
  error: string | null

  // ==================== 文章操作 ====================

  /**
   * 获取文章列表
   */
  fetchArticles: (options?: { page?: number; size?: number; status?: string }) => Promise<void>

  /**
   * 根据 slug 获取文章详情
   */
  fetchArticleBySlug: (slug: string) => Promise<void>

  /**
   * 创建文章
   */
  createArticle: (article: Partial<Article>) => Promise<Article>

  /**
   * 更新文章
   */
  updateArticle: (id: string, updates: Partial<Article>) => Promise<void>

  /**
   * 发布文章
   */
  publishArticle: (id: string, platforms?: string[]) => Promise<void>

  /**
   * 提交审核
   */
  submitForReview: (id: string) => Promise<void>

  /**
   * 删除文章
   */
  deleteArticle: (id: string) => Promise<void>

  /**
   * 点赞文章
   */
  likeArticle: (id: string) => Promise<void>

  /**
   * 获取筛选后的文章
   */
  getFilteredArticles: () => Article[]

  /**
   * 获取统计数据
   */
  fetchStats: () => Promise<void>

  // ==================== 分类操作 ====================

  /**
   * 获取分类列表
   */
  fetchCategories: () => Promise<void>

  /**
   * 创建分类
   */
  createCategory: (category: Partial<Category>) => Promise<Category>

  /**
   * 更新分类
   */
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>

  /**
   * 删除分类
   */
  deleteCategory: (id: string) => Promise<void>

  /**
   * 重新排序分类
   */
  reorderCategories: (ids: string[]) => Promise<void>

  // ==================== 评论操作 ====================

  /**
   * 添加评论
   */
  addComment: (articleId: string, content: string, parentId?: string) => Promise<void>

  /**
   * 删除评论
   */
  deleteComment: (articleId: string, commentId: string) => Promise<void>

  /**
   * 审核评论
   */
  moderateComment: (articleId: string, commentId: string, approve: boolean) => Promise<void>

  // ==================== AI 生成 ====================

  /**
   * AI 生成内容
   */
  generateWithAI: (options: AIGenerationOptions) => Promise<AIGenerationResult>

  // ==================== 设置操作 ====================

  /**
   * 更新设置
   */
  updateSettings: (settings: Partial<BlogSettings>) => Promise<void>

  /**
   * 重置为默认设置
   */
  resetSettings: () => void

  // ==================== 筛选操作 ====================

  /**
   * 设置筛选条件
   */
  setFilters: (filters: Partial<BlogFilters>) => void

  /**
   * 重置筛选条件
   */
  resetFilters: () => void

  // ==================== 内容自动化集成 ====================

  /**
   * 从内容自动化同步到博客
   */
  syncFromContent: (contentItemId: number) => Promise<Article>

  /**
   * 获取同步状态
   */
  fetchSyncStatus: () => Promise<void>

  /**
   * 启用/禁用自动同步
   */
  toggleAutoSync: (enabled: boolean) => void

  /**
   * 批量同步待发布内容
   */
  syncAllPendingContent: () => Promise<{ synced: number; failed: number }>
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      // 初始状态
      articles: [],
      currentArticle: null,
      categories: mockCategories,
      settings: defaultSettings,
      stats: null,
      syncStatus: {
        pendingCount: 0,
        autoSyncEnabled: false,
      },
      filters: {
        category: '',
        search: '',
        sort: 'latest',
      },
      loading: false,
      error: null,

      // ==================== 文章操作 ====================

      fetchArticles: async (options = {}) => {
        set({ loading: true, error: null })
        // 暂时直接使用mock数据，跳过API调用
        // TODO: 后续启用API集成
        try {
          const { page = 1, size = 100, status } = options
          // const response = await contentApi.list({ page, size, status })
          // const { categories } = get()
          // const apiArticles = response.contents.map((item: any) => contentToArticle(item, categories))

          // 直接使用mock数据
          const allArticles = mockArticles
          set({ articles: allArticles, loading: false })

          // 更新统计
          get().fetchStats()
        } catch (error) {
          // 如果 API 失败，只使用示例数据
          console.error('Failed to fetch articles from API, using mock data:', error)
          set({ articles: mockArticles, loading: false })
        }
      },

      fetchArticleBySlug: async (slug: string) => {
        set({ loading: true, error: null })
        try {
          // 先在现有文章中查找
          const { articles } = get()
          const existing = articles.find(a => a.slug === slug)
          if (existing) {
            set({ currentArticle: existing, loading: false })
            return
          }

          // 从 API 获取
          const response = await contentApi.list({ page: 1, size: 100 })
          const { categories } = get()
          const apiArticles = response.contents.map((item: any) => contentToArticle(item, categories))
          const article = apiArticles.find((a: Article) => a.slug === slug) || null

          set({ currentArticle: article, articles: [...mockArticles, ...apiArticles], loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取文章详情失败', loading: false })
        }
      },

      createArticle: async (articleData: Partial<Article>) => {
        const { articles, categories } = get()
        set({ loading: true, error: null })

        try {
          const category = articleData.category || categories[0]
          const now = new Date()

          // 创建本地文章（暂时不调用后端 API）
          const newArticle: Article = {
            id: `local-${Date.now()}`,
            slug: articleData.slug || `article-${Date.now()}`,
            title: articleData.title || '无标题',
            excerpt: articleData.excerpt || '',
            content: articleData.content || '',
            category,
            author: getDefaultAuthor(),
            status: 'draft',
            coverImage: articleData.coverImage,
            tags: articleData.tags || [],
            metaDescription: articleData.metaDescription,
            createdAt: now,
            updatedAt: now,
            likes: 0,
            comments: [],
          }

          // 尝试同步到后端（可选，失败不影响本地保存）
          try {
            const createData = {
              slug: newArticle.slug,
              asin: `BLOG-${Date.now()}`, // 为博客文章生成临时 ASIN
              title: newArticle.title,
              type: category.slug as 'review' | 'blog' | 'guide' | 'science' | 'social',
              content: newArticle.content,
              excerpt: newArticle.excerpt,
              seoDescription: newArticle.metaDescription,
              seoKeywords: newArticle.tags?.join(','),
            }
            const result = await contentApi.create(createData)
            // 如果后端成功，使用后端返回的 ID
            newArticle.id = String(result.id)
            newArticle.contentItemId = result.id
          } catch (apiError) {
            console.warn('Backend sync failed, article saved locally only:', apiError)
          }

          set({ articles: [newArticle, ...articles], loading: false })
          get().fetchStats()
          return newArticle
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '创建文章失败', loading: false })
          throw error
        }
      },

      updateArticle: async (id: string, updates: Partial<Article>) => {
        const { articles } = get()
        set({ loading: true, error: null })

        try {
          // 本地更新
          set({
            articles: articles.map(a =>
              a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
            ),
            loading: false,
          })

          // 尝试同步到后端（可选）
          try {
            const updateData: any = {}
            if (updates.title) updateData.title = updates.title
            if (updates.content) updateData.content = updates.content
            if (updates.excerpt) updateData.excerpt = updates.excerpt
            if (updates.metaDescription) updateData.seoDescription = updates.metaDescription
            if (updates.tags) updateData.seoKeywords = updates.tags.join(',')
            if (updates.status) updateData.status = updates.status

            await contentApi.update(id, updateData)
          } catch (apiError) {
            console.warn('Backend sync failed, article updated locally only:', apiError)
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '更新文章失败', loading: false })
        }
      },

      publishArticle: async (id: string, platforms = ['Blogger']) => {
        const { articles } = get()
        set({ loading: true, error: null })

        try {
          // 本地更新状态
          const updatedArticles = articles.map(a =>
            a.id === id
              ? { ...a, status: 'published' as const, publishedAt: new Date(), updatedAt: new Date() }
              : a
          )
          set({ articles: updatedArticles, loading: false })
          get().fetchStats()

          // 尝试同步到后端（可选，失败不影响本地）
          try {
            await contentApi.review(id, 'approve', '自动审核通过')
            await publishApi.submit({ contentId: Number(id), platforms })
          } catch (apiError) {
            console.warn('Backend sync failed, article published locally only:', apiError)
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '发布文章失败', loading: false })
          throw error
        }
      },

      submitForReview: async (id: string) => {
        const { articles } = get()
        set({ loading: true, error: null })

        try {
          // 本地更新状态
          set({
            articles: articles.map(a =>
              a.id === id ? { ...a, status: 'review' as const, updatedAt: new Date() } : a
            ),
            loading: false,
          })

          // 尝试同步到后端（可选）
          try {
            await contentApi.update(id, { status: 'review' })
          } catch (apiError) {
            console.warn('Backend sync failed:', apiError)
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '提交审核失败', loading: false })
        }
      },

      deleteArticle: async (id: string) => {
        const { articles } = get()
        set({ loading: true, error: null })

        try {
          await contentApi.delete(id)
          set({ articles: articles.filter(a => a.id !== id), loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '删除文章失败', loading: false })
        }
      },

      likeArticle: async (id: string) => {
        const { articles, currentArticle } = get()
        try {
          set({
            articles: articles.map(a =>
              a.id === id ? { ...a, likes: a.likes + 1 } : a
            ),
            currentArticle: currentArticle?.id === id
              ? { ...currentArticle, likes: currentArticle.likes + 1 }
              : currentArticle,
          })
        } catch {
          set({ error: '点赞失败' })
        }
      },

      getFilteredArticles: () => {
        const { articles, filters } = get()

        let filtered = articles.filter(a => a.status === 'published')

        if (filters.category) {
          filtered = filtered.filter(a => a.category.slug === filters.category)
        }

        if (filters.search) {
          const search = filters.search.toLowerCase()
          filtered = filtered.filter(a =>
            a.title.toLowerCase().includes(search) ||
            a.excerpt.toLowerCase().includes(search) ||
            a.tags.some(t => t.toLowerCase().includes(search))
          )
        }

        if (filters.tags && filters.tags.length > 0) {
          filtered = filtered.filter(a =>
            filters.tags!.some(tag => a.tags.includes(tag))
          )
        }

        switch (filters.sort) {
          case 'most-liked':
            filtered.sort((a, b) => b.likes - a.likes)
            break
          case 'most-commented':
            filtered.sort((a, b) => b.comments.length - a.comments.length)
            break
          case 'most-viewed':
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0))
            break
          case 'latest':
          default:
            filtered.sort((a, b) =>
              new Date(b.publishedAt || b.createdAt).getTime() -
              new Date(a.publishedAt || a.createdAt).getTime()
            )
        }

        return filtered
      },

      fetchStats: async () => {
        const { articles } = get()
        const stats: BlogStats = {
          totalArticles: articles.length,
          publishedArticles: articles.filter(a => a.status === 'published').length,
          draftArticles: articles.filter(a => a.status === 'draft').length,
          reviewArticles: articles.filter(a => a.status === 'review').length,
          totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
          totalLikes: articles.reduce((sum, a) => sum + a.likes, 0),
          totalComments: articles.reduce((sum, a) => sum + a.comments.length, 0),
          topCategories: [],
          recentActivity: [],
        }
        set({ stats })
      },

      // ==================== 分类操作 ====================

      fetchCategories: async () => {
        // TODO: 从 API 获取分类
        set({ categories: mockCategories })
      },

      createCategory: async (category: Partial<Category>) => {
        const { categories } = get()
        const newCategory: Category = {
          id: `${Date.now()}`,
          slug: category.slug || `category-${Date.now()}`,
          name: category.name || '新分类',
          description: category.description,
          color: category.color || 'bg-gray-500',
          icon: category.icon,
          order: categories.length,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        set({ categories: [...categories, newCategory] })
        return newCategory
      },

      updateCategory: async (id: string, updates: Partial<Category>) => {
        const { categories } = get()
        set({
          categories: categories.map(c =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
        })
      },

      deleteCategory: async (id: string) => {
        const { categories } = get()
        // 检查是否有文章使用此分类
        const { articles } = get()
        const hasArticles = articles.some(a => a.category.id === id)
        if (hasArticles) {
          throw new Error('无法删除：该分类下还有文章')
        }
        set({ categories: categories.filter(c => c.id !== id) })
      },

      reorderCategories: async (ids: string[]) => {
        const { categories } = get()
        const reordered = ids.map((id, index) => {
          const category = categories.find(c => c.id === id)!
          return { ...category, order: index }
        })
        set({ categories: reordered.sort((a, b) => a.order - b.order) })
      },

      // ==================== 评论操作 ====================

      addComment: async (articleId: string, content: string, parentId?: string) => {
        const { articles, currentArticle } = get()
        try {
          const newComment: Comment = {
            id: `c${Date.now()}`,
            articleId,
            author: getDefaultAuthor(),
            content,
            createdAt: new Date(),
            updatedAt: new Date(),
            likes: 0,
            parentId,
            status: get().settings.commentsRequireApproval ? 'pending' : 'approved',
          }

          const addCommentToArticle = (article: Article): Article => {
            if (parentId) {
              const addReply = (comments: Comment[]): Comment[] => {
                return comments.map(c => {
                  if (c.id === parentId) {
                    return { ...c, replies: [...(c.replies || []), newComment] }
                  }
                  if (c.replies) {
                    return { ...c, replies: addReply(c.replies) }
                  }
                  return c
                })
              }
              return { ...article, comments: addReply(article.comments) }
            }
            return { ...article, comments: [...article.comments, newComment] }
          }

          set({
            articles: articles.map(a =>
              a.id === articleId ? addCommentToArticle(a) : a
            ),
            currentArticle: currentArticle?.id === articleId
              ? addCommentToArticle(currentArticle)
              : currentArticle,
          })
        } catch {
          set({ error: '评论失败' })
        }
      },

      deleteComment: async (articleId: string, commentId: string) => {
        // TODO: 实现 API 调用
        const { articles, currentArticle } = get()

        const removeComment = (comments: Comment[]): Comment[] => {
          return comments
            .filter(c => c.id !== commentId)
            .map(c => ({
              ...c,
              replies: c.replies ? removeComment(c.replies) : undefined,
            }))
        }

        const updateArticle = (article: Article) => ({
          ...article,
          comments: removeComment(article.comments),
        })

        set({
          articles: articles.map(a =>
            a.id === articleId ? updateArticle(a) : a
          ),
          currentArticle: currentArticle?.id === articleId
            ? updateArticle(currentArticle)
            : currentArticle,
        })
      },

      moderateComment: async (_articleId: string, _commentId: string, _approve: boolean) => {
        // TODO: 实现 API 调用
      },

      // ==================== AI 生成 ====================

      generateWithAI: async (options: AIGenerationOptions): Promise<AIGenerationResult> => {
        try {
          // 调用AI服务API
          const result = await aiService.generateContent({
            topic: options.topic,
            tone: options.tone,
            length: options.length,
            category: options.category,
            model: 'qwen', // 默认使用通义千问
          })

          return result
        } catch (error) {
          // 如果AI服务调用失败，抛出错误
          throw new Error(error instanceof Error ? error.message : 'AI生成失败')
        }
      },

      // ==================== 设置操作 ====================

      updateSettings: async (updates: Partial<BlogSettings>) => {
        set({ settings: { ...get().settings, ...updates } })
      },

      resetSettings: () => {
        set({ settings: defaultSettings })
      },

      // ==================== 筛选操作 ====================

      setFilters: (filters: Partial<BlogFilters>) => {
        set(state => ({ filters: { ...state.filters, ...filters } }))
      },

      resetFilters: () => {
        set({
          filters: {
            category: '',
            search: '',
            sort: 'latest',
          },
        })
      },

      // ==================== 内容自动化集成 ====================

      syncFromContent: async (contentItemId: number) => {
        const { articles, categories } = get()

        try {
          // 从内容自动化获取详细信息
          const contentItem = await contentApi.get(contentItemId)

          // 检查是否已经同步过
          const existingSync = articles.find(a => a.contentItemId === contentItemId)
          if (existingSync) {
            return existingSync
          }

          // 匹配分类 (review -> 评测, blog -> 文章, guide -> 指南, science -> 科普, social -> 社媒)
          const categoryMap: Record<string, string> = {
            'review': 'review',
            'blog': 'blog',
            'guide': 'guide',
            'science': 'science',
            'social': 'social',
          }
          const categorySlug = categoryMap[contentItem.type] || 'blog'
          const category = categories.find(c => c.slug === categorySlug) || categories[0]

          // 生成标签 (从 SEO 关键词提取)
          const tags = contentItem.seoKeywords
            ? contentItem.seoKeywords.split(',').map(k => k.trim()).filter(Boolean)
            : []

          // 创建博客草稿
          const draftArticle: Article = {
            id: `sync-${contentItemId}`,
            slug: contentItem.slug,
            title: contentItem.title,
            excerpt: contentItem.excerpt || contentItem.content?.substring(0, 200) + '...',
            content: contentItem.content,
            category,
            author: getDefaultAuthor(),
            status: 'draft', // 同步的内容默认为草稿状态
            createdAt: new Date(contentItem.createdAt),
            updatedAt: new Date(contentItem.updatedAt),
            tags,
            likes: 0,
            comments: [],
            metaDescription: contentItem.seoDescription,
            contentItemId,
          }

          set({ articles: [draftArticle, ...articles] })
          get().fetchStats()

          return draftArticle
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : '同步失败')
        }
      },

      fetchSyncStatus: async () => {
        try {
          // 获取待同步的内容数量 (状态为 approved 的内容)
          const response = await contentApi.list({ page: 1, size: 100, status: 'approved' })
          const pendingCount = response.contents.filter(c => {
            // 检查是否已经同步到博客
            const { articles } = get()
            return !articles.some(a => a.contentItemId === c.id)
          }).length

          set({
            syncStatus: {
              pendingCount,
              autoSyncEnabled: get().syncStatus.autoSyncEnabled,
              lastSyncAt: get().syncStatus.lastSyncAt,
            },
          })
        } catch {
          // API 调用失败时使用默认值
          set({
            syncStatus: {
              pendingCount: 0,
              autoSyncEnabled: get().syncStatus.autoSyncEnabled,
              lastSyncAt: get().syncStatus.lastSyncAt,
            },
          })
        }
      },

      toggleAutoSync: (enabled: boolean) => {
        set({
          syncStatus: { ...get().syncStatus, autoSyncEnabled: enabled },
        })
      },

      syncAllPendingContent: async () => {
        try {
          // 获取所有已审核通过的内容
          const response = await contentApi.list({ page: 1, size: 100, status: 'approved' })
          const { articles } = get()

          // 筛选出未同步的内容
          const pendingSync = response.contents.filter(c =>
            !articles.some(a => a.contentItemId === c.id)
          )

          let synced = 0
          let failed = 0

          // 批量同步
          for (const contentItem of pendingSync) {
            try {
              await get().syncFromContent(contentItem.id)
              synced++
            } catch {
              failed++
            }
          }

          // 更新同步状态
          set({
            syncStatus: {
              ...get().syncStatus,
              pendingCount: Math.max(0, pendingSync.length - synced),
              lastSyncAt: new Date(),
            },
          })

          return { synced, failed }
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : '批量同步失败')
        }
      },
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        settings: state.settings,
        filters: state.filters,
        syncStatus: state.syncStatus,
      }),
    }
  )
)
