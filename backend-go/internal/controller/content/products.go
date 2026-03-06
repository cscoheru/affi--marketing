package content

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// ProductsController 产品研发控制器
// 处理内容（产品）的 CRUD 操作
// 核心认知：内容 = 我们的产品
type ProductsController struct {
	db *gorm.DB
}

// NewProductsController 创建产品控制器
func NewProductsController(db *gorm.DB) *ProductsController {
	return &ProductsController{db: db}
}

// ============================================================
// Request/Response DTOs
// ============================================================

// ListProductsRequest 产品列表请求
type ListProductsRequest struct {
	Type   string `form:"type"`   // review/guide/tutorial/list/news
	Status string `form:"status"` // draft/review/approved/published/archived
	Search string `form:"search"`
	Page   int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=100"`
}

// ListProductsResponse 产品列表响应
type ListProductsResponse struct {
	Products []content.Product `json:"products"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

// CreateProductRequest 创建产品（内容）请求
type CreateProductRequest struct {
	Slug            string  `json:"slug" binding:"required"`
	Title           string  `json:"title" binding:"required"`
	Type            string  `json:"type" binding:"required,oneof=review guide tutorial list news"`
	Content         string  `json:"content" binding:"required"`
	Excerpt         string  `json:"excerpt"`
	SEOTitle        string  `json:"seoTitle"`
	SEODescription  string  `json:"seoDescription"`
	SEOKeywords     string  `json:"seoKeywords"`
	Status          string  `json:"status" binding:"omitempty,oneof=draft review approved published archived"`
}

// UpdateProductRequest 更新产品请求
type UpdateProductRequest struct {
	Title           *string `json:"title"`
	Content         *string `json:"content"`
	Excerpt         *string `json:"excerpt"`
	SEOTitle        *string `json:"seoTitle"`
	SEODescription  *string `json:"seoDescription"`
	SEOKeywords     *string `json:"seoKeywords"`
	Status          *string `json:"status" binding:"omitempty,oneof=draft review approved published archived"`
	WordCount       *int    `json:"wordCount"`
}

// ReviewProductRequest 审核产品请求
type ReviewProductRequest struct {
	Approved       bool   `json:"approved" binding:"required"`
	ReviewComment string `json:"reviewComment"`
}

// LinkMarketsRequest 关联市场请求
type LinkMarketsRequest struct {
	MarketIDs []int `json:"marketIds" binding:"required,min=1"`
}

// LinkMarketsResponse 关联市场响应
type LinkMarketsResponse struct {
	MarketID int  `json:"marketId"`
	ASIN     string `json:"asin"`
	Title    string `json:"title"`
	IsPrimary bool   `json:"isPrimary"`
}

// GenerateProductContentRequest AI生成内容请求
type GenerateProductContentRequest struct {
	MarketID    int    `json:"marketId" binding:"required"`
	Type        string `json:"type" binding:"required,oneof=review guide tutorial list news"`
	AIModel     string `json:"aiModel"`
	Tone        string `json:"tone"`
	Length      string `json:"length"`
	CustomNotes string `json:"customNotes"`
}

// ============================================================
// Route Registration
// ============================================================

// RegisterRoutes 注册路由
func (c *ProductsController) RegisterRoutes(router *gin.RouterGroup) {
	products := router.Group("/products")
	{
		// 注意：固定路径路由必须在参数化路由之前注册
		products.GET("", c.List)
		products.POST("", c.Create)
	products.POST("/generate", c.Generate) // AI生成内容

		// 特定产品的操作
		products.GET("/:id", c.Get)
		products.PUT("/:id", c.Update)
		products.DELETE("/:id", c.Delete)

		// 产品生命周期管理
		products.POST("/:id/review", c.Review)       // 审核产品
		products.GET("/:id/markets", c.GetMarkets)     // 获取关联的市场
		products.POST("/:id/markets", c.LinkMarkets)  // 关联市场
		products.GET("/:id/publish-tasks", c.GetPublishTasks) // 获取发布任务
	}
}

// ============================================================
// Handlers
// ============================================================

// List 获取产品（内容）列表
// GET /api/v1/products?type=review&status=published&page=1&pageSize=20
func (c *ProductsController) List(ctx *gin.Context) {
	var req ListProductsRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 默认分页参数
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 20
	}

	// 构建查询
	query := c.db.Model(&content.Product{})

	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Search != "" {
		query = query.Where("title LIKE ? OR slug LIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count products", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count products"})
		return
	}

	// 分页查询，预加载关联的市场
	var products []content.Product
	offset := (req.Page - 1) * req.PageSize

	query = query.Order("created_at DESC").Offset(offset).Limit(req.PageSize)

	// 预加载关联的市场
	if err := query.Preload("ProductMarkets.Market").Find(&products).Error; err != nil {
		logger.Error("Failed to list products", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list products"})
		return
	}

	ctx.JSON(http.StatusOK, ListProductsResponse{
		Products: products,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
}

// Get 获取单个产品详情
// GET /api/v1/products/:id
func (c *ProductsController) Get(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product content.Product
	if err := c.db.Preload("ProductMarkets.Market").First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	ctx.JSON(http.StatusOK, product)
}

// Create 创建产品（内容）
// POST /api/v1/products
func (c *ProductsController) Create(ctx *gin.Context) {
	var req CreateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查 slug 是否已存在
	var existing content.Product
	if err := c.db.Where("slug = ?", req.Slug).First(&existing).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "Product with this slug already exists"})
		return
	}

	product := content.Product{
		Slug:           req.Slug,
		Title:          req.Title,
		Type:           req.Type,
		Content:        req.Content,
		Excerpt:        req.Excerpt,
		SEOTitle:       req.SEOTitle,
		SEODescription: req.SEODescription,
		SEOKeywords:    req.SEOKeywords,
		Status:         req.Status,
		WordCount:      len(req.Content),
	}

	if req.Status == "" {
		product.Status = "draft"
	}

	if err := c.db.Create(&product).Error; err != nil {
		logger.Error("Failed to create product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	logger.Info("Product created", zap.String("slug", product.Slug), zap.Int("id", product.ID))
	ctx.JSON(http.StatusCreated, product)
}

// Update 更新产品
// PUT /api/v1/products/:id
func (c *ProductsController) Update(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req UpdateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product content.Product
	if err := c.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Content != nil {
		updates["content"] = *req.Content
		updates["word_count"] = len(*req.Content)
	}
	if req.Excerpt != nil {
		updates["excerpt"] = *req.Excerpt
	}
	if req.SEOTitle != nil {
		updates["seo_title"] = *req.SEOTitle
	}
	if req.SEODescription != nil {
		updates["seo_description"] = *req.SEODescription
	}
	if req.SEOKeywords != nil {
		updates["seo_keywords"] = *req.SEOKeywords
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.WordCount != nil {
		updates["word_count"] = *req.WordCount
	}

	if err := c.db.Model(&product).Updates(updates).Error; err != nil {
		logger.Error("Failed to update product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// 重新查询获取更新后的数据
	if err := c.db.Preload("ProductMarkets.Market").First(&product, id).Error; err != nil {
		logger.Error("Failed to reload product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload product"})
		return
	}

	logger.Info("Product updated", zap.Int("id", product.ID))
	ctx.JSON(http.StatusOK, product)
}

// Delete 删除产品
// DELETE /api/v1/products/:id
func (c *ProductsController) Delete(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	if err := c.db.Delete(&content.Product{}, id).Error; err != nil {
		logger.Error("Failed to delete product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	logger.Info("Product deleted", zap.Int("id", id))
	ctx.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// Review 审核产品
// POST /api/v1/products/:id/review
func (c *ProductsController) Review(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req ReviewProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product content.Product
	if err := c.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// 只能审核待审核状态的产品
	if product.Status != "review" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Product is not in review status"})
		return
	}

	now := time.Now()

	// 更新审核状态
	if req.Approved {
		// 审核通过
		updates := map[string]interface{}{
			"status":      "approved",
			"reviewed_at": &now,
			"reviewed_by":  1, // TODO: 从JWT获取用户ID
		}
		if req.ReviewComment != "" {
			updates["review_comment"] = req.ReviewComment
		}

		if err := c.db.Model(&product).Updates(updates).Error; err != nil {
			logger.Error("Failed to approve product", zap.Error(err))
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve product"})
			return
		}

		logger.Info("Product approved", zap.Int("id", id))
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Product approved successfully",
			"status":   "approved",
		})
	} else {
		// 审核拒绝，退回到草稿状态
		updates := map[string]interface{}{
			"status":       "draft",
			"reviewed_at":   &now,
			"reviewed_by":   1, // TODO: 从JWT获取用户ID
			"review_comment": req.ReviewComment,
		}

		if err := c.db.Model(&product).Updates(updates).Error; err != nil {
			logger.Error("Failed to reject product", zap.Error(err))
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject product"})
			return
		}

		logger.Info("Product rejected", zap.Int("id", id))
		ctx.JSON(http.StatusOK, gin.H{
			"message": "Product rejected",
			"status":   "draft",
		})
	}
}

// GetMarkets 获取产品关联的市场
// GET /api/v1/products/:id/markets
func (c *ProductsController) GetMarkets(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// 查找关联的市场
	var productMarkets []content.ProductMarket
	if err := c.db.Where("product_id = ?", id).
		Preload("Market").
		Order("is_primary DESC").
		Find(&productMarkets).Error; err != nil {
		logger.Error("Failed to get product markets", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get associated markets"})
		return
	}

	// 转换为响应格式
	response := make([]LinkMarketsResponse, 0, len(productMarkets))
	for i, pm := range productMarkets {
		if pm.Market != nil {
			response[i] = LinkMarketsResponse{
				MarketID: pm.Market.ID,
				ASIN:     pm.Market.ASIN,
				Title:    pm.Market.Title,
				IsPrimary: pm.IsPrimary,
			}
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"productId":     id,
		"associatedMarkets": response,
		"total":          len(response),
	})
}

// LinkMarkets 关联市场到产品
// POST /api/v1/products/:id/markets
func (c *ProductsController) LinkMarkets(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var req LinkMarketsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// 验证市场是否存在
	var markets []content.MarketOpportunity
	if err := c.db.Where("id IN ?", req.MarketIDs).Find(&markets).Error; err != nil {
		logger.Error("Failed to find markets", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find markets"})
		return
	}

	if len(markets) != len(req.MarketIDs) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Some markets not found"})
		return
	}

	// 删除现有的关联
	c.db.Where("product_id = ?", id).Delete(&content.ProductMarket{})

	// 创建新的关联
	var productMarkets []content.ProductMarket
	for i, marketID := range req.MarketIDs {
		productMarkets = append(productMarkets, content.ProductMarket{
			ProductID: id,
			MarketID:  marketID,
			IsPrimary: i == 0, // 第一个是主要的
		})
	}

	if err := c.db.Create(&productMarkets).Error; err != nil {
		logger.Error("Failed to link markets", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link markets"})
		return
	}

	logger.Info("Markets linked to product", zap.Int("productId", id), zap.Int("count", len(productMarkets)))

	ctx.JSON(http.StatusOK, gin.H{
		"message": "Markets linked successfully",
		"linkedCount": len(productMarkets),
	})
}

// GetPublishTasks 获取产品的发布任务
// GET /api/v1/products/:id/publish-tasks
func (c *ProductsController) GetPublishTasks(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.First(&product, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	// 查找发布任务
	var tasks []content.PublishTask
	if err := c.db.Where("product_id = ?", id).Order("created_at DESC").Find(&tasks).Error; err != nil {
		logger.Error("Failed to get publish tasks", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get publish tasks"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"productId":     id,
		"publishTasks": tasks,
		"total":         len(tasks),
	})
}

// Generate AI生成内容
// POST /api/v1/products/generate
func (c *ProductsController) Generate(ctx *gin.Context) {
	var req GenerateProductContentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找市场信息
	var market content.MarketOpportunity
	if err := c.db.First(&market, req.MarketID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
		return
	}

	// TODO: 调用AI服务生成内容
	// 目前返回模拟数据
	logger.Info("Generate content request", zap.Int("marketId", req.MarketID), zap.String("type", req.Type))

	// 生成模拟内容
	mockContent := generateMockContent(market, req.Type)

	ctx.JSON(http.StatusOK, gin.H{
		"content": mockContent,
		"market":  market,
		"type":    req.Type,
	})
}

// ============================================================
// Helper Functions
// ============================================================

// generateMockContent 生成模拟内容
func generateMockContent(market content.MarketOpportunity, contentType string) string {
	// 这里应该是调用AI服务的逻辑
	// 目前返回模拟内容用于测试

	title := market.Title
	price := fmt.Sprintf("%.2f", market.Price)
	category := market.Category

	switch contentType {
	case "review":
		return fmt.Sprintf(`# %s 深度评测

## 产品概述
%s 是一款%s产品，当前售价为 $%s。

## 主要特点

- **特点1**: 基于产品描述的详细说明
- **特点2**: 用户体验优秀
- **特点3**: 性价比高

## 使用体验

在实际使用中，%s表现出色。...

## 优缺点分析

### 优点
1. 优点1
2. 优点2

### 缺点
1. 缺点1

## 购买建议

如果你正在寻找...，%s值得考虑。

## 总结
%s 是一款...的产品，推荐给...用户。`, title, title, category, price, title, title, title)

	case "guide":
		return fmt.Sprintf(`# %s 使用指南

## 快速开始

%s 的使用非常简单...

## 详细步骤

### 步骤1: 准备工作
...

### 步骤2: 基础设置
...

## 常见问题

### Q1: 如何...？
### A1: ...

## 小贴士

...

`, title)

	default:
		return fmt.Sprintf(`# 关于 %s

## 简介

%s 是一款...

## 核心功能

1. 功能1
2. 功能2

## 适用场景

...

## 总结

`, title, title)
	}
}
