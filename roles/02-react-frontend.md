# 任务卡: 02-React前端工程师

> **角色**: React前端工程师
> **项目**: Affi-Marketing 前端整合与功能开发
> **工期**: 10-14天
> **优先级**: 🔴 高
> **状态**: 🟡 进行中 (基础框架已完成，API集成待完成)

---

## 📋 当前状态

### ✅ 已完成 (第一阶段)
- [x] shadcn/ui 组件库安装
- [x] Zustand 状态管理
- [x] 统一侧边栏 (UnifiedSidebar)
- [x] 统一布局
- [x] 登录页面
- [x] Vue微应用占位页面
- [x] React原生页面 UI 框架 (products, materials, content, publish)
- [x] 路由保护

### ⏸️ 待完成 (第二阶段 - API集成)
- [ ] **博客页面开发** (blog, article-list)
- [ ] **API请求封装** (lib/api.ts)
- [ ] **产品管理页面** API集成
- [ ] **素材库页面** API集成
- [ ] **内容管理页面** API集成
- [ ] **发布中心页面** API集成

---

## 🎯 第二阶段任务：API集成与功能实现

### 任务8: 创建API请求封装 (Day 1)

**文件**: `frontend-unified/lib/api.ts`

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface ApiResponse<T> {
  success: boolean
  code: number
  message: string
  data: T
  timestamp: number
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
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
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
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
}

// 创建 API 客户端实例
export const api = new ApiClient(API_BASE)

// 产品 API
export const productsApi = {
  list: (params?: { page?: number; size?: number; search?: string }) =>
    api.get<ApiResponse<{ items: Product[]; total: number }>>('/api/v1/products', params),

  get: (id: string) =>
    api.get<ApiResponse<Product>>(`/api/v1/products/${id}`),

  create: (data: CreateProductDto) =>
    api.post<ApiResponse<Product>>('/api/v1/products', data),

  update: (id: string, data: UpdateProductDto) =>
    api.put<ApiResponse<Product>>(`/api/v1/products/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/v1/products/${id}`),
}

// 素材 API
export const materialsApi = {
  list: (params?: { page?: number; size?: number; type?: string }) =>
    api.get<ApiResponse<{ items: Material[]; total: number }>>('/api/v1/materials', params),

  upload: (formData: FormData) =>
    api.post<ApiResponse<Material>>('/api/v1/materials/upload', formData),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/v1/materials/${id}`),

  download: (id: string) => `${API_BASE}/api/v1/materials/${id}/download`,
}

// 内容 API
export const contentApi = {
  list: (params?: { page?: number; size?: number; status?: string }) =>
    api.get<ApiResponse<{ items: ContentItem[]; total: number }>>('/api/v1/content', params),

  get: (id: string) =>
    api.get<ApiResponse<ContentItem>>(`/api/v1/content/${id}`),

  create: (data: CreateContentDto) =>
    api.post<ApiResponse<ContentItem>>('/api/v1/content', data),

  update: (id: string, data: UpdateContentDto) =>
    api.put<ApiResponse<ContentItem>>(`/api/v1/content/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/v1/content/${id}`),

  publish: (id: string) =>
    api.post<ApiResponse<ContentItem>>(`/api/v1/content/${id}/publish`),
}

// 发布 API
export const publishApi = {
  list: (params?: { page?: number; size?: number; status?: string }) =>
    api.get<ApiResponse<{ items: PublishTask[]; total: number }>>('/api/v1/publish', params),

  create: (data: CreatePublishDto) =>
    api.post<ApiResponse<PublishTask>>('/api/v1/publish', data),

  execute: (id: string) =>
    api.post<ApiResponse<PublishResult>>(`/api/v1/publish/${id}/execute`),
}

// 类型定义
interface Product {
  id: string
  asin: string
  title: string
  status: 'active' | 'pending' | 'inactive'
  price?: number
  created_at: string
}

interface Material {
  id: string
  name: string
  type: 'image' | 'video' | 'document'
  url: string
  size: number
  created_at: string
}

interface ContentItem {
  id: string
  title: string
  type: 'article' | 'review' | 'comparison'
  status: 'draft' | 'published'
  created_at: string
}

interface PublishTask {
  id: string
  title: string
  platform: string
  status: 'pending' | 'publishing' | 'completed' | 'failed'
  created_at: string
}
```

### 任务9: 创建博客页面 (Day 1-2)

**博客首页**: `frontend-unified/app/blog/page.tsx`

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function BlogPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Affi-Marketing 博客</h1>
        <p className="text-muted-foreground">分享联盟营销、产品评测、行业洞察</p>
      </div>

      {/* 这里可以从 API 获取文章列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="aspect-video bg-muted mb-4 rounded" />
              <h3 className="font-semibold mb-2">文章标题 {i}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                文章摘要描述...
              </p>
              <Link href={`/blog/article/${i}`}>
                <Button variant="outline" size="sm">阅读更多</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

**文章列表页**: `frontend-unified/app/blog/list/page.tsx`

**文章详情页**: `frontend-unified/app/blog/article/[id]/page.tsx`

### 任务10: 产品管理页面 API 集成 (Day 2-3)

**更新**: `frontend-unified/app/(content)/products/page.tsx`

需要实现：
- [ ] 从 API 获取产品列表
- [ ] 搜索功能连接后端
- [ ] 添加产品按钮打开对话框
- [ ] 创建产品功能
- [ ] 编辑产品功能
- [ ] 删除产品功能

**参考实现**:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { productsApi, type Product } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // 获取产品列表
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await productsApi.list({ search })
      setProducts(response.data.items)
    } catch (error) {
      toast({ title: '错误', description: '获取产品列表失败', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // 创建产品
  const handleCreate = async (data: CreateProductDto) => {
    try {
      await productsApi.create(data)
      toast({ title: '成功', description: '产品已添加' })
      setDialogOpen(false)
      fetchProducts()
    } catch (error) {
      toast({ title: '错误', description: '添加产品失败', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>添加产品</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加产品</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleCreate} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>产品列表</CardTitle>
          <Input
            placeholder="搜索产品..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ASIN</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.asin}</TableCell>
                    <TableCell>{product.title}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status === 'active' ? '活跃' : '待审核'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 任务11: 素材库页面 API 集成 (Day 3-4)

**更新**: `frontend-unified/app/(content)/materials/page.tsx`

需要实现：
- [ ] 从 API 获取素材列表
- [ ] 文件上传功能
- [ ] 文件下载功能
- [ ] 删除素材功能
- [ ] 文件预览功能

### 任务12: 内容管理页面 API 集成 (Day 4-5)

**更新**: `frontend-unified/app/(content)/content/page.tsx`

需要实现：
- [ ] 从 API 获取内容列表
- [ ] 创建内容功能
- [ ] 编辑内容功能
- [ ] 删除内容功能
- [ ] 发布内容功能
- [ ] 富文本编辑器集成

### 任务13: 发布中心页面 API 集成 (Day 5-6)

**更新**: `frontend-unified/app/(content)/publish/page.tsx`

需要实现：
- [ ] 从 API 获取发布任务列表
- [ ] 创建发布任务功能
- [ ] 执行发布功能
- [ ] 查看发布状态

---

## 📁 需要创建的文件

```
frontend-unified/
├── lib/
│   └── api.ts                    ← [任务8] API 封装
│
├── app/
│   ├── blog/                     ← [任务9] 博客页面
│   │   ├── page.tsx
│   │   ├── list/
│   │   │   └── page.tsx
│   │   └── article/
│   │       └── [id]/
│   │           └── page.tsx
│   │
│   └── (content)/
│       ├── products/page.tsx    ← [任务10] 更新：API集成
│       ├── materials/page.tsx   ← [任务11] 更新：API集成
│       ├── content/page.tsx     ← [任务12] 更新：API集成
│       └── publish/page.tsx     ← [任务13] 更新：API集成
│
├── components/
│   └── ui/                       ← 需要额外安装的组件
│       ├── dialog.tsx            ← 对话框组件
│       ├── form.tsx              ← 表单组件
│       ├── textarea.tsx          ← 文本域组件
│       └── toast.tsx             ← 提示组件
│
└── hooks/
    └── use-toast.ts             ← Toast Hook
```

---

## 🔧 安装额外组件

```bash
cd frontend-unified

# 安装需要的 shadcn/ui 组件
npx shadcn@latest add dialog form textarea toast toast

# 安装其他依赖
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
```

---

## ✅ 完成标准 (第二阶段)

### API 集成
- [ ] API 客户端封装完成
- [ ] 产品管理页面连接后端 API
- [ ] 素材库页面连接后端 API
- [ ] 内容管理页面连接后端 API
- [ ] 发布中心页面连接后端 API

### 功能实现
- [ ] 产品 CRUD 功能完整
- [ ] 素材上传/下载功能完整
- [ ] 内容创建/编辑/发布功能完整
- [ ] 发布任务管理功能完整

### 博客功能
- [ ] 博客首页可访问
- [ ] 文章列表页可访问
- [ ] 文章详情页可访问

### 交互体验
- [ ] 所有按钮有响应
- [ ] 表单验证正常
- [ ] 错误提示友好
- [ ] 加载状态清晰

---

## 📝 更新说明

### v2.0 → v3.0 变更

**新增任务**:
- 任务8: 创建 API 请求封装
- 任务9: 创建博客页面
- 任务10-13: 各页面 API 集成

**预计工期**: 10-14 天 (原 7-10 天)

---

**任务卡版本**: v3.0
**创建时间**: 2026-03-05
**更新时间**: 2026-03-05 (第二阶段任务添加)

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/02-react-frontend.md"
