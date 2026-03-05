package content

import (
	"bytes"
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

// ContentsController 内容控制器
type ContentsController struct {
	db *gorm.DB
}

// NewContentsController 创建内容控制器
func NewContentsController(db *gorm.DB) *ContentsController {
	return &ContentsController{db: db}
}

// ListContentsRequest 内容列表请求
type ListContentsRequest struct {
	ASIN   string `form:"asin"`
	Status string `form:"status" binding:"oneof=draft reviewing approved published rejected"`
	Type   string `form:"type"`
	Page   int    `form:"page" binding:"min=1"`
	Size   int    `form:"size" binding:"min=1,max=100"`
}

// CreateContentRequest 创建内容请求
type CreateContentRequest struct {
	Slug          string `json:"slug" binding:"required"`
	ASIN          string `json:"asin" binding:"required"`
	Title         string `json:"title" binding:"required"`
	Type          string `json:"type" binding:"required,oneof=review science guide blog social video email"`
	Content       string `json:"content" binding:"required"`
	Excerpt       string `json:"excerpt"`
	SEOTitle      string `json:"seoTitle"`
	SEODescription string `json:"seoDescription"`
	SEOKeywords   string `json:"seoKeywords"`
}

// GenerateContentRequest 生成内容请求
type GenerateContentRequest struct {
	ASIN        string `json:"asin" binding:"required"`
	ContentType string `json:"contentType" binding:"required,oneof=review science guide blog social video email"`
	AIModel     string `json:"model" binding:"required,oneof=claude gpt4"`
}

// ReviewContentRequest 审核内容请求
type ReviewContentRequest struct {
	Action  string `json:"action" binding:"required,oneof=approve reject revision"`
	Comment string `json:"comment"`
}

// UpdateContentRequest 更新内容请求
type UpdateContentRequest struct {
	Title         *string `json:"title"`
	Content       *string `json:"content"`
	Excerpt       *string `json:"excerpt"`
	SEOTitle      *string `json:"seoTitle"`
	SEODescription *string `json:"seoDescription"`
	SEOKeywords   *string `json:"seoKeywords"`
}

// RegisterRoutes 注册路由
func (c *ContentsController) RegisterRoutes(router *gin.RouterGroup) {
	contents := router.Group("/contents")
	{
		contents.GET("", c.List)
		contents.GET("/:id", c.Get)
		contents.POST("", c.Create)
		contents.PUT("/:id", c.Update)
		contents.DELETE("/:id", c.Delete)
		contents.POST("/generate", c.Generate)
		contents.POST("/:id/review", c.Review)
		contents.GET("/generate/tasks/:id", c.GetGenerateTask)
	}
}

// List 获取内容列表
func (c *ContentsController) List(ctx *gin.Context) {
	var req ListContentsRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 默认分页参数
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Size == 0 {
		req.Size = 20
	}

	// 构建查询
	query := c.db.Model(&content.Content{})

	if req.ASIN != "" {
		query = query.Where("asin = ?", req.ASIN)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count contents", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count contents"})
		return
	}

	// 分页查询
	var contents []content.Content
	offset := (req.Page - 1) * req.Size
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.Size).Find(&contents).Error; err != nil {
		logger.Error("Failed to list contents", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list contents"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"contents": contents,
		"total":    total,
		"page":     req.Page,
		"size":     req.Size,
	})
}

// Get 获取单个内容
func (c *ContentsController) Get(ctx *gin.Context) {
	id := ctx.Param("id")
	contentID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	var contentData content.Content
	if err := c.db.First(&contentData, contentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get content"})
		return
	}

	ctx.JSON(http.StatusOK, contentData)
}

// Create 创建内容
func (c *ContentsController) Create(ctx *gin.Context) {
	var req CreateContentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查 slug 是否已存在
	var existing content.Content
	if err := c.db.Where("slug = ?", req.Slug).First(&existing).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "Content with this slug already exists"})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.Where("asin = ?", req.ASIN).First(&product).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	contentData := content.Content{
		Slug:           req.Slug,
		ASIN:           req.ASIN,
		Title:          req.Title,
		Type:           req.Type,
		Content:        req.Content,
		Excerpt:        req.Excerpt,
		SEOTitle:       req.SEOTitle,
		SEODescription: req.SEODescription,
		SEOKeywords:    req.SEOKeywords,
		Status:         "draft",
		AIGenerated:    false,
		HumanReviewed:  false,
		WordCount:      len([]rune(req.Content)),
	}

	if err := c.db.Create(&contentData).Error; err != nil {
		logger.Error("Failed to create content", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create content"})
		return
	}

	logger.Info("Content created", zap.Int("id", contentData.ID), zap.String("slug", contentData.Slug))
	ctx.JSON(http.StatusCreated, contentData)
}

// Update 更新内容
func (c *ContentsController) Update(ctx *gin.Context) {
	id := ctx.Param("id")
	contentID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	var req UpdateContentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var contentData content.Content
	if err := c.db.First(&contentData, contentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get content"})
		return
	}

	// 只有草稿状态可以自由编辑
	if contentData.Status != "draft" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Can only update draft content"})
		return
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Content != nil {
		updates["content"] = *req.Content
		updates["word_count"] = len([]rune(*req.Content))
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

	if err := c.db.Model(&contentData).Updates(updates).Error; err != nil {
		logger.Error("Failed to update content", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update content"})
		return
	}

	// 重新查询获取更新后的数据
	c.db.First(&contentData, contentID)
	ctx.JSON(http.StatusOK, contentData)
}

// Delete 删除内容
func (c *ContentsController) Delete(ctx *gin.Context) {
	id := ctx.Param("id")
	contentID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	if err := c.db.Delete(&content.Content{}, contentID).Error; err != nil {
		logger.Error("Failed to delete content", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete content"})
		return
	}

	logger.Info("Content deleted", zap.Int("id", contentID))
	ctx.JSON(http.StatusOK, gin.H{"message": "Content deleted successfully"})
}

// Generate 生成内容（AI）
func (c *ContentsController) Generate(ctx *gin.Context) {
	var req GenerateContentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查产品是否存在
	var product content.Product
	if err := c.db.Where("asin = ?", req.ASIN).First(&product).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 创建生成任务
	task := content.ContentGenerateTask{
		ASIN:     req.ASIN,
		Type:     req.ContentType,
		AIModel:  req.AIModel,
		Status:   "pending",
		Progress: 0,
	}

	if err := c.db.Create(&task).Error; err != nil {
		logger.Error("Failed to create generate task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create generate task"})
		return
	}

	// 启动后台协程执行实际的生成任务
	go c.runGenerateTask(task.ID, req.ASIN, req.ContentType, req.AIModel, &product)

	logger.Info("Content generate task created",
		zap.Int("taskId", task.ID),
		zap.String("asin", req.ASIN),
		zap.String("type", req.ContentType))

	ctx.JSON(http.StatusAccepted, gin.H{
		"taskId": task.ID,
		"status": "pending",
		"message": "Content generation task started",
	})
}

// runGenerateTask 后台执行生成任务
func (c *ContentsController) runGenerateTask(taskID int, asin, contentType, aiModel string, product *content.Product) {
	// 更新任务状态为生成中
	c.db.Model(&content.ContentGenerateTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":   "generating",
		"progress": 10,
	})

	// 调用 AI 服务生成内容
	generatedContent, err := c.callAIService(product, contentType, aiModel)
	if err != nil {
		logger.Error("Failed to call AI service", zap.Error(err))
		c.db.Model(&content.ContentGenerateTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
			"status":   "failed",
			"error_msg": fmt.Sprintf("AI service error: %v", err),
			"progress": 0,
		})
		return
	}

	// 更新进度
	c.db.Model(&content.ContentGenerateTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"progress": 80,
	})

	// 创建内容记录
	contentData := content.Content{
		Slug:           fmt.Sprintf("%s-%s-%d", asin, contentType, time.Now().Unix()),
		ASIN:           asin,
		Title:          generateTitle(product, contentType),
		Type:           contentType,
		Content:        generatedContent,
		Excerpt:        generateExcerpt(generatedContent),
		SEOTitle:       fmt.Sprintf("%s 评测 | ContentHub", product.Title),
		SEODescription: fmt.Sprintf("详细评测 %s，了解产品的优缺点和使用体验", product.Title),
		SEOKeywords:    fmt.Sprintf("%s, 评测, 推荐", product.Title),
		Status:         "draft",
		AIGenerated:    true,
		AIModel:        aiModel,
		HumanReviewed:  false,
		WordCount:      len([]rune(generatedContent)),
	}

	if err := c.db.Create(&contentData).Error; err != nil {
		logger.Error("Failed to save generated content", zap.Error(err))
		c.db.Model(&content.ContentGenerateTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
			"status":   "failed",
			"error_msg": "Failed to save content",
			"progress": 0,
		})
		return
	}

	// 更新任务状态为成功
	c.db.Model(&content.ContentGenerateTask{}).Where("id = ?", taskID).Updates(map[string]interface{}{
		"status":     "success",
		"progress":   100,
		"content_id": contentData.ID,
		"result":     generatedContent,
	})

	logger.Info("Content generate task completed",
		zap.Int("taskId", taskID),
		zap.Int("contentId", contentData.ID),
		zap.String("aiModel", aiModel))
}

// callAIService 调用 AI 服务生成内容
func (c *ContentsController) callAIService(product *content.Product, contentType, aiModel string) (string, error) {
	// 构建提示词
	prompt := buildPrompt(product, contentType)
	systemPrompt := "你是一个专业的内容创作者，擅长撰写产品评测和推荐文章。请基于产品信息生成高质量、有价值的内容。"

	// 根据前端选择的模型映射到 AI 服务
	// claude -> qwen (使用 Qwen 作为 Claude 的替代)
	// gpt4 -> openai (使用 GPT-4)
	aiServiceModel := "qwen-turbo" // 默认使用 Qwen
	if aiModel == "gpt4" {
		aiServiceModel = "gpt-4"
	}

	// 构建请求体
	requestBody := map[string]interface{}{
		"prompt":         prompt,
		"system_prompt":  systemPrompt,
		"max_tokens":     2000,
		"temperature":    0.7,
		"tier":           "standard",
		"model":          aiServiceModel,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// 调用 AI 服务
	resp, err := http.Post("http://localhost:8000/api/v1/generate/text", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to call AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	// 解析响应
	var response struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	return response.Content, nil
}

// buildPrompt 构建生成提示词
func buildPrompt(product *content.Product, contentType string) string {
	contentTypeMap := map[string]string{
		"review":  "深度评测",
		"science": "科普文章",
		"guide":   "购买指南",
		"blog":    "博客文章",
	}

	typeName := contentTypeMap[contentType]
	if typeName == "" {
		typeName = "内容"
	}

	prompt := fmt.Sprintf(`请为以下产品写一篇%s，要求：

产品信息：
- 名称：%s
- ASIN：%s
- 类别：%s
- 价格：$%.2f
- 评分：%.1f
- 评论数：%d

内容要求：
1. 字数：1000-1500字
2. 结构清晰，包含产品概述、主要特点、优缺点分析、适用人群
3. 语言专业但不晦涩，易于理解
4. 包含真实有价值的信息，避免空泛描述
5. 使用 Markdown 格式输出

请直接输出内容，不需要任何前言或说明。`,
		typeName, product.Title, product.ASIN, product.Category, product.Price, product.Rating, product.ReviewCount)

	return prompt
}

// generateTitle 生成内容标题
func generateTitle(product *content.Product, contentType string) string {
	contentTypeMap := map[string]string{
		"review":  "深度评测",
		"science": "科普分析",
		"guide":   "购买指南",
		"blog":    "详细介绍",
	}

	typeName := contentTypeMap[contentType]
	if typeName == "" {
		typeName = "内容"
	}

	return fmt.Sprintf("%s - %s", product.Title, typeName)
}

// generateExcerpt 从内容中生成摘要
func generateExcerpt(content string) string {
	// 简单截取前150个字符作为摘要
	runes := []rune(content)
	if len(runes) > 150 {
		return string(runes[:150]) + "..."
	}
	return content
}

// Review 审核内容
func (c *ContentsController) Review(ctx *gin.Context) {
	id := ctx.Param("id")
	contentID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid content ID"})
		return
	}

	var req ReviewContentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var contentData content.Content
	if err := c.db.First(&contentData, contentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get content"})
		return
	}

	// 允许草稿和审核中状态的内容进行审核
	if contentData.Status != "draft" && contentData.Status != "reviewing" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Can only review draft or reviewing content", "current_status": contentData.Status})
		return
	}

	// 更新状态
	var newStatus string
	switch req.Action {
	case "approve":
		newStatus = "approved"
	case "reject":
		newStatus = "rejected"
	case "revision":
		newStatus = "draft"
	}

	updates := map[string]interface{}{
		"status":         newStatus,
		"human_reviewed": true,
		"review_comment": req.Comment,
		"reviewed_by":     0, // TODO: 从 JWT 获取用户 ID
	}

	if err := c.db.Model(&contentData).Updates(updates).Error; err != nil {
		logger.Error("Failed to update content status", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update content status"})
		return
	}

	// 重新查询获取更新后的数据
	c.db.First(&contentData, contentID)

	logger.Info("Content reviewed",
		zap.Int("id", contentID),
		zap.String("action", req.Action),
		zap.String("oldStatus", contentData.Status),
		zap.String("newStatus", newStatus))

	ctx.JSON(http.StatusOK, contentData)
}

// GetGenerateTask 获取生成任务状态
func (c *ContentsController) GetGenerateTask(ctx *gin.Context) {
	id := ctx.Param("id")
	taskID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task content.ContentGenerateTask
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
