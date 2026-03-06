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

// PublishController 发布控制器
type PublishController struct {
	db *gorm.DB
}

// NewPublishController 创建发布控制器
func NewPublishController(db *gorm.DB) *PublishController {
	return &PublishController{db: db}
}

// SubmitPublishRequest 提交发布请求
type SubmitPublishRequest struct {
	ContentID int      `json:"contentId" binding:"required"`
	Platforms []string `json:"platforms" binding:"required,min=1"`
}

// RegisterRoutes 注册路由
func (c *PublishController) RegisterRoutes(router *gin.RouterGroup) {
	publish := router.Group("/publish")
	{
		publish.GET("/queue", c.GetQueue)
		publish.POST("/submit", c.Submit)
		publish.POST("/queue/:id/retry", c.Retry)
		publish.GET("/platforms", c.GetPlatforms)
		publish.PUT("/platforms/:id", c.UpdatePlatform)
		publish.POST("/platforms/:id/test", c.TestPlatform)
		publish.GET("/logs", c.GetLogs)
	}
}

// GetQueue 获取发布队列
func (c *PublishController) GetQueue(ctx *gin.Context) {
	var tasks []content.PublishTask

	query := c.db.Order("created_at DESC").Limit(50)
	if err := query.Find(&tasks).Error; err != nil {
		logger.Error("Failed to get publish queue", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get publish queue"})
		return
	}

	// 新的 PublishTask 模型没有 Results 字段，数据直接在结构体中
	// 不需要额外解析

	ctx.JSON(http.StatusOK, gin.H{"queue": tasks})
}

// Submit 提交发布任务
func (c *PublishController) Submit(ctx *gin.Context) {
	var req SubmitPublishRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查内容是否存在
	var contentData content.Product
	if err := c.db.First(&contentData, req.ContentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Content not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get content"})
		return
	}

	// 检查内容状态
	if contentData.Status != "approved" {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Content must be approved before publishing"})
		return
	}

	// 检查平台是否可用
	var platforms []content.PublishPlatform
	if err := c.db.Where("name IN ? AND enabled = ?", req.Platforms, true).Find(&platforms).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check platforms"})
		return
	}

	if len(platforms) != len(req.Platforms) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Some platforms are not available"})
		return
	}

	// 创建发布任务（新架构：每个平台一个任务）
	var taskIDs []int
	for _, platform := range req.Platforms {
		task := content.PublishTask{
			ProductID: req.ContentID, // ContentID 现在映射到 ProductID
			Platform:  platform,     // 单个平台
			Status:    "pending",
		}

		if err := c.db.Create(&task).Error; err != nil {
			logger.Error("Failed to create publish task", zap.Error(err))
			continue
		}
		taskIDs = append(taskIDs, task.ID)
	}

	if len(taskIDs) == 0 {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create any publish tasks"})
		return
	}

	// 启动后台协程执行发布（为每个任务）
	for _, platformName := range req.Platforms {
		go c.runPublishTaskForPlatform(platformName, req.ContentID, &contentData)
	}

	logger.Info("Publish tasks created",
		zap.Int("taskId", taskIDs[0]),
		zap.Int("productId", req.ContentID),
		zap.Strings("platforms", req.Platforms))

	ctx.JSON(http.StatusAccepted, gin.H{
		"taskIds": taskIDs,
		"status":  "pending",
		"message": "Publish tasks started",
	})
}

// runPublishTaskForPlatform 后台执行单个平台的发布任务
func (c *PublishController) runPublishTaskForPlatform(platformName string, productID int, contentData *content.Product) {
	// 查找该平台的任务
	var task content.PublishTask
	if err := c.db.Where("product_id = ? AND platform = ?", productID, platformName).First(&task).Error; err != nil {
		logger.Error("Failed to find publish task", zap.Error(err), zap.String("platform", platformName))
		return
	}

	// 更新任务状态为运行中
	c.db.Model(&task).Update("status", "running")

	// 添加日志
	c.createLog(&task.ID, &platformName, "info", fmt.Sprintf("Starting publish to %s", platformName), nil)

	// 模拟发布过程
	// TODO: 实际实现中，这里应该调用各平台的 API
	time.Sleep(1 * time.Second)

	var finalStatus string
	var publishedURL string
	var errorMessage string

	// 模拟成功/失败
	if platformName == "Blogger" {
		finalStatus = "success"
		publishedURL = fmt.Sprintf("https://blogger.example.com/%s", contentData.Slug)
		c.createLog(&task.ID, &platformName, "success", fmt.Sprintf("Successfully published to %s", platformName), nil)
	} else if platformName == "Medium" {
		finalStatus = "failed"
		errorMessage = "Rate limit exceeded"
		c.createLog(&task.ID, &platformName, "error", "Failed to publish to Medium: Rate limit exceeded", nil)
	} else {
		finalStatus = "success"
		publishedURL = fmt.Sprintf("https://%s.example.com/%s", platformName, contentData.Slug)
		c.createLog(&task.ID, &platformName, "success", fmt.Sprintf("Successfully published to %s", platformName), nil)
	}

	// 更新任务状态（使用新的模型结构）
	updates := map[string]interface{}{
		"status":         finalStatus,
		"published_url":  publishedURL,
		"error_message":  errorMessage,
	}

	c.db.Model(&task).Updates(updates)

	// 如果成功，检查是否所有平台的任务都完成了
	if finalStatus == "success" {
		// 检查该产品是否还有其他待处理的任务
		var pendingCount int64
		c.db.Model(&content.PublishTask{}).Where("product_id = ? AND status IN ?", productID, []string{"pending", "running"}).Count(&pendingCount)

		// 如果没有待处理的任务了，更新产品状态为已发布
		if pendingCount == 0 {
			now := time.Now()
			c.db.Model(&content.Product{}).Where("id = ?", productID).Updates(map[string]interface{}{
				"status":      "published",
				"published_at": &now,
			})
		}
	}

	logger.Info("Publish task completed",
		zap.Int("taskId", task.ID),
		zap.String("platform", platformName),
		zap.String("status", finalStatus))
}

// Retry 重试发布任务
func (c *PublishController) Retry(ctx *gin.Context) {
	id := ctx.Param("id")
	taskID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var task content.PublishTask
	if err := c.db.First(&task, taskID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task"})
		return
	}

	// 新架构：每个任务对应单个平台，只能重试失败的任务
	if task.Status != "failed" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Can only retry failed tasks"})
		return
	}

	// 获取产品内容
	var contentData content.Product
	if err := c.db.First(&contentData, task.ProductID).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 重置任务状态
	c.db.Model(&task).Updates(map[string]interface{}{
		"status":        "pending",
		"error_message": "",
	})

	// 重新启动发布任务
	go c.runPublishTaskForPlatform(task.Platform, task.ProductID, &contentData)

	logger.Info("Publish task retry initiated", zap.Int("taskId", taskID), zap.String("platform", task.Platform))

	ctx.JSON(http.StatusAccepted, gin.H{
		"taskId":  task.ID,
		"status":  "pending",
		"message": "Publish task retry started",
	})
}

// GetPlatforms 获取发布平台列表
func (c *PublishController) GetPlatforms(ctx *gin.Context) {
	var platforms []content.PublishPlatform
	if err := c.db.Find(&platforms).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get platforms"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"platforms": platforms})
}

// UpdatePlatformRequest 更新平台请求
type UpdatePlatformRequest struct {
	DisplayName *string `json:"displayName"`
	Enabled     *bool   `json:"enabled"`
	Config      *string `json:"config"`
}

// UpdatePlatform 更新平台配置
func (c *PublishController) UpdatePlatform(ctx *gin.Context) {
	id := ctx.Param("id")
	platformID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid platform ID"})
		return
	}

	var req UpdatePlatformRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var platform content.PublishPlatform
	if err := c.db.First(&platform, platformID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Platform not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get platform"})
		return
	}

	updates := make(map[string]interface{})
	if req.DisplayName != nil {
		updates["display_name"] = *req.DisplayName
	}
	if req.Enabled != nil {
		updates["enabled"] = *req.Enabled
	}
	if req.Config != nil {
		updates["config"] = *req.Config
	}

	if err := c.db.Model(&platform).Updates(updates).Error; err != nil {
		logger.Error("Failed to update platform", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update platform"})
		return
	}

	// 重新查询
	c.db.First(&platform, platformID)
	ctx.JSON(http.StatusOK, platform)
}

// TestPlatform 测试平台连接
func (c *PublishController) TestPlatform(ctx *gin.Context) {
	id := ctx.Param("id")
	platformID, err := parseID(id)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid platform ID"})
		return
	}

	var platform content.PublishPlatform
	if err := c.db.First(&platform, platformID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Platform not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get platform"})
		return
	}

	// 模拟测试连接
	// TODO: 实际实现中，这里应该调用平台的 API 进行测试
	time.Sleep(500 * time.Millisecond)

	now := time.Now()
	status := "connected"
	if platform.Name == "Medium" {
		status = "error" // 模拟 Medium 连接失败
	}

	c.db.Model(&platform).Updates(map[string]interface{}{
		"status":     status,
		"last_test_at": &now,
	})

	ctx.JSON(http.StatusOK, gin.H{
		"platform": platform.Name,
		"status":   status,
		"message":  "Connection test completed",
	})
}

// GetLogs 获取发布日志
func (c *PublishController) GetLogs(ctx *gin.Context) {
	taskID := ctx.Query("taskId")

	query := c.db.Model(&content.PublishLog{}).Order("created_at DESC").Limit(100)
	if taskID != "" {
		id, err := parseID(taskID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
			return
		}
		query = query.Where("task_id = ?", id)
	}

	var logs []content.PublishLog
	if err := query.Find(&logs).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get logs"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"logs": logs})
}

// createLog 创建发布日志
func (c *PublishController) createLog(taskID *int, platform *string, logType, message string, metadata interface{}) {
	var metadataJSON string
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}

	log := content.PublishLog{
		TaskID:   taskID,
		Platform: *platform,
		Type:     logType,
		Message:  message,
		Metadata: metadataJSON,
	}

	c.db.Create(&log)
}
