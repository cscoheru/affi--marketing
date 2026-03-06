const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: number
}

interface ApiError {
  message: string
  code?: number
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    return url.toString()
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(error.message || '请求失败')
    }

    return response.json()
  }

  // GET 请求
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, params)
  }

  // POST 请求
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT 请求
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE 请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  // POST 表单数据 (用于文件上传)
  async postForm<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {}

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '请求失败' }))
      throw new Error(error.message || '请求失败')
    }

    return response.json()
  }
}

// 创建 API 客户端实例
export const api = new ApiClient(API_BASE)

// 更新 token (用于登录后)
export const updateApiToken = (token: string) => {
  api.setToken(token)
}

// 清除 token (用于登出)
export const clearApiToken = () => {
  api.clearToken()
}

// ==================== 类型定义 ====================

export interface Product {
  id: number
  asin: string
  title: string
  category?: string
  price?: number
  rating?: number
  reviewCount?: number
  imageUrl?: string
  status?: string
  potentialScore?: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductDto {
  asin: string
  title: string
  category?: string
  price?: number
  rating?: number
  reviewCount?: number
  imageUrl?: string
  status?: string
}

export interface UpdateProductDto {
  title?: string
  category?: string
  price?: number
  rating?: number
  reviewCount?: number
  imageUrl?: string
  status?: string
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
}

export interface Material {
  id: number
  name: string
  type: 'image' | 'video' | 'document'
  url: string
  size: number
  createdAt: string
}

export interface MaterialListResponse {
  materials: Material[]
  total: number
  page: number
  pageSize: number
}

export interface ContentItem {
  id: number
  slug: string
  asin: string
  title: string
  type: string
  content: string
  excerpt: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  status: string
  aiGenerated: boolean
  aiModel: string
  humanReviewed: boolean
  reviewedBy: number
  reviewComment: string
  wordCount: number
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateContentDto {
  title: string
  type: 'article' | 'review' | 'comparison'
  productId?: number
  content: string
}

export interface UpdateContentDto {
  title?: string
  status?: 'draft' | 'published' | 'review'
  content?: string
}

export interface ContentListResponse {
  contents: ContentItem[]
  total: number
  page: number
  size: number
}

export interface PublishTask {
  id: number
  contentId: number
  platforms: string
  status: string
  results: string
  errorMsg: string
  createdAt: string
  updatedAt: string
}

export interface CreatePublishDto {
  content_id: string
  platform: 'blog' | 'twitter' | 'facebook' | 'instagram'
  scheduled_at?: string
}

export interface PublishResult {
  task_id: string
  status: string
  message: string
}

export interface PublishTaskListResponse {
  queue: PublishTask[]
}

// ==================== 产品 API ====================

export const productsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    api.get<ProductListResponse>('/api/v1/products', params),

  get: (id: string | number) =>
    api.get<Product>(`/api/v1/products/${id}`),

  create: (data: CreateProductDto) =>
    api.post<Product>('/api/v1/products', data),

  update: (id: string | number, data: UpdateProductDto) =>
    api.put<Product>(`/api/v1/products/${id}`, data),

  delete: (id: string | number) =>
    api.delete<void>(`/api/v1/products/${id}`),
}

// ==================== 素材 API ====================

export const materialsApi = {
  list: (params?: { page?: number; pageSize?: number; type?: string }) =>
    api.get<MaterialListResponse>('/api/v1/materials', params),

  upload: (formData: FormData) =>
    api.postForm<Material>('/api/v1/materials/upload', formData),

  delete: (id: string | number) =>
    api.delete<void>(`/api/v1/materials/${id}`),

  getUrl: (id: string | number) => `${API_BASE}/api/v1/materials/${id}/download`,
}

// ==================== 内容 API ====================

export const contentApi = {
  list: (params?: { page?: number; size?: number; status?: string; type?: string }) =>
    api.get<ContentListResponse>('/api/v1/contents', params),

  get: (id: string | number) =>
    api.get<ContentItem>(`/api/v1/contents/${id}`),

  create: (data: CreateContentDto) =>
    api.post<ContentItem>('/api/v1/contents', data),

  update: (id: string | number, data: UpdateContentDto) =>
    api.put<ContentItem>(`/api/v1/contents/${id}`, data),

  delete: (id: string | number) =>
    api.delete<void>(`/api/v1/contents/${id}`),

  publish: (id: string | number) =>
    api.post<ContentItem>(`/api/v1/contents/${id}/publish`),
}

// ==================== 发布 API ====================

export const publishApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get<PublishTaskListResponse>('/api/v1/publish/queue', params),

  create: (data: CreatePublishDto) =>
    api.post<PublishTask>('/api/v1/publish', data),

  execute: (id: string | number) =>
    api.post<PublishResult>(`/api/v1/publish/${id}/execute`),

  cancel: (id: string | number) =>
    api.post<void>(`/api/v1/publish/${id}/cancel`),
}
