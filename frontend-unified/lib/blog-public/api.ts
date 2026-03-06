const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string
  category_id: number
  author_id: number
  status: string
  image_url: string
  published_at: string
  meta_title: string
  meta_description: string
  meta_keywords: string
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  category?: BlogCategory
  author?: Author
}

export interface BlogCategory {
  id: number
  name: string
  slug: string
  description: string
  parent_id?: number
  created_at: string
  updated_at: string
  post_count?: number
}

export interface Author {
  id: number
  name: string
  email?: string
  avatar_url?: string
}

export interface BlogPostListResponse {
  posts: BlogPost[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 获取博客文章列表
 */
export async function getBlogPosts(params: {
  page?: number
  page_size?: number
  category?: string
} = {}): Promise<BlogPostListResponse> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.page_size) searchParams.append('page_size', params.page_size.toString())
  if (params.category) searchParams.append('category', params.category)

  const response = await fetch(
    `${API_BASE_URL}/api/public/blog/posts?${searchParams.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch blog posts: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 根据 slug 获取文章详情
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/blog/posts/${slug}`
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Failed to fetch blog post: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取分类列表
 */
export async function getBlogCategories(): Promise<BlogCategory[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/blog/categories`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch blog categories: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取精选文章
 */
export async function getFeaturedPosts(limit: number = 3): Promise<BlogPost[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/blog/featured?limit=${limit}`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch featured posts: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取站点地图
 */
export async function getBlogSitemap(): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/api/public/blog/sitemap.xml`
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`)
  }

  return response.text()
}
