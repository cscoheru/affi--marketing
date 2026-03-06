export interface Author {
  id: string
  name: string
  avatar: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  color: string
}

export interface Comment {
  id: string
  articleId: string
  author: Author
  content: string
  createdAt: Date
  likes: number
  parentId?: string
  replies?: Comment[]
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
}

export type AITone = 'professional' | 'casual' | 'friendly'
export type AILength = 'short' | 'medium' | 'long'

export interface AIGenerationOptions {
  topic: string
  tone: AITone
  length: AILength
  category?: string
}

export interface AIGenerationResult {
  title: string
  content: string
  excerpt: string
  tags: string[]
  metaDescription: string
}

export interface BlogFilters {
  category: string
  search: string
  sort: 'latest' | 'most-liked' | 'most-commented'
}
