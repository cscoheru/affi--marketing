package content

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// ScheduleController 定时任务控制器
type ScheduleController struct {
	db *gorm.DB
}

// NewScheduleController 创建定时任务控制器
func NewScheduleController(db *gorm.DB) *ScheduleController {
	return &ScheduleController{db: db}
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

// CreateScheduleTaskRequest 创建定时任务请求
type CreateScheduleTaskRequest struct {
	Name             string `json:"name" binding:"required"`
	Frequency        string `json:"frequency" binding:"required,oneof=daily weekly monthly"`
	ExecuteTime      string `json:"executeTime" binding:"required"`
	Category         string `json:"category"`
	MinPrice         int    `json:"minPrice"`
	MaxPrice         int    `json:"maxPrice"`
	MinRating        string `json:"minRating"`
	AutoAdd          bool   `json:"autoAdd"`
	MaxResults       int    `json:"maxResults"`
	CompetitionLevel string `json:"competitionLevel"`
	MarketTrend      string `json:"marketTrend"`
}

// UpdateScheduleTaskRequest 更新定时任务请求
type UpdateScheduleTaskRequest struct {
	Name             *string `json:"name"`
	Frequency        *string `json:"frequency" binding:"omitempty,oneof=daily weekly monthly"`
	ExecuteTime      *string `json:"executeTime"`
	Category         *string `json:"category"`
	MinPrice         *int    `json:"minPrice"`
	MaxPrice         *int    `json:"maxPrice"`
	MinRating        *string `json:"minRating"`
	AutoAdd          *bool   `json:"autoAdd"`
	MaxResults       *int    `json:"maxResults"`
	CompetitionLevel *string `json:"competitionLevel"`
	MarketTrend      *string `json:"marketTrend"`
	Status           *string `json:"status" binding:"omitempty,oneof=active paused deleted"`
}

// ScheduleTaskResponse 定时任务响应
type ScheduleTaskResponse struct {
	ID               int        `json:"id"`
	Name             string     `json:"name"`
	Frequency        string     `json:"frequency"`
	ExecuteTime      string     `json:"executeTime"`
	Category         string     `json:"category"`
	MinPrice         int        `json:"minPrice"`
	MaxPrice         int        `json:"maxPrice"`
	MinRating        string     `json:"minRating"`
	AutoAdd          bool       `json:"autoAdd"`
	MaxResults       int        `json:"maxResults"`
	CompetitionLevel string     `json:"competitionLevel"`
	MarketTrend      string     `json:"marketTrend"`
	Status           string     `json:"status"`
	LastRunAt        *time.Time `json:"lastRunAt"`
	NextRunAt        *time.Time `json:"nextRunAt"`
	RunCount         int        `json:"runCount"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// ScheduleTaskListResponse 定时任务列表响应
type ScheduleTaskListResponse struct {
	Tasks []ScheduleTaskResponse `json:"tasks"`
	Total int64                  `json:"total"`
}

// TaskHistoryResponse 任务历史响应
type TaskHistoryResponse struct {
	ID            int                    `json:"id"`
	TaskId        int                    `json:"taskId"`
	RunAt         time.Time              `json:"runAt"`
	Status        string                 `json:"status"`
	ProductsFound int                    `json:"productsFound"`
	ProductsAdded int                    `json:"productsAdded"`
	TopProducts   []TopProduct           `json:"topProducts"`
	ErrorMessage  string                 `json:"errorMessage"`
	ExecutionTime int                    `json:"executionTime"`
	CreatedAt     time.Time              `json:"createdAt"`
}

// TopProduct 热门产品
type TopProduct struct {
	ASIN    string `json:"asin"`
	Title   string `json:"title"`
	AIScore int    `json:"aiScore"`
}

// ============================================================================
// Route Registration
// ============================================================================

// RegisterRoutes 注册路由
func (c *ScheduleController) RegisterRoutes(router *gin.RouterGroup) {
	schedule := router.Group("/schedule")
	{
		schedule.GET("", c.List)
		schedule.POST("", c.Create)
		schedule.GET("/:id", c.Get)
		schedule.PUT("/:id", c.Update)
		schedule.DELETE("/:id", c.Delete)
		schedule.POST("/:id/run", c.RunNow)         // 立即执行
		schedule.GET("/:id/history", c.GetHistory)  // 执行历史
	}
}

// ============================================================================
// Handlers
// ============================================================================

// List 获取定时任务列表
// GET /api/v1/schedule
func (c *ScheduleController) List(ctx *gin.Context) {
	var tasks []content.ScheduleTask
	if err := c.db.Where("status != ?", "deleted").Order("created_at DESC").Find(&tasks).Error; err != nil {
		logger.Error("Failed to list schedule tasks", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list schedule tasks"})
		return
	}

	var total int64
	c.db.Model(&content.ScheduleTask{}).Where("status != ?", "deleted").Count(&total)

	response := make([]ScheduleTaskResponse, len(tasks))
	for i, task := range tasks {
		response[i] = toTaskResponse(task)
	}

	ctx.JSON(http.StatusOK, ScheduleTaskListResponse{
		Tasks: response,
		Total: total,
	})
}

// Get 获取单个任务详情
// GET /api/v1/schedule/:id
func (c *ScheduleController) Get(ctx *gin.Context) {
	id := ctx.Param("id")

	var task content.ScheduleTask
	if err := c.db.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		logger.Error("Failed to get schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get schedule task"})
		return
	}

	ctx.JSON(http.StatusOK, toTaskResponse(task))
}

// Create 创建定时任务
// POST /api/v1/schedule
func (c *ScheduleController) Create(ctx *gin.Context) {
	var req CreateScheduleTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 计算下次执行时间
	nextRunAt := calculateNextRunAt(req.Frequency, req.ExecuteTime)

	task := content.ScheduleTask{
		Name:             req.Name,
		Frequency:        req.Frequency,
		ExecuteTime:      req.ExecuteTime,
		Category:         req.Category,
		MinPrice:         req.MinPrice,
		MaxPrice:         req.MaxPrice,
		MinRating:        req.MinRating,
		AutoAdd:          req.AutoAdd,
		MaxResults:       req.MaxResults,
		CompetitionLevel: req.CompetitionLevel,
		MarketTrend:      req.MarketTrend,
		Status:           "active",
		NextRunAt:        &nextRunAt,
	}

	if task.MaxResults == 0 {
		task.MaxResults = 10
	}

	if err := c.db.Create(&task).Error; err != nil {
		logger.Error("Failed to create schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule task"})
		return
	}

	logger.Info("Schedule task created", zap.Int("id", task.ID), zap.String("name", task.Name))
	ctx.JSON(http.StatusCreated, toTaskResponse(task))
}

// Update 更新定时任务
// PUT /api/v1/schedule/:id
func (c *ScheduleController) Update(ctx *gin.Context) {
	id := ctx.Param("id")

	var req UpdateScheduleTaskRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var task content.ScheduleTask
	if err := c.db.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		logger.Error("Failed to get schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get schedule task"})
		return
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Frequency != nil {
		updates["frequency"] = *req.Frequency
	}
	if req.ExecuteTime != nil {
		updates["execute_time"] = *req.ExecuteTime
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.MinPrice != nil {
		updates["min_price"] = *req.MinPrice
	}
	if req.MaxPrice != nil {
		updates["max_price"] = *req.MaxPrice
	}
	if req.MinRating != nil {
		updates["min_rating"] = *req.MinRating
	}
	if req.AutoAdd != nil {
		updates["auto_add"] = *req.AutoAdd
	}
	if req.MaxResults != nil {
		updates["max_results"] = *req.MaxResults
	}
	if req.CompetitionLevel != nil {
		updates["competition_level"] = *req.CompetitionLevel
	}
	if req.MarketTrend != nil {
		updates["market_trend"] = *req.MarketTrend
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	// 如果更新了频率或执行时间，重新计算下次执行时间
	if req.Frequency != nil || req.ExecuteTime != nil {
		frequency := task.Frequency
		executeTime := task.ExecuteTime
		if req.Frequency != nil {
			frequency = *req.Frequency
		}
		if req.ExecuteTime != nil {
			executeTime = *req.ExecuteTime
		}
		nextRunAt := calculateNextRunAt(frequency, executeTime)
		updates["next_run_at"] = &nextRunAt
	}

	if err := c.db.Model(&task).Updates(updates).Error; err != nil {
		logger.Error("Failed to update schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update schedule task"})
		return
	}

	// 重新查询获取更新后的数据
	if err := c.db.First(&task, id).Error; err != nil {
		logger.Error("Failed to reload schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload schedule task"})
		return
	}

	logger.Info("Schedule task updated", zap.Int("id", task.ID))
	ctx.JSON(http.StatusOK, toTaskResponse(task))
}

// Delete 删除定时任务
// DELETE /api/v1/schedule/:id
func (c *ScheduleController) Delete(ctx *gin.Context) {
	id := ctx.Param("id")

	var task content.ScheduleTask
	if err := c.db.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		logger.Error("Failed to get schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get schedule task"})
		return
	}

	// 软删除（设置状态为 deleted）
	if err := c.db.Model(&task).Update("status", "deleted").Error; err != nil {
		logger.Error("Failed to delete schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete schedule task"})
		return
	}

	logger.Info("Schedule task deleted", zap.Int("id", task.ID))
	ctx.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}

// RunNow 立即执行任务
// POST /api/v1/schedule/:id/run
func (c *ScheduleController) RunNow(ctx *gin.Context) {
	id := ctx.Param("id")

	var task content.ScheduleTask
	if err := c.db.First(&task, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
			return
		}
		logger.Error("Failed to get schedule task", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get schedule task"})
		return
	}

	// 执行任务（这里调用AI推荐API）
	startTime := time.Now()
	history := content.ScheduleTaskHistory{
		TaskID:    task.ID,
		RunAt:     startTime,
		Status:    "success",
		TopProducts: "[]",
	}

	// TODO: 实际调用AI推荐逻辑
	// 这里先返回模拟结果
	history.ProductsFound = 8
	history.ProductsAdded = 3
	history.TopProducts = `[{"asin":"B08N5KWB9H","title":"Sony WH-1000XM4","aiScore":92},{"asin":"B0BDHB9Y8M","title":"Apple AirPods Pro","aiScore":88},{"asin":"B0CHX2F5QT","title":"Anker 便携充电宝","aiScore":85}]`
	history.ExecutionTime = int(time.Since(startTime).Milliseconds())

	// 保存历史记录
	if err := c.db.Create(&history).Error; err != nil {
		logger.Error("Failed to save task history", zap.Error(err))
	}

	// 更新任务状态
	now := time.Now()
	nextRunAt := calculateNextRunAt(task.Frequency, task.ExecuteTime)
	c.db.Model(&task).Updates(map[string]interface{}{
		"last_run_at": &now,
		"next_run_at": &nextRunAt,
		"run_count":   task.RunCount + 1,
	})

	logger.Info("Schedule task executed", zap.Int("id", task.ID))
	ctx.JSON(http.StatusOK, gin.H{
		"message":       "Task executed successfully",
		"productsFound": history.ProductsFound,
		"productsAdded": history.ProductsAdded,
		"executionTime": history.ExecutionTime,
	})
}

// GetHistory 获取任务执行历史
// GET /api/v1/schedule/:id/history
func (c *ScheduleController) GetHistory(ctx *gin.Context) {
	id := ctx.Param("id")

	var history []content.ScheduleTaskHistory
	if err := c.db.Where("task_id = ?", id).Order("run_at DESC").Limit(30).Find(&history).Error; err != nil {
		logger.Error("Failed to get task history", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get task history"})
		return
	}

	response := make([]TaskHistoryResponse, len(history))
	for i, h := range history {
		response[i] = TaskHistoryResponse{
			ID:            h.ID,
			TaskId:        h.TaskID,
			RunAt:         h.RunAt,
			Status:        h.Status,
			ProductsFound: h.ProductsFound,
			ProductsAdded: h.ProductsAdded,
			ErrorMessage:  h.ErrorMessage,
			ExecutionTime: h.ExecutionTime,
			CreatedAt:     h.CreatedAt,
			// TopProducts 需要解析 JSON，这里简化处理
			TopProducts: []TopProduct{},
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"history": response,
		"total":   len(response),
	})
}

// ============================================================================
// Helper Functions
// ============================================================================

// toTaskResponse 转换为响应格式
func toTaskResponse(task content.ScheduleTask) ScheduleTaskResponse {
	return ScheduleTaskResponse{
		ID:               task.ID,
		Name:             task.Name,
		Frequency:        task.Frequency,
		ExecuteTime:      task.ExecuteTime,
		Category:         task.Category,
		MinPrice:         task.MinPrice,
		MaxPrice:         task.MaxPrice,
		MinRating:        task.MinRating,
		AutoAdd:          task.AutoAdd,
		MaxResults:       task.MaxResults,
		CompetitionLevel: task.CompetitionLevel,
		MarketTrend:      task.MarketTrend,
		Status:           task.Status,
		LastRunAt:        task.LastRunAt,
		NextRunAt:        task.NextRunAt,
		RunCount:         task.RunCount,
		CreatedAt:        task.CreatedAt,
		UpdatedAt:        task.UpdatedAt,
	}
}

// calculateNextRunAt 计算下次执行时间
func calculateNextRunAt(frequency, executeTime string) time.Time {
	now := time.Now()

	// 解析执行时间 (HH:MM)
	hour, min := 0, 0
	if len(executeTime) >= 5 {
		fmt.Sscanf(executeTime, "%d:%d", &hour, &min)
	}

	// 计算今天的目标时间
	target := time.Date(now.Year(), now.Month(), now.Day(), hour, min, 0, 0, now.Location())

	switch frequency {
	case "daily":
		// 如果今天的执行时间已过，则设置为明天
		if target.Before(now) {
			target = target.Add(24 * time.Hour)
		}
	case "weekly":
		// 设置为下周的同一时间
		daysUntilNextWeek := 7 - int(now.Weekday())
		if daysUntilNextWeek == 0 && target.Before(now) {
			daysUntilNextWeek = 7
		}
		target = target.Add(time.Duration(daysUntilNextWeek) * 24 * time.Hour)
	case "monthly":
		// 设置为下个月的同一天
		target = target.AddDate(0, 1, 0)
		if target.Before(now) {
			target = target.AddDate(0, 1, 0)
		}
	}

	return target
}
