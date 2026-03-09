# Material Library + AI Content Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a material library system for storing product content sources and an AI-assisted content creation feature with streaming output.

**Architecture:** Materials are stored independently and linked to markets (one-to-one). AI creation uses Vercel AI SDK with streaming to generate content section-by-section based on selected materials.

**Tech Stack:** Go + GORM (backend), Next.js + Vercel AI SDK (frontend), youtube-transcript (npm), @ai-sdk/openai-compatible + ZhipuAI

---

## Phase 1: Database & Backend API

### Task 1: Create Materials Table Migration

**Files:**
- Create: `backend-go/migrations/008_materials.sql`

**Step 1: Write the migration file**

```sql
-- 008_materials.sql
-- 素材库表

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,  -- product_intro, user_review, youtube_review, attachment
    content TEXT,
    source_url VARCHAR(500),
    file_path VARCHAR(500),
    file_name VARCHAR(200),
    file_size BIGINT DEFAULT 0,
    market_id INTEGER NOT NULL REFERENCES market_opportunities(id) ON DELETE CASCADE,
    word_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_materials_type ON materials(type);
CREATE INDEX idx_materials_market_id ON materials(market_id);

-- Comment
COMMENT ON TABLE materials IS '素材库 - 存储产品介绍、用户评论、YouTube评测等素材';
```

**Step 2: Run migration**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
# Connect to PostgreSQL and run migration
psql -h localhost -U postgres -d affi_marketing -f migrations/008_materials.sql
```

**Step 3: Verify table created**

```bash
psql -h localhost -U postgres -d affi_marketing -c "\d materials"
```
Expected: Table structure displayed

**Step 4: Commit**

```bash
git add migrations/008_materials.sql
git commit -m "feat(db): add materials table migration"
```

---

### Task 2: Create Material Model

**Files:**
- Create: `backend-go/internal/model/content/material.go`

**Step 1: Write the model file**

```go
package content

import "time"

// MaterialType 素材类型
type MaterialType string

const (
	MaterialTypeProductIntro  MaterialType = "product_intro"
	MaterialTypeUserReview    MaterialType = "user_review"
	MaterialTypeYouTubeReview MaterialType = "youtube_review"
	MaterialTypeAttachment    MaterialType = "attachment"
)

// Material 素材
type Material struct {
	ID         int          `json:"id" gorm:"primaryKey;autoIncrement"`
	Title      string       `json:"title" gorm:"size:200;not null"`
	Type       MaterialType `json:"type" gorm:"size:20;not null;index"`
	Content    string       `json:"content" gorm:"type:text"`
	SourceURL  string       `json:"sourceUrl" gorm:"size:500"`
	FilePath   string       `json:"filePath" gorm:"size:500"`
	FileName   string       `json:"fileName" gorm:"size:200"`
	FileSize   int64        `json:"fileSize" gorm:"default:0"`
	MarketID   int          `json:"marketId" gorm:"not null;index"`
	WordCount  int          `json:"wordCount" gorm:"default:0"`
	Metadata   string       `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	CreatedAt  time.Time    `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt  time.Time    `json:"updatedAt" gorm:"autoUpdateTime"`
	// 关联
	Market     *MarketOpportunity `json:"market,omitempty" gorm:"foreignKey:MarketID"`
}

// TableName 指定表名
func (Material) TableName() string {
	return "materials"
}

// MaterialMetadata 素材元数据
type MaterialMetadata struct {
	VideoID      string `json:"videoId,omitempty"`      // YouTube视频ID
	VideoTitle   string `json:"videoTitle,omitempty"`   // 视频标题
	ChannelName  string `json:"channelName,omitempty"`  // 频道名称
	Duration     int    `json:"duration,omitempty"`     // 时长(秒)
}
```

**Step 2: Commit**

```bash
git add internal/model/content/material.go
git commit -m "feat(model): add Material model"
```

---

### Task 3: Create Materials Controller

**Files:**
- Create: `backend-go/internal/controller/content/materials.go`

**Step 1: Write the controller file**

```go
package content

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// MaterialsController 素材控制器
type MaterialsController struct {
	db *gorm.DB
}

// NewMaterialsController 创建素材控制器
func NewMaterialsController(db *gorm.DB) *MaterialsController {
	return &MaterialsController{db: db}
}

// ============================================================================
// DTOs
// ============================================================================

// ListMaterialsRequest 素材列表请求
type ListMaterialsRequest struct {
	Type     string `form:"type"`
	MarketID int    `form:"marketId"`
	Search   string `form:"search"`
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=100"`
}

// ListMaterialsResponse 素材列表响应
type ListMaterialsResponse struct {
	Materials []content.Material `json:"materials"`
	Total     int64              `json:"total"`
	Page      int                `json:"page"`
	PageSize  int                `json:"pageSize"`
}

// CreateMaterialRequest 创建素材请求
type CreateMaterialRequest struct {
	Title     string             `json:"title" binding:"required,max=200"`
	Type      content.MaterialType ` `json:"type" binding:"required,oneof=product_intro user_review youtube_review attachment"`
	Content   string             `json:"content"`
	SourceURL string             `json:"sourceUrl" binding:"max=500"`
	FilePath  string             `json:"filePath"`
	FileName  string             `json:"fileName"`
	FileSize  int64              `json:"fileSize"`
	MarketID  int                `json:"marketId" binding:"required"`
	Metadata  string             `json:"metadata"`
}

// UpdateMaterialRequest 更新素材请求
type UpdateMaterialRequest struct {
	Title     *string              `json:"title" binding:"omitempty,max=200"`
	Content   *string              `json:"content"`
	SourceURL *string              `json:"sourceUrl" binding:"omitempty,max=500"`
	Metadata  *string              `json:"metadata"`
}

// ============================================================================
// Routes
// ============================================================================

// RegisterRoutes 注册路由
func (c *MaterialsController) RegisterRoutes(router *gin.RouterGroup) {
	materials := router.Group("/materials")
	{
		materials.GET("", c.List)
		materials.POST("", c.Create)
		materials.GET("/:id", c.Get)
		materials.PUT("/:id", c.Update)
		materials.DELETE("/:id", c.Delete)
		materials.GET("/by-market/:marketId", c.ListByMarket)
	}
}

// ============================================================================
// Handlers
// ============================================================================

// List 获取素材列表
func (c *MaterialsController) List(ctx *gin.Context) {
	var req ListMaterialsRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	query := c.db.Model(&content.Material{})

	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}
	if req.MarketID > 0 {
		query = query.Where("market_id = ?", req.MarketID)
	}
	if req.Search != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count materials", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count materials"})
		return
	}

	var materials []content.Material
	offset := (req.Page - 1) * req.PageSize
	if err := query.Preload("Market").Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&materials).Error; err != nil {
		logger.Error("Failed to list materials", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list materials"})
		return
	}

	ctx.JSON(http.StatusOK, ListMaterialsResponse{
		Materials: materials,
		Total:     total,
		Page:      req.Page,
		PageSize:  req.PageSize,
	})
}

// Get 获取单个素材
func (c *MaterialsController) Get(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid material ID"})
		return
	}

	var material content.Material
	if err := c.db.Preload("Market").First(&material, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get material"})
		return
	}

	ctx.JSON(http.StatusOK, material)
}

// Create 创建素材
func (c *MaterialsController) Create(ctx *gin.Context) {
	var req CreateMaterialRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 验证市场是否存在
	var market content.MarketOpportunity
	if err := c.db.First(&market, req.MarketID).Error; err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Market not found"})
		return
	}

	material := content.Material{
		Title:     req.Title,
		Type:      req.Type,
		Content:   req.Content,
		SourceURL: req.SourceURL,
		FilePath:  req.FilePath,
		FileName:  req.FileName,
		FileSize:  req.FileSize,
		MarketID:  req.MarketID,
		Metadata:  req.Metadata,
		WordCount: len(req.Content),
	}

	if err := c.db.Create(&material).Error; err != nil {
		logger.Error("Failed to create material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create material"})
		return
	}

	logger.Info("Material created", zap.Int("id", material.ID))
	ctx.JSON(http.StatusCreated, material)
}

// Update 更新素材
func (c *MaterialsController) Update(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid material ID"})
		return
	}

	var req UpdateMaterialRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var material content.Material
	if err := c.db.First(&material, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get material"})
		return
	}

	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Content != nil {
		updates["content"] = *req.Content
		updates["word_count"] = len(*req.Content)
	}
	if req.SourceURL != nil {
		updates["source_url"] = *req.SourceURL
	}
	if req.Metadata != nil {
		updates["metadata"] = *req.Metadata
	}

	if err := c.db.Model(&material).Updates(updates).Error; err != nil {
		logger.Error("Failed to update material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material"})
		return
	}

	c.db.Preload("Market").First(&material, id)
	ctx.JSON(http.StatusOK, material)
}

// Delete 删除素材
func (c *MaterialsController) Delete(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid material ID"})
		return
	}

	result := c.db.Delete(&content.Material{}, id)
	if result.Error != nil {
		logger.Error("Failed to delete material", zap.Error(result.Error))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete material"})
		return
	}

	if result.RowsAffected == 0 {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Material deleted successfully"})
}

// ListByMarket 按市场获取素材
func (c *MaterialsController) ListByMarket(ctx *gin.Context) {
	marketID, err := strconv.Atoi(ctx.Param("marketId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid market ID"})
		return
	}

	var materials []content.Material
	if err := c.db.Where("market_id = ?", marketID).Order("created_at DESC").Find(&materials).Error; err != nil {
		logger.Error("Failed to list materials by market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list materials"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"materials": materials,
		"total":     len(materials),
	})
}
```

**Step 2: Commit**

```bash
git add internal/controller/content/materials.go
git commit -m "feat(api): add materials controller with CRUD endpoints"
```

---

### Task 4: Register Materials Controller

**Files:**
- Modify: `backend-go/internal/controller/content/register.go`

**Step 1: Add materials controller registration**

Find the registration function and add:

```go
// 在 RegisterAllControllers 函数中添加
materialsController := NewMaterialsController(db)
materialsController.RegisterRoutes(apiGroup)
```

**Step 2: Verify by checking the file structure**

```bash
grep -n "MaterialsController\|materialsController" backend-go/internal/controller/content/register.go
```

**Step 3: Commit**

```bash
git add internal/controller/content/register.go
git commit -m "feat(api): register materials controller"
```

---

### Task 5: Update Frontend API Types

**Files:**
- Modify: `frontend-unified/lib/api.ts`

**Step 1: Add Material types and API**

Add to the existing api.ts file:

```typescript
// ============================================================
// Material Types
// ============================================================

export type MaterialType = 'product_intro' | 'user_review' | 'youtube_review' | 'attachment'

export interface Material {
  id: number
  title: string
  type: MaterialType
  content: string
  sourceUrl?: string
  filePath?: string
  fileName?: string
  fileSize: number
  marketId: number
  market?: MarketOpportunity
  wordCount: number
  metadata?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMaterialRequest {
  title: string
  type: MaterialType
  content?: string
  sourceUrl?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  marketId: number
  metadata?: string
}

export interface UpdateMaterialRequest {
  title?: string
  content?: string
  sourceUrl?: string
  metadata?: string
}

export interface ListMaterialsParams {
  type?: MaterialType
  marketId?: number
  search?: string
  page?: number
  pageSize?: number
}

export interface ListMaterialsResponse {
  materials: Material[]
  total: number
  page: number
  pageSize: number
}

// ============================================================
// Materials API
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const materialsApi = {
  list: async (params: ListMaterialsParams = {}): Promise<ListMaterialsResponse> => {
    const searchParams = new URLSearchParams()
    if (params.type) searchParams.set('type', params.type)
    if (params.marketId) searchParams.set('marketId', String(params.marketId))
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize))

    const response = await fetch(`${API_URL}/api/v1/materials?${searchParams}`)
    if (!response.ok) throw new Error('Failed to fetch materials')
    return response.json()
  },

  get: async (id: number): Promise<Material> => {
    const response = await fetch(`${API_URL}/api/v1/materials/${id}`)
    if (!response.ok) throw new Error('Failed to fetch material')
    return response.json()
  },

  create: async (data: CreateMaterialRequest): Promise<Material> => {
    const response = await fetch(`${API_URL}/api/v1/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create material')
    return response.json()
  },

  update: async (id: number, data: UpdateMaterialRequest): Promise<Material> => {
    const response = await fetch(`${API_URL}/api/v1/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update material')
    return response.json()
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/v1/materials/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete material')
  },

  listByMarket: async (marketId: number): Promise<Material[]> => {
    const response = await fetch(`${API_URL}/api/v1/materials/by-market/${marketId}`)
    if (!response.ok) throw new Error('Failed to fetch materials')
    const data = await response.json()
    return data.materials
  },
}
```

**Step 2: Commit**

```bash
git add lib/api.ts
git commit -m "feat(api): add Material types and materials API client"
```

---

## Phase 2: Frontend Materials UI

### Task 6: Create Materials List Page

**Files:**
- Create: `frontend-unified/app/(content)/materials/page.tsx`

**Step 1: Create the page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, type Material, type MaterialType } from '@/lib/api'
import {
  Plus,
  Search,
  FileText,
  MessageSquare,
  Youtube,
  Paperclip,
  Trash2,
  Edit,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

const typeConfig: Record<MaterialType, { label: string; icon: React.ReactNode; color: string }> = {
  product_intro: { label: '产品介绍', icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  user_review: { label: '用户评论', icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  youtube_review: { label: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  attachment: { label: '附件', icon: <Paperclip className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const { toast } = useToast()

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const response = await materialsApi.list({
        type: typeFilter !== 'all' ? typeFilter as MaterialType : undefined,
        search: search || undefined,
        page,
        pageSize: 20,
      })
      setMaterials(response.materials)
      setTotal(response.total)
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      toast({ title: '加载失败', description: '无法加载素材列表', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [page, typeFilter])

  const handleSearch = () => {
    setPage(1)
    fetchMaterials()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个素材吗？')) return
    try {
      await materialsApi.delete(id)
      toast({ title: '删除成功', description: '素材已删除' })
      fetchMaterials()
    } catch (error) {
      toast({ title: '删除失败', description: '无法删除素材', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">素材库</h1>
          <p className="text-muted-foreground">管理产品介绍、用户评论、YouTube评测等素材</p>
        </div>
        <Link href="/materials/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建素材
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="product_intro">产品介绍</SelectItem>
            <SelectItem value="user_review">用户评论</SelectItem>
            <SelectItem value="youtube_review">YouTube</SelectItem>
            <SelectItem value="attachment">附件</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1 flex gap-2">
          <Input
            placeholder="搜索素材..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="outline" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无素材，点击"新建素材"开始创建
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <Card key={material.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                <Badge className={typeConfig[material.type].color}>
                  {typeConfig[material.type].icon}
                  <span className="ml-1">{typeConfig[material.type].label}</span>
                </Badge>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{material.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {material.market?.title || `市场ID: ${material.marketId}`}
                    {' · '}
                    {material.wordCount > 0 ? `${material.wordCount} 字` : material.fileName || '无内容'}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link href={`/materials/${material.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="py-2 px-4">
            {page} / {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            disabled={page * 20 >= total}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(content\)/materials/page.tsx
git commit -m "feat(ui): add materials list page"
```

---

### Task 7: Create Material Form Component

**Files:**
- Create: `frontend-unified/components/materials/material-form.tsx`

**Step 1: Create the form component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { marketsApi, type MarketOpportunity, type MaterialType } from '@/lib/api'
import { Loader2, Upload, Youtube } from 'lucide-react'

interface MaterialFormProps {
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  isEditing?: boolean
}

export function MaterialForm({ onSubmit, initialData, isEditing = false }: MaterialFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [type, setType] = useState<MaterialType>(initialData?.type || 'product_intro')
  const [content, setContent] = useState(initialData?.content || '')
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '')
  const [marketId, setMarketId] = useState<number | null>(initialData?.marketId || null)
  const [markets, setMarkets] = useState<MarketOpportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [marketsLoading, setMarketsLoading] = useState(true)
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchMarkets()
  }, [])

  const fetchMarkets = async () => {
    try {
      const response = await marketsApi.list({})
      setMarkets(response.markets || [])
    } catch (error) {
      console.error('Failed to fetch markets:', error)
    } finally {
      setMarketsLoading(false)
    }
  }

  const handleYoutubeTranscript = async () => {
    if (!sourceUrl) {
      toast({ title: '请输入YouTube链接', variant: 'destructive' })
      return
    }

    setYoutubeLoading(true)
    try {
      const response = await fetch('/api/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transcript')
      }

      const data = await response.json()
      setContent(data.transcript)
      if (!title && data.videoTitle) {
        setTitle(data.videoTitle)
      }
      toast({ title: '字幕获取成功', description: `共 ${data.transcript.length} 字符` })
    } catch (error) {
      toast({ title: '获取失败', description: '无法获取视频字幕，请确认链接正确或视频有字幕', variant: 'destructive' })
    } finally {
      setYoutubeLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!marketId) {
      toast({ title: '请选择关联市场', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      let filePath = initialData?.filePath
      let fileName = initialData?.fileName
      let fileSize = initialData?.fileSize

      // Handle file upload if needed
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        // TODO: Implement file upload API
        // const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData })
        // const uploadData = await uploadResponse.json()
        // filePath = uploadData.path
        fileName = file.name
        fileSize = file.size
      }

      await onSubmit({
        title,
        type,
        content,
        sourceUrl: type === 'youtube_review' ? sourceUrl : undefined,
        filePath,
        fileName,
        fileSize,
        marketId,
      })

      toast({ title: isEditing ? '更新成功' : '创建成功' })
    } catch (error) {
      toast({ title: '操作失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Selection */}
      <div className="space-y-2">
        <Label>素材类型</Label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: 'product_intro', label: '产品介绍', icon: '📄' },
            { value: 'user_review', label: '用户评论', icon: '💬' },
            { value: 'youtube_review', label: 'YouTube', icon: '🎬' },
            { value: 'attachment', label: '文件', icon: '📎' },
          ].map((t) => (
            <Button
              key={t.value}
              type="button"
              variant={type === t.value ? 'default' : 'outline'}
              onClick={() => setType(t.value as MaterialType)}
              className="justify-start"
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Market Selection */}
      <div className="space-y-2">
        <Label>关联市场 *</Label>
        <Select
          value={marketId?.toString() || ''}
          onValueChange={(v) => setMarketId(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="搜索或选择产品..." />
          </SelectTrigger>
          <SelectContent>
            {marketsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              markets.map((market) => (
                <SelectItem key={market.id} value={market.id.toString()}>
                  {market.title}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>标题</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="素材标题"
          required
        />
      </div>

      {/* YouTube URL */}
      {type === 'youtube_review' && (
        <div className="space-y-2">
          <Label>YouTube 链接</Label>
          <div className="flex gap-2">
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleYoutubeTranscript}
              disabled={youtubeLoading}
            >
              {youtubeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4" />
              )}
              获取字幕
            </Button>
          </div>
        </div>
      )}

      {/* File Upload */}
      {type === 'attachment' && (
        <div className="space-y-2">
          <Label>上传文件</Label>
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                选择文件
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".txt,.pdf,.doc,.docx"
                />
              </label>
            </Button>
            {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
            {initialData?.fileName && !file && (
              <span className="text-sm text-muted-foreground">{initialData.fileName}</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {(type === 'product_intro' || type === 'user_review' || type === 'youtube_review') && (
        <div className="space-y-2">
          <Label>内容</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="粘贴或输入内容..."
            rows={10}
          />
          <p className="text-xs text-muted-foreground text-right">
            {content.length} 字符
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? '更新' : '创建'}
        </Button>
      </div>
    </form>
  )
}
```

**Step 2: Commit**

```bash
git add components/materials/material-form.tsx
git commit -m "feat(ui): add material form component"
```

---

### Task 8: Create Materials Create Page

**Files:**
- Create: `frontend-unified/app/(content)/materials/create/page.tsx`

**Step 1: Create the page**

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { MaterialForm } from '@/components/materials/material-form'
import { materialsApi } from '@/lib/api'

export default function CreateMaterialPage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    await materialsApi.create(data)
    router.push('/materials')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">新建素材</h1>
        <p className="text-muted-foreground">创建新的内容素材</p>
      </div>

      <MaterialForm onSubmit={handleSubmit} />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(content\)/materials/create/page.tsx
git commit -m "feat(ui): add materials create page"
```

---

### Task 9: Add Sidebar Entry for Materials

**Files:**
- Modify: `frontend-unified/components/layout/sidebar.tsx` (or similar sidebar component)

**Step 1: Add materials entry to navigation**

Find the navigation items array and add:

```tsx
{
  name: '素材库',
  href: '/materials',
  icon: FolderOpen,  // or appropriate icon
}
```

**Step 2: Commit**

```bash
git add components/layout/sidebar.tsx
git commit -m "feat(ui): add materials to sidebar navigation"
```

---

## Phase 3: YouTube Transcript API

### Task 10: Install youtube-transcript Package

**Step 1: Install package**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm install youtube-transcript
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add youtube-transcript package"
```

---

### Task 11: Create YouTube Transcript API Route

**Files:**
- Create: `frontend-unified/app/api/youtube/transcript/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { YoutubeTranscript } from 'youtube-transcript'

function extractVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const videoId = extractVideoId(url)

    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId)

    // Combine transcript segments into full text
    const fullText = transcript.map((item) => item.text).join(' ')

    // Get video info from the first few segments or metadata
    const videoTitle = `YouTube视频字幕 - ${videoId}`

    return NextResponse.json({
      success: true,
      videoId,
      videoTitle,
      transcript: fullText,
      segments: transcript.length,
      duration: transcript.length > 0 ? transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration : 0,
    })
  } catch (error: any) {
    console.error('YouTube transcript error:', error)

    // Handle specific errors
    if (error.message?.includes('Could not find')) {
      return NextResponse.json(
        { error: '该视频没有可用的字幕' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: '获取字幕失败，请确认视频链接正确且有字幕' },
      { status: 500 }
    )
  }
}
```

**Step 2: Commit**

```bash
git add app/api/youtube/transcript/route.ts
git commit -m "feat(api): add YouTube transcript extraction endpoint"
```

---

## Phase 4: AI Content Generation

### Task 12: Install Vercel AI SDK

**Step 1: Install packages**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm install ai @ai-sdk/openai-compatible
```

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add Vercel AI SDK packages"
```

---

### Task 13: Create AI Generation API Route

**Files:**
- Create: `frontend-unified/app/api/ai/generate/stream/route.ts`

**Step 1: Create the streaming API route**

```typescript
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const zhipu = createOpenAICompatible({
  name: 'zhipu',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.ZHIPU_API_KEY,
})

const SYSTEM_PROMPT = `你是一位专业的产品内容创作者，擅长撰写产品评测、购买指南和对比分析文章。

写作原则：
1. 客观真实，基于提供的素材进行分析
2. 语言简洁流畅，避免过度营销
3. 结构清晰，易于阅读
4. 包含具体数据和细节
5. 给出实用的购买建议

格式要求：
- 使用 Markdown 格式
- 每个段落使用适当的标题
- 列表使用 - 或 1. 2. 3. 格式
- 重点内容使用 **加粗**`

interface Material {
  title: string
  type: string
  content: string
}

interface Section {
  id: string
  name: string
  description: string
}

const SECTION_PROMPTS: Record<string, string> = {
  intro: `撰写一个吸引人的开头引言，简要介绍产品和本文要讨论的内容。控制在150-200字。`,
  product_intro: `详细介绍产品的核心功能、技术特点和规格参数。使用列表形式呈现主要特点。控制在300-400字。`,
  user_reviews: `基于用户评论素材，总结用户的真实反馈。包括正面评价和负面评价，保持客观。控制在300-400字。`,
  pros_cons: `列出产品的主要优点和缺点，使用对比列表形式。每列3-5条。`,
  buying_advice: `给出购买建议，包括适合人群、价格分析、最佳购买时机等。控制在200-300字。`,
  conclusion: `总结全文，给出推荐指数和最终建议。控制在100-150字。`,
}

export async function POST(request: Request) {
  try {
    const { materials, sections, contentType, productTitle } = await request.json()

    if (!materials || materials.length === 0) {
      return new Response(JSON.stringify({ error: '请选择至少一个素材' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!sections || sections.length === 0) {
      return new Response(JSON.stringify({ error: '请选择至少一个段落' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build materials context
    const materialsContext = materials.map((m: Material) => `
【${m.type === 'product_intro' ? '产品介绍' : m.type === 'user_review' ? '用户评论' : m.type === 'youtube_review' ? 'YouTube评测' : '素材'}】${m.title}
${m.content}
`).join('\n---\n')

    // Build sections prompt
    const sectionsPrompt = sections.map((s: Section) => `
### ${s.name}
${SECTION_PROMPTS[s.id] || s.description}
`).join('\n')

    const userPrompt = `产品名称：${productTitle}

可用素材：
${materialsContext}

请根据以上素材，撰写以下段落：
${sectionsPrompt}

请按顺序生成每个段落，段落之间用 "---SECTION---" 分隔。`

    const result = streamText({
      model: zhipu('glm-4-flash'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 4000,
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('AI generation error:', error)
    return new Response(JSON.stringify({ error: error.message || 'AI生成失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

**Step 2: Add environment variable**

Create or update `.env.local`:

```env
ZHIPU_API_KEY=your_zhipu_api_key_here
```

**Step 3: Commit**

```bash
git add app/api/ai/generate/stream/route.ts .env.local.example
git commit -m "feat(ai): add streaming AI generation endpoint"
```

---

### Task 14: Create AI Create Page Component

**Files:**
- Create: `frontend-unified/app/(content)/products/ai-create/page.tsx`

**Step 1: Create the page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { materialsApi, productsApi, type Material, type MaterialType } from '@/lib/api'
import {
  Loader2,
  FileText,
  MessageSquare,
  Youtube,
  Paperclip,
  Sparkles,
  RefreshCw,
  Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const SECTIONS = [
  { id: 'intro', name: '开头引言', description: '吸引读者注意力' },
  { id: 'product_intro', name: '产品介绍', description: '核心功能和特点' },
  { id: 'user_reviews', name: '用户评价', description: '真实用户反馈' },
  { id: 'pros_cons', name: '优缺点对比', description: '客观分析' },
  { id: 'buying_advice', name: '购买建议', description: '适合人群和价格分析' },
  { id: 'conclusion', name: '结尾总结', description: '推荐指数' },
]

const CONTENT_TYPES = [
  { id: 'review', name: '产品评测', icon: '📝' },
  { id: 'guide', name: '购买指南', icon: '📖' },
  { id: 'comparison', name: '对比分析', icon: '🔍' },
]

const typeConfig: Record<MaterialType, { icon: React.ReactNode; color: string }> = {
  product_intro: { icon: <FileText className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  user_review: { icon: <MessageSquare className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  youtube_review: { icon: <Youtube className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  attachment: { icon: <Paperclip className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
}

export default function AICreatePage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<number[]>([])
  const [selectedSections, setSelectedSections] = useState<string[]>(['intro', 'product_intro', 'user_reviews', 'buying_advice'])
  const [contentType, setContentType] = useState('review')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const response = await materialsApi.list({ pageSize: 100 })
      setMaterials(response.materials)
    } catch (error) {
      toast({ title: '加载失败', description: '无法加载素材列表', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleMaterial = (id: number) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleGenerate = async () => {
    if (selectedMaterials.length === 0) {
      toast({ title: '请选择素材', variant: 'destructive' })
      return
    }

    if (selectedSections.length === 0) {
      toast({ title: '请选择段落', variant: 'destructive' })
      return
    }

    setGenerating(true)
    setStreamingContent('')
    setGeneratedContent('')

    const selectedMaterialData = materials.filter((m) => selectedMaterials.includes(m.id))
    const selectedSectionData = SECTIONS.filter((s) => selectedSections.includes(s.id))
    const productTitle = selectedMaterialData[0]?.market?.title || '产品'

    try {
      const response = await fetch('/api/ai/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: selectedMaterialData,
          sections: selectedSectionData,
          contentType,
          productTitle,
        }),
      })

      if (!response.ok) {
        throw new Error('AI generation failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        fullContent += chunk
        setStreamingContent(fullContent)
      }

      setGeneratedContent(fullContent)
      toast({ title: '生成完成' })
    } catch (error) {
      toast({ title: '生成失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!generatedContent) {
      toast({ title: '没有可保存的内容', variant: 'destructive' })
      return
    }

    const firstMaterial = materials.find((m) => selectedMaterials.includes(m.id))

    try {
      await productsApi.create({
        slug: `ai-generated-${Date.now()}`,
        title: firstMaterial?.market?.title || 'AI生成内容',
        type: contentType as any,
        content: generatedContent,
        excerpt: generatedContent.substring(0, 200),
        status: 'draft',
      })

      toast({ title: '已保存为草稿', description: '可在产品中心查看' })
      router.push('/products')
    } catch (error) {
      toast({ title: '保存失败', variant: 'destructive' })
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Panel - Selection */}
      <div className="col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">选择素材</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : materials.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无素材，请先创建素材
              </p>
            ) : (
              materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => toggleMaterial(material.id)}
                >
                  <Checkbox
                    checked={selectedMaterials.includes(material.id)}
                    onCheckedChange={() => toggleMaterial(material.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={typeConfig[material.type].color}>
                        {typeConfig[material.type].icon}
                      </Badge>
                      <span className="text-sm font-medium truncate">{material.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {material.wordCount} 字
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">内容类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map((type) => (
                <Button
                  key={type.id}
                  variant={contentType === type.id ? 'default' : 'outline'}
                  onClick={() => setContentType(type.id)}
                  className="justify-start"
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">选择段落</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {SECTIONS.map((section) => (
              <div
                key={section.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <Checkbox
                  checked={selectedSections.includes(section.id)}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <div>
                  <p className="text-sm font-medium">{section.name}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generating || selectedMaterials.length === 0}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              开始生成
            </>
          )}
        </Button>
      </div>

      {/* Right Panel - Preview */}
      <div className="col-span-8">
        <Card className="h-full">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">生成结果</CardTitle>
            {generatedContent && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </Button>
                <Button size="sm" onClick={handleSaveDraft}>
                  <Check className="h-4 w-4 mr-1" />
                  保存为草稿
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!generating && !generatedContent && !streamingContent ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4" />
                <p>选择素材和段落后，点击"开始生成"</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <Textarea
                  value={generating ? streamingContent : generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  className="min-h-[600px] font-mono text-sm"
                  placeholder="AI生成的内容将在这里显示..."
                  readOnly={generating}
                />
                <p className="text-xs text-muted-foreground text-right mt-2">
                  {(generating ? streamingContent : generatedContent).length} 字符
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/\(content\)/products/ai-create/page.tsx
git commit -m "feat(ai): add AI-assisted content creation page"
```

---

### Task 15: Add AI Create Link to Products Page

**Files:**
- Modify: `frontend-unified/app/(content)/products/page.tsx`

**Step 1: Add AI create button**

Find the header section and add:

```tsx
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

// In the header area, add:
<Link href="/products/ai-create">
  <Button>
    <Sparkles className="h-4 w-4 mr-2" />
    AI辅助创作
  </Button>
</Link>
```

**Step 2: Commit**

```bash
git add app/\(content\)/products/page.tsx
git commit -m "feat(ui): add AI create button to products page"
```

---

## Phase 5: Market Strategy Integration

### Task 16: Create Save Material Dialog for Strategy Page

**Files:**
- Create: `frontend-unified/components/materials/save-material-dialog.tsx`

**Step 1: Create the dialog component**

```tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { materialsApi } from '@/lib/api'
import { Loader2, FileText, MessageSquare, Youtube } from 'lucide-react'

interface SaveMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  market: {
    id: number
    asin: string
    title: string
    price?: string
    rating?: string
    reviewCount?: number
    aiReason?: string
  }
  productIntro?: string
  userReviews?: string
}

export function SaveMaterialDialog({
  open,
  onOpenChange,
  market,
  productIntro,
  userReviews,
}: SaveMaterialDialogProps) {
  const [saveProductInfo, setSaveProductInfo] = useState(true)
  const [saveAIAnalysis, setSaveAIAnalysis] = useState(true)
  const [saveUserReviews, setSaveUserReviews] = useState(false)
  const [customProductIntro, setCustomProductIntro] = useState('')
  const [customUserReviews, setCustomUserReviews] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setLoading(true)

    try {
      const materialsToCreate = []

      // Save product info
      if (saveProductInfo) {
        const content = productIntro || customProductIntro || `
产品名称：${market.title}
ASIN：${market.asin}
价格：${market.price || 'N/A'}
评分：${market.rating || 'N/A'}
评论数：${market.reviewCount || 'N/A'}
        `.trim()

        materialsToCreate.push({
          title: `${market.title} - 产品信息`,
          type: 'product_intro' as const,
          content,
          marketId: market.id,
        })
      }

      // Save AI analysis
      if (saveAIAnalysis && market.aiReason) {
        materialsToCreate.push({
          title: `${market.title} - AI分析`,
          type: 'product_intro' as const,
          content: market.aiReason,
          marketId: market.id,
        })
      }

      // Save user reviews
      if (saveUserReviews && (userReviews || customUserReviews)) {
        materialsToCreate.push({
          title: `${market.title} - 用户评论`,
          type: 'user_review' as const,
          content: userReviews || customUserReviews,
          marketId: market.id,
        })
      }

      // Save YouTube
      if (youtubeUrl) {
        // Get transcript first
        const transcriptResponse = await fetch('/api/youtube/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl }),
        })

        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json()
          materialsToCreate.push({
            title: `${market.title} - YouTube评测`,
            type: 'youtube_review' as const,
            content: transcriptData.transcript,
            sourceUrl: youtubeUrl,
            marketId: market.id,
          })
        }
      }

      // Create all materials
      for (const material of materialsToCreate) {
        await materialsApi.create(material)
      }

      toast({
        title: '保存成功',
        description: `已保存 ${materialsToCreate.length} 个素材`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>保存为素材</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            选择要保存到素材库的内容：
          </p>

          {/* Product Info */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              checked={saveProductInfo}
              onCheckedChange={(checked) => setSaveProductInfo(checked as boolean)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <Label className="font-medium">产品基础信息</Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {market.title} | {market.price} | ⭐ {market.rating}
              </p>
            </div>
          </div>

          {/* AI Analysis */}
          {market.aiReason && (
            <div className="flex items-start gap-3 p-3 rounded-lg border">
              <Checkbox
                checked={saveAIAnalysis}
                onCheckedChange={(checked) => setSaveAIAnalysis(checked as boolean)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <Label className="font-medium">AI分析结果</Label>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {market.aiReason}
                </p>
              </div>
            </div>
          )}

          {/* User Reviews */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              checked={saveUserReviews}
              onCheckedChange={(checked) => setSaveUserReviews(checked as boolean)}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                <Label className="font-medium">用户评论</Label>
              </div>
              {saveUserReviews && (
                <Textarea
                  value={customUserReviews}
                  onChange={(e) => setCustomUserReviews(e.target.value)}
                  placeholder="粘贴用户评论内容..."
                  className="mt-2 text-sm"
                  rows={4}
                />
              )}
            </div>
          </div>

          {/* YouTube */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox checked={!!youtubeUrl} className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-500" />
                <Label className="font-medium">YouTube评测</Label>
              </div>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存选中内容
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add components/materials/save-material-dialog.tsx
git commit -m "feat(ui): add save material dialog for strategy page"
```

---

### Task 17: Integrate Save Material Dialog in Strategy Page

**Files:**
- Modify: `frontend-unified/app/(content)/strategy/page.tsx`

**Step 1: Import and add the dialog**

Find where "保存为草稿" button is and replace with:

```tsx
import { SaveMaterialDialog } from '@/components/materials/save-material-dialog'

// Add state
const [saveMaterialOpen, setSaveMaterialOpen] = useState(false)
const [selectedMarketForMaterial, setSelectedMarketForMaterial] = useState<any>(null)

// Replace "保存为草稿" button with:
<Button
  variant="outline"
  onClick={() => {
    setSelectedMarketForMaterial(selectedProduct)
    setSaveMaterialOpen(true)
  }}
>
  <FileText className="h-4 w-4 mr-2" />
  保存为素材
</Button>

// Add dialog at the end of the component
{selectedMarketForMaterial && (
  <SaveMaterialDialog
    open={saveMaterialOpen}
    onOpenChange={setSaveMaterialOpen}
    market={selectedMarketForMaterial}
  />
)}
```

**Step 2: Commit**

```bash
git add app/\(content\)/strategy/page.tsx
git commit -m "feat(ui): integrate save material dialog in strategy page"
```

---

## Final Tasks

### Task 18: Test End-to-End Flow

**Step 1: Start backend**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
go run cmd/server/main.go
```

**Step 2: Start frontend**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm run dev
```

**Step 3: Test flow**

1. Navigate to 市场战略, select a product, click "保存为素材"
2. Navigate to 素材库, verify material was created
3. Navigate to 产品中心, click "AI辅助创作"
4. Select materials, sections, generate content
5. Save as draft

### Task 19: Final Commit

```bash
git add .
git commit -m "feat: complete material library and AI content creation system"
```

---

## Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Database & Backend | 5 tasks | 1-2 hours |
| Phase 2: Frontend Materials UI | 4 tasks | 2 hours |
| Phase 3: YouTube Transcript | 2 tasks | 30 min |
| Phase 4: AI Content Generation | 4 tasks | 2 hours |
| Phase 5: Market Strategy Integration | 2 tasks | 1 hour |
| **Total** | **17 tasks** | **6-7 hours** |
