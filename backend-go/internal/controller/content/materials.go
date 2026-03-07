package content

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

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

// ListMaterialsRequest 素材列表请求
type ListMaterialsRequest struct {
	MarketID int    `form:"marketId"`
	Type     string `form:"type"`
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=100"`
}

// CreateMaterialRequest 创建素材请求
type CreateMaterialRequest struct {
	Title     string `json:"title" binding:"required"`
	Type      string `json:"type" binding:"required,oneof=product_intro user_review youtube_review attachment"`
	Content   string `json:"content"`
	SourceURL string `json:"sourceUrl"`
	MarketID  int    `json:"marketId" binding:"required"`
}

// UpdateMaterialRequest 更新素材请求
type UpdateMaterialRequest struct {
	Title     string `json:"title"`
	Type      string `json:"type" binding:"omitempty,oneof=product_intro user_review youtube_review attachment"`
	Content   string `json:"content"`
	SourceURL string `json:"sourceUrl"`
}

// CollectMaterialsRequest 收集素材请求
type CollectMaterialsRequest struct {
	ASIN        string   `json:"asin" binding:"required"`
	SourceTypes []string `json:"sourceTypes" binding:"required,dive,oneof=amazon_review youtube reddit quora"`
}

// ListMaterialsResponse 素材列表响应
type ListMaterialsResponse struct {
	Materials []content.Material       `json:"materials"`
	Total     int64                    `json:"total"`
	Page      int                      `json:"page"`
	PageSize  int                      `json:"pageSize"`
}

// CollectTaskResponse 收集任务响应
type CollectTaskResponse struct {
	TaskID    int    `json:"taskId"`
	ASIN      string `json:"asin"`
	Status    string `json:"status"`
	Message   string `json:"message"`
}

// RegisterRoutes 注册路由
func (c *MaterialsController) RegisterRoutes(router *gin.RouterGroup) {
	materials := router.Group("/materials")
	{
		// 新素材库 API
		materials.GET("", c.List)
		materials.POST("", c.Create)
		materials.GET("/:id", c.Get)
		materials.PUT("/:id", c.Update)
		materials.DELETE("/:id", c.Delete)
		materials.GET("/by-market/:marketId", c.ListByMarket)

		// 旧收集任务 API (保留兼容)
		materials.POST("/collect", c.Collect)
		materials.GET("/tasks/:id", c.GetTask)
		materials.GET("/tasks", c.ListTasks)
	}
}

// List 获取素材列表（新版素材库）
func (c *MaterialsController) List(ctx *gin.Context) {
	var req ListMaterialsRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 默认分页参数
	if req.Page == 0 {
		req.Page = 1
	}
	if req.PageSize == 0 {
		req.PageSize = 50
	}

	// 构建查询
	query := c.db.Model(&content.Material{})

	if req.MarketID > 0 {
		query = query.Where("market_id = ?", req.MarketID)
	}
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count materials", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count materials"})
		return
	}

	// 分页查询
	var materials []content.Material
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&materials).Error; err != nil {
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
	id := ctx.Param("id")
	materialID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid material ID"})
		return
	}

	var material content.Material
	if err := c.db.First(&material, materialID).Error; err != nil {
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

	// 检查市场是否存在
	var market content.MarketOpportunity
	if err := c.db.First(&market, req.MarketID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check market"})
		return
	}

	// 计算字数
	wordCount := 0
	if req.Content != "" {
		wordCount = len([]rune(req.Content))
	}

	material := content.Material{
		Title:     req.Title,
		Type:      content.MaterialType(req.Type),
		Content:   req.Content,
		SourceURL: req.SourceURL,
		MarketID:  req.MarketID,
		WordCount: wordCount,
	}

	if err := c.db.Create(&material).Error; err != nil {
		logger.Error("Failed to create material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create material"})
		return
	}

	logger.Info("Material created", zap.Int("id", material.ID), zap.String("title", material.Title))
	ctx.JSON(http.StatusCreated, material)
}

// Update 更新素材
func (c *MaterialsController) Update(ctx *gin.Context) {
	id := ctx.Param("id")
	materialID, err := parseID(id)
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
	if err := c.db.First(&material, materialID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get material"})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Content != "" {
		updates["content"] = req.Content
		updates["word_count"] = len([]rune(req.Content))
	}
	if req.SourceURL != "" {
		updates["source_url"] = req.SourceURL
	}

	if err := c.db.Model(&material).Updates(updates).Error; err != nil {
		logger.Error("Failed to update material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update material"})
		return
	}

	// 重新获取更新后的数据
	c.db.First(&material, materialID)
	ctx.JSON(http.StatusOK, material)
}

// Delete 删除素材
func (c *MaterialsController) Delete(ctx *gin.Context) {
	id := ctx.Param("id")
	materialID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid material ID"})
		return
	}

	if err := c.db.Delete(&content.Material{}, materialID).Error; err != nil {
		logger.Error("Failed to delete material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete material"})
		return
	}

	logger.Info("Material deleted", zap.Int("id", materialID))
	ctx.JSON(http.StatusOK, gin.H{"message": "Material deleted successfully"})
}

// ListByMarket 按市场获取素材列表
func (c *MaterialsController) ListByMarket(ctx *gin.Context) {
	marketID, err := parseID(ctx.Param("marketId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid market ID"})
		return
	}

	page := 1
	pageSize := 50
	if p := ctx.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if ps := ctx.Query("pageSize"); ps != "" {
		fmt.Sscanf(ps, "%d", &pageSize)
	}

	// 检查市场是否存在
	var market content.MarketOpportunity
	if err := c.db.First(&market, marketID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check market"})
		return
	}

	// 获取总数
	var total int64
	c.db.Model(&content.Material{}).Where("market_id = ?", marketID).Count(&total)

	// 分页查询
	var materials []content.Material
	offset := (page - 1) * pageSize
	if err := c.db.Where("market_id = ?", marketID).Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&materials).Error; err != nil {
		logger.Error("Failed to list materials by market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list materials"})
		return
	}

	ctx.JSON(http.StatusOK, ListMaterialsResponse{
		Materials: materials,
		Total:     total,
		Page:      page,
		PageSize:  pageSize,
	})
}

// Collect 触发素材收集
func (c *MaterialsController) Collect(ctx *gin.Context) {
	var req CollectMaterialsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.Where("asin = ?", req.ASIN).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to check product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check product"})
		return
	}

	// 创建收集任务
	sourceTypesJSON, _ := json.Marshal(req.SourceTypes)
	task := content.MaterialCollectTask{
		ASIN:        req.ASIN,
		SourceTypes: string(sourceTypesJSON),
		Status:      "pending",
	}

	if err := c.db.Create(&task).Error; err != nil {
		logger.Error("Failed to create collect task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collect task"})
		return
	}

	// TODO: 启动后台协程执行实际的收集任务
	// 这里应该调用爬虫服务来收集素材
	go c.runCollectTask(task.ID, req.ASIN, req.SourceTypes)

	logger.Info("Material collect task created",
		zap.Int("taskId", task.ID),
		zap.String("asin", req.ASIN),
		zap.Strings("sourceTypes", req.SourceTypes))

	ctx.JSON(http.StatusAccepted, CollectTaskResponse{
		TaskID:  task.ID,
		ASIN:    req.ASIN,
		Status:  "pending",
		Message: "Collection task started",
	})
}

// runCollectTask 后台执行收集任务
func (c *MaterialsController) runCollectTask(taskID int, asin string, sourceTypes []string) {
	// 更新任务状态为运行中
	c.db.Model(&content.MaterialCollectTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":   "running",
		"progress": 0,
	})

	// 模拟收集过程
	// TODO: 实际实现中，这里应该调用:
	// 1. Amazon 评论爬虫
	// 2. YouTube 视频爬虫
	// 3. Reddit 讨论爬虫
	// 4. Quora 问答爬虫

	// 模拟收集延迟
	time.Sleep(2 * time.Second)

	// 创建模拟素材数据
	mockMaterials := []content.MaterialLegacy{
		{
			ASIN:           asin,
			SourceType:     "amazon_review",
			SourceURL:      "https://amazon.com/product-reviews/" + asin,
			Content:        "这是一个模拟的 Amazon 评论素材。实际使用时应该从真实的 Amazon 页面抓取评论数据。",
			SentimentScore: 0.75,
			Metadata:       `{"author":"John Doe","rating":5,"verified":true}`,
		},
		{
			ASIN:           asin,
			SourceType:     "youtube",
			SourceURL:      "https://youtube.com/watch?v=mock123",
			Content:        "这是一个模拟的 YouTube 视频素材。实际使用时应该从真实的 YouTube 页面抓取视频描述和评论。",
			SentimentScore: 0.68,
			Metadata:       `{"channel":"Tech Reviewer","views":10000,"likes":500}`,
		},
	}

	// 保存素材
	for _, material := range mockMaterials {
		if err := c.db.Create(&material).Error; err != nil {
			logger.Error("Failed to create material", zap.Error(err))
		} else {
			logger.Info("Created material", zap.Int("id", material.ID), zap.String("sourceType", material.SourceType))
		}
	}

	// 更新任务状态为成功
	c.db.Model(&content.MaterialCollectTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":   "success",
		"progress": 100,
		"collected": len(mockMaterials),
	})

	logger.Info("Material collect task completed",
		zap.Int("taskId", taskID),
		zap.String("asin", asin),
		zap.Int("collected", len(mockMaterials)))
}

// GetTask 获取收集任务状态
func (c *MaterialsController) GetTask(ctx *gin.Context) {
	id := ctx.Param("id")
	taskID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task content.MaterialCollectTask
	if err := c.db.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
		return
	}

	ctx.JSON(http.StatusOK, task)
}

// ListTasks 获取收集任务列表
func (c *MaterialsController) ListTasks(ctx *gin.Context) {
	asin := ctx.Query("asin")

	query := c.db.Model(&content.MaterialCollectTask{})
	if asin != "" {
		query = query.Where("asin = ?", asin)
	}

	var tasks []content.MaterialCollectTask
	if err := query.Order("created_at DESC").Limit(50).Find(&tasks).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list tasks"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

// parseID 解析 ID 参数
func parseID(s string) (int, error) {
	var id int
	_, err := fmt.Sscanf(s, "%d", &id)
	return id, err
}
