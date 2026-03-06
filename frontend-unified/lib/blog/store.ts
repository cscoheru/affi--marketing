'use client'

import { create } from 'zustand'
import type { Article, BlogFilters, Category, Comment, AIGenerationOptions, AIGenerationResult } from './types'
import { contentApi } from '@/lib/api'
import { sampleArticles } from './sample-articles'

// Map content types from backend to blog categories
export const categories: Category[] = [
  { id: '1', slug: 'review', name: '评测', description: '产品深度评测', color: 'bg-blue-500' },
  { id: '2', slug: 'blog', name: '文章', description: '营销文章', color: 'bg-green-500' },
  { id: '3', slug: 'guide', name: '指南', description: '使用指南', color: 'bg-yellow-500' },
  { id: '4', slug: 'science', name: '科普', description: '知识科普', color: 'bg-pink-500' },
  { id: '5', slug: 'social', name: '社媒', description: '社交媒体', color: 'bg-indigo-500' },
]

const defaultAuthor = {
  id: 'current-user',
  name: 'Affi Marketing',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=affi',
}

interface BlogState {
  articles: Article[]
  currentArticle: Article | null
  categories: Category[]
  filters: BlogFilters
  loading: boolean
  error: string | null

  // Actions
  fetchArticles: () => Promise<void>
  fetchArticleBySlug: (slug: string) => Promise<void>
  likeArticle: (id: string) => Promise<void>
  addComment: (articleId: string, content: string, parentId?: string) => Promise<void>
  generateWithAI: (options: AIGenerationOptions) => Promise<AIGenerationResult>
  createArticle: (article: Partial<Article>) => Promise<Article>
  updateArticle: (id: string, updates: Partial<Article>) => Promise<void>
  publishArticle: (id: string) => Promise<void>
  deleteArticle: (id: string) => Promise<void>
  setFilters: (filters: Partial<BlogFilters>) => void
  getFilteredArticles: () => Article[]
}

// Convert backend ContentItem to Article
const contentToArticle = (item: any): Article => {
  const category = categories.find(c => c.slug === item.type) || categories[0]
  return {
    id: String(item.id),
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt || item.content?.substring(0, 200) + '...',
    content: item.content || '',
    coverImage: undefined,
    category,
    author: defaultAuthor,
    status: item.status,
    publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    tags: item.seoKeywords?.split(',').filter(Boolean) || [],
    likes: 0,
    comments: [],
    metaDescription: item.seoDescription,
  }
}

export const useBlogStore = create<BlogState>((set, get) => ({
  articles: [],
  currentArticle: null,
  categories,
  filters: {
    category: '',
    search: '',
    sort: 'latest',
  },
  loading: false,
  error: null,

  fetchArticles: async () => {
    set({ loading: true, error: null })
    try {
      const response = await contentApi.list({ page: 1, size: 100, status: 'published' })
      const apiArticles = response.contents.map(contentToArticle)
      // 合并 API 数据和示例数据
      const allArticles = [...sampleArticles, ...apiArticles]
      set({ articles: allArticles, loading: false })
    } catch (error) {
      // 如果 API 失败，只使用示例数据
      set({ articles: sampleArticles, loading: false })
    }
  },

  fetchArticleBySlug: async (slug: string) => {
    set({ loading: true, error: null })
    try {
      // Try to find in existing articles first (including sample articles)
      const { articles } = get()
      const existing = articles.find(a => a.slug === slug)
      if (existing) {
        set({ currentArticle: existing, loading: false })
        return
      }

      // Fetch from API if not found
      const response = await contentApi.list({ page: 1, size: 100 })
      const apiArticles = response.contents.map(contentToArticle)
      const article = apiArticles.find(a => a.slug === slug) || null

      set({ currentArticle: article, articles: [...sampleArticles, ...apiArticles], loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取文章详情失败', loading: false })
    }
  },

  likeArticle: async (id: string) => {
    const { articles, currentArticle } = get()
    try {
      // In a real app, this would call a like API
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

  addComment: async (articleId: string, content: string, parentId?: string) => {
    const { articles, currentArticle } = get()
    try {
      // In a real app, this would call a comment API
      const newComment: Comment = {
        id: `c${Date.now()}`,
        articleId,
        author: defaultAuthor,
        content,
        createdAt: new Date(),
        likes: 0,
        parentId,
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

  generateWithAI: async (options: AIGenerationOptions): Promise<AIGenerationResult> => {
    // Simulate AI generation - in a real app, this would call the AI API
    await new Promise(resolve => setTimeout(resolve, 2000))

    const lengthMap = {
      short: 300,
      medium: 600,
      long: 1000,
    }

    const toneMap = {
      professional: '专业、严谨、权威',
      casual: '轻松、随意、亲切',
      friendly: '友好、热情、互动',
    }

    return {
      title: `${options.topic} - 深度解析与实践指南`,
      content: `# ${options.topic}\n\n这是一篇关于 ${options.topic} 的${toneMap[options.tone]}风格文章。\n\n## 概述\n\n本文将深入探讨 ${options.topic} 的各个方面，为您提供全面的理解和实践指导。\n\n## 核心要点\n\n1. **基础概念** - 了解 ${options.topic} 的基本原理\n2. **实践应用** - 如何在实际场景中应用\n3. **最佳实践** - 行业推荐的做法\n4. **常见问题** - 解答常见疑问\n\n## 详细内容\n\n${'这里是详细的内容...'.repeat(lengthMap[options.length] / 20)}\n\n## 总结\n\n通过本文，您应该对 ${options.topic} 有了更深入的理解。`,
      excerpt: `深入了解 ${options.topic}，掌握核心概念和实践技巧，提升您在该领域的专业能力。`,
      tags: [options.topic, options.category || '通用', '教程'],
      metaDescription: `全面解析 ${options.topic}，包含详细的概念解释和实践指南。`,
    }
  },

  createArticle: async (articleData: Partial<Article>): Promise<Article> => {
    const { articles, categories } = get()
    try {
      const category = articleData.category || categories[0]
      const createData = {
        slug: articleData.slug || `article-${Date.now()}`,
        asin: 'B08X6YZ9G5', // Default ASIN
        title: articleData.title || '无标题',
        type: category.slug as 'review' | 'blog' | 'guide' | 'science' | 'social',
        content: articleData.content || '',
      }

      const result = await contentApi.create(createData)
      const newArticle = contentToArticle({ ...result, status: 'draft' })

      set({ articles: [newArticle, ...articles] })
      return newArticle
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建文章失败' })
      throw error
    }
  },

  updateArticle: async (id: string, updates: Partial<Article>) => {
    const { articles } = get()
    try {
      const updateData: any = {}
      if (updates.title) updateData.title = updates.title
      if (updates.content) updateData.content = updates.content
      if (updates.status) updateData.status = updates.status

      await contentApi.update(id, updateData)

      set({
        articles: articles.map(a =>
          a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
        ),
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '更新文章失败' })
    }
  },

  publishArticle: async (id: string) => {
    const { articles } = get()
    try {
      // First approve the content
      await contentApi.review(id, 'approve', '自动审核通过')
      // Then submit for publishing
      const { publishApi } = await import('@/lib/api')
      await publishApi.submit({ contentId: Number(id), platforms: ['Blogger'] })

      set({
        articles: articles.map(a =>
          a.id === id
            ? { ...a, status: 'published' as const, publishedAt: new Date(), updatedAt: new Date() }
            : a
        ),
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '发布文章失败' })
    }
  },

  deleteArticle: async (id: string) => {
    const { articles } = get()
    try {
      await contentApi.delete(id)
      set({ articles: articles.filter(a => a.id !== id) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除文章失败' })
    }
  },

  setFilters: (filters: Partial<BlogFilters>) => {
    set(state => ({ filters: { ...state.filters, ...filters } }))
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

    switch (filters.sort) {
      case 'most-liked':
        filtered.sort((a, b) => b.likes - a.likes)
        break
      case 'most-commented':
        filtered.sort((a, b) => b.comments.length - a.comments.length)
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
}))
