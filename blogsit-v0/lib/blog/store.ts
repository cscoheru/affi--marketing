import { create } from 'zustand'
import type { Article, BlogFilters, Category, Comment, AIGenerationOptions, AIGenerationResult } from './types'
import { mockArticles, categories as mockCategories } from './data'

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

export const useBlogStore = create<BlogState>((set, get) => ({
  articles: [],
  currentArticle: null,
  categories: mockCategories,
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      set({ articles: mockArticles, loading: false })
    } catch {
      set({ error: '获取文章失败', loading: false })
    }
  },

  fetchArticleBySlug: async (slug: string) => {
    set({ loading: true, error: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      const article = mockArticles.find(a => a.slug === slug) || null
      set({ currentArticle: article, loading: false })
    } catch {
      set({ error: '获取文章详情失败', loading: false })
    }
  },

  likeArticle: async (id: string) => {
    const { articles, currentArticle } = get()
    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      
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
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const newComment: Comment = {
        id: `c${Date.now()}`,
        articleId,
        author: {
          id: 'current-user',
          name: '当前用户',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
        },
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
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newArticle: Article = {
      id: `${Date.now()}`,
      slug: articleData.slug || `article-${Date.now()}`,
      title: articleData.title || '无标题',
      excerpt: articleData.excerpt || '',
      content: articleData.content || '',
      coverImage: articleData.coverImage,
      category: articleData.category || categories[0],
      author: {
        id: 'current-user',
        name: '当前用户',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=current',
      },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: articleData.tags || [],
      likes: 0,
      comments: [],
      metaDescription: articleData.metaDescription,
    }
    
    set({ articles: [newArticle, ...articles] })
    return newArticle
  },

  updateArticle: async (id: string, updates: Partial<Article>) => {
    const { articles } = get()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    set({
      articles: articles.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
      ),
    })
  },

  publishArticle: async (id: string) => {
    const { articles } = get()
    await new Promise(resolve => setTimeout(resolve, 300))
    
    set({
      articles: articles.map(a => 
        a.id === id 
          ? { ...a, status: 'published' as const, publishedAt: new Date(), updatedAt: new Date() }
          : a
      ),
    })
  },

  deleteArticle: async (id: string) => {
    const { articles } = get()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    set({ articles: articles.filter(a => a.id !== id) })
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
