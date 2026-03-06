const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: number
}

export interface ApiError {
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

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
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
    params?: Record<string, string | number | boolean | undefined>
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
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
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
      // 尝试解析错误响应
      let errorMessage = '请求失败'
      try {
        const errorData = await response.json().catch(() => null)
        if (errorData) {
          errorMessage = errorData.message || errorData.error || errorMessage
        }
      } catch {
        // 如果JSON解析失败，使用状态码生成消息
        errorMessage = `请求失败 (${response.status})`
      }
      throw new Error(errorMessage)
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
  slug: string
  asin: string
  title: string
  type: 'review' | 'science' | 'guide' | 'blog' | 'social' | 'video' | 'email'
  content: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
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

// ==================== 新类型定义（内容企业系统）====================

// 市场机会状态
export type MarketStatus = 'watching' | 'targeting' | 'active' | 'saturated' | 'exited'

// 市场机会（原 Amazon 产品，现作为"市场"概念）
export interface MarketOpportunity {
  id: number
  asin: string
  title: string
  category?: string
  price?: string          // ✅ string 类型，后端 decimal 序列化为 string
  rating?: string         // ✅ string 类型
  reviewCount?: number
  imageUrl?: string
  status: MarketStatus
  marketSize?: 'large' | 'medium' | 'small'
  competitionLevel?: 'high' | 'medium' | 'low'
  contentPotential?: 'high' | 'medium' | 'low'
  aiScore?: number
  contentCount: number
  totalClicks: number
  totalConversions: number
  totalRevenue: string    // ✅ string 类型
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MarketListResponse {
  markets: MarketOpportunity[]
  total: number
  page: number
  pageSize: number
}

export interface CreateMarketDto {
  asin: string
  title?: string
  category?: string
  status?: MarketStatus
}

export interface UpdateMarketDto {
  title?: string
  category?: string
  status?: MarketStatus
  marketSize?: 'large' | 'medium' | 'small'
  competitionLevel?: 'high' | 'medium' | 'low'
  contentPotential?: 'high' | 'medium' | 'low'
}

// 产品（内容）状态
export type ProductStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'
export type ProductType = 'review' | 'guide' | 'tutorial' | 'list' | 'news'

// 产品（重新定义为内容）
export interface ProductContent {
  id: number
  slug: string
  title: string
  type: ProductType
  content: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  status: ProductStatus
  wordCount: number
  aiGenerated: boolean
  aiModel?: string
  reviewedBy?: number
  reviewComment?: string
  reviewedAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  markets?: MarketOpportunity[]
  // 表现数据（从 AnalyticsController 获取）
  views?: number
  clicks?: number
  conversions?: number
  revenue?: string
}

export interface ProductContentListResponse {
  products: ProductContent[]
  total: number
  page: number
  pageSize: number
}

export interface CreateProductContentDto {
  slug: string
  title: string
  type: ProductType
  content: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  marketIds?: number[]
}

export interface UpdateProductContentDto {
  title?: string
  type?: ProductType
  content?: string
  excerpt?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  status?: ProductStatus
}

// AI 生成内容请求
export interface GenerateContentDto {
  marketId: number
  type: ProductType
  tone?: string
  length?: number
}

// 发布平台
export interface PublishPlatform {
  id: number
  name: string
  type: string
  config: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  createdAt: string
}

export interface PlatformListResponse {
  platforms: PublishPlatform[]
}

export interface AddPlatformDto {
  name: string
  type: string
  config: Record<string, unknown>
}

// 发布任务（营销中心）
export interface MarketingTask {
  id: number
  productId: number
  platformId: number
  platformName: string
  status: 'pending' | 'publishing' | 'published' | 'failed'
  publishedUrl?: string
  errorMsg?: string
  scheduledAt?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface MarketingTaskListResponse {
  tasks: MarketingTask[]
  total: number
  page: number
  pageSize: number
}

export interface CreateMarketingTaskDto {
  productId: number
  platformId: number
  scheduledAt?: string
}

export interface BatchPublishDto {
  productIds: number[]
  platformIds: number[]
}

// 数据分析响应类型
export interface AnalyticsOverview {
  totalClicks: number
  totalConversions: number
  totalRevenue: string
  conversionRate: string
  totalContent: number
  activeMarkets: number
  pendingReview: number
}

export interface ContentPerformance {
  productId: number
  productTitle: string
  views: number
  clicks: number
  conversions: number
  revenue: string
  conversionRate: string
}

export interface AnalyticsTrend {
  date: string
  clicks: number
  conversions: number
  revenue: string
}

export interface AnalyticsTrendResponse {
  trends: AnalyticsTrend[]
}

// ==================== 产品 API ====================

export const productsApi = {
  list: (params?: { page?: number; pageSize?: number; search?: string }) =>
    api.get<ProductListResponse>('/api/v1/products', params),

  get: (asin: string) =>
    api.get<Product>(`/api/v1/products/${asin}`),

  create: (data: CreateProductDto) =>
    api.post<Product>('/api/v1/products', data),

  update: (asin: string, data: UpdateProductDto) =>
    api.put<Product>(`/api/v1/products/${asin}`, data),

  delete: (asin: string) =>
    api.delete<void>(`/api/v1/products/${asin}`),
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

  review: (id: string | number, action: 'approve' | 'reject' | 'revision', comment?: string) =>
    api.post<ContentItem>(`/api/v1/contents/${id}/review`, { action, comment }),
}

// ==================== 发布 API ====================

export interface SubmitPublishDto {
  contentId: number
  platforms: string[]
}

export const publishApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    api.get<PublishTaskListResponse>('/api/v1/publish/queue', params),

  submit: (data: SubmitPublishDto) =>
    api.post<{ taskId: number; status: string; message: string }>('/api/v1/publish/submit', data),

  retry: (id: string | number) =>
    api.post<{ taskId: number; status: string; message: string }>(`/api/v1/publish/queue/${id}/retry`),
}

// ==================== 市场战略 API（✅ 后端已就绪）====================

export const marketsApi = {
  list: (params?: { page?: number; pageSize?: number; status?: MarketStatus; search?: string }) =>
    api.get<MarketListResponse>('/api/v1/markets', params),

  get: (asin: string) =>
    api.get<MarketOpportunity>(`/api/v1/markets/${asin}`),

  create: (data: CreateMarketDto) =>
    api.post<MarketOpportunity>('/api/v1/markets', data),

  fetch: (asin: string) =>
    api.post<MarketOpportunity>('/api/v1/markets/fetch', { asin }),

  updateStatus: (asin: string, status: MarketStatus) =>
    api.post<MarketOpportunity>(`/api/v1/markets/${asin}/status`, { status }),

  aiRecommend: () =>
    api.get<MarketOpportunity[]>('/api/v1/markets/ai-recommend'),

  getProducts: (asin: string) =>
    api.get<ProductContent[]>(`/api/v1/markets/${asin}/products`),
}

// ==================== 产品中心 API（✅ 后端已重构，可用）====================

export const newProductsApi = {
  list: (params?: { page?: number; pageSize?: number; status?: ProductStatus; type?: ProductType; search?: string }) =>
    api.get<ProductContentListResponse>('/api/v1/products', params),

  get: (id: number) =>
    api.get<ProductContent>(`/api/v1/products/${id}`),

  create: (data: CreateProductContentDto) =>
    api.post<ProductContent>('/api/v1/products', data),

  update: (id: number, data: UpdateProductContentDto) =>
    api.put<ProductContent>(`/api/v1/products/${id}`, data),

  delete: (id: number) =>
    api.delete<void>(`/api/v1/products/${id}`),

  review: (id: number, action: 'approve' | 'reject' | 'revision', comment?: string) =>
    api.post<ProductContent>(`/api/v1/products/${id}/review`, { action, comment }),

  linkMarkets: (id: number, marketIds: number[]) =>
    api.post<void>(`/api/v1/products/${id}/markets`, { marketIds }),

  generate: (data: GenerateContentDto) =>
    api.post<ProductContent>('/api/v1/products/generate', data),
}

// ==================== 营销中心 API（✅ 使用 /publish 路径）====================

export const marketingApi = {
  // 平台管理
  listPlatforms: () =>
    api.get<PlatformListResponse>('/api/v1/publish/platforms'),

  addPlatform: (data: AddPlatformDto) =>
    api.post<PublishPlatform>('/api/v1/publish/platforms', data),

  testPlatform: (id: number) =>
    api.post<{ success: boolean; message: string }>(`/api/v1/publish/platforms/${id}/test`),

  // 发布任务
  listTasks: (params?: { page?: number; pageSize?: number; status?: string }) =>
    api.get<MarketingTaskListResponse>('/api/v1/publish/tasks', params),

  createTask: (data: CreateMarketingTaskDto) =>
    api.post<MarketingTask>('/api/v1/publish/tasks', data),

  batchPublish: (data: BatchPublishDto) =>
    api.post<{ tasks: MarketingTask[]; success: number; failed: number }>('/api/v1/publish/tasks/batch', data),

  retryTask: (id: number) =>
    api.post<MarketingTask>(`/api/v1/publish/tasks/${id}/retry`),
}

// ==================== 数据分析 API ====================

export const analyticsApi = {
  overview: () =>
    api.get<AnalyticsOverview>('/api/v1/analytics/stats'),

  products: () =>
    api.get<ContentPerformance[]>('/api/v1/analytics/content-performance'),

  trends: (params?: { startDate?: string; endDate?: string }) =>
    api.get<AnalyticsTrendResponse>('/api/v1/analytics/trends', params),

  // ⚠️ 以下端点后端暂未实现，使用演示数据
  markets: () =>
    Promise.resolve({
      markets: [
        { asin: 'B0XXXXX', title: 'Demo Market 1', clicks: 1234, conversions: 45, revenue: '1234.56' },
        { asin: 'B0YYYYY', title: 'Demo Market 2', clicks: 987, conversions: 32, revenue: '987.65' },
      ]
    }),

  platforms: () =>
    Promise.resolve({
      platforms: [
        { name: 'Medium', published: 45, clicks: 567, conversions: 12 },
        { name: 'Blogger', published: 32, clicks: 234, conversions: 8 },
      ]
    }),
}
