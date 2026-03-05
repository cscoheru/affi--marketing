package experiment

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/core"
	"github.com/zenconsult/affi-marketing/internal/model"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	service := core.NewExperimentService(db)
	controller := NewExperimentController(service)

	experiments := r.Group("/experiments")
	{
		experiments.GET("", controller.List)
		experiments.POST("", controller.Create)
		experiments.GET("/:id", controller.Get)
		experiments.PUT("/:id", controller.Update)
		experiments.DELETE("/:id", controller.Delete)
		experiments.POST("/:id/start", controller.Start)
		experiments.POST("/:id/stop", controller.Stop)
		experiments.POST("/:id/pause", controller.Pause)
	}
}

// ExperimentController 实验控制器
type ExperimentController struct {
	service *core.ExperimentService
	logger  *zap.Logger
}

// NewExperimentController 创建控制器
func NewExperimentController(service *core.ExperimentService) *ExperimentController {
	return &ExperimentController{
		service: service,
		logger:  logger.L(),
	}
}

// List 获取实验列表
// @Summary 获取实验列表
// @Tags 实验
// @Produce json
// @Param page query int false "页码"
// @Param size query int false "每页数量"
// @Param type query string false "实验类型"
// @Param status query string false "状态"
// @Success 200 {object} Response
// @Router /api/v1/experiments [get]
func (ctrl *ExperimentController) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))
	expType := c.Query("type")
	status := c.Query("status")

	filter := core.ExperimentFilter{
		ExperimentType: expType,
		Status:         status,
		Page:           page,
		Size:           size,
	}

	experiments, total, err := ctrl.service.List(c.Request.Context(), filter)
	if err != nil {
		ctrl.logger.Error("Failed to list experiments", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   "Failed to list experiments",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    200,
		"message": "success",
		"data": gin.H{
			"items": experiments,
			"total": total,
			"page":  page,
			"size":  size,
		},
		"timestamp": time.Now().Unix(),
	})
}

// Get 获取实验详情
// @Summary 获取实验详情
// @Tags 实验
// @Produce json
// @Param id path string true "实验 ID"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id} [get]
func (ctrl *ExperimentController) Get(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	exp, err := ctrl.service.Get(c.Request.Context(), id)
	if err != nil {
		ctrl.logger.Error("Failed to get experiment", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{
			"success":   false,
			"code":      404,
			"message":   "Experiment not found",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "success",
		"data":      exp,
		"timestamp": time.Now().Unix(),
	})
}

// Create 创建实验
// @Summary 创建实验
// @Tags 实验
// @Accept json
// @Produce json
// @Param experiment body model.Experiment true "实验信息"
// @Success 201 {object} Response
// @Router /api/v1/experiments [post]
func (ctrl *ExperimentController) Create(c *gin.Context) {
	var req model.Experiment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid request body",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Create(c.Request.Context(), &req); err != nil {
		ctrl.logger.Error("Failed to create experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"code":      201,
		"message":   "Experiment created",
		"data":      req,
		"timestamp": time.Now().Unix(),
	})
}

// Update 更新实验
// @Summary 更新实验
// @Tags 实验
// @Accept json
// @Produce json
// @Param id path string true "实验 ID"
// @Param experiment body model.Experiment true "实验信息"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id} [put]
func (ctrl *ExperimentController) Update(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	var req model.Experiment
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid request body",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Update(c.Request.Context(), id, &req); err != nil {
		ctrl.logger.Error("Failed to update experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "Experiment updated",
		"data":      req,
		"timestamp": time.Now().Unix(),
	})
}

// Delete 删除实验
// @Summary 删除实验
// @Tags 实验
// @Produce json
// @Param id path int true "实验 ID"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id} [delete]
func (ctrl *ExperimentController) Delete(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Delete(c.Request.Context(), id); err != nil {
		ctrl.logger.Error("Failed to delete experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "Experiment deleted",
		"data":      nil,
		"timestamp": time.Now().Unix(),
	})
}

// Start 启动实验
// @Summary 启动实验
// @Tags 实验
// @Produce json
// @Param id path int true "实验 ID"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id}/start [post]
func (ctrl *ExperimentController) Start(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Start(c.Request.Context(), id); err != nil {
		ctrl.logger.Error("Failed to start experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "Experiment started",
		"data":      nil,
		"timestamp": time.Now().Unix(),
	})
}

// Stop 停止实验
// @Summary 停止实验
// @Tags 实验
// @Produce json
// @Param id path int true "实验 ID"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id}/stop [post]
func (ctrl *ExperimentController) Stop(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Stop(c.Request.Context(), id); err != nil {
		ctrl.logger.Error("Failed to stop experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "Experiment stopped",
		"data":      nil,
		"timestamp": time.Now().Unix(),
	})
}

// Pause 暂停实验
// @Summary 暂停实验
// @Tags 实验
// @Produce json
// @Param id path string true "实验 ID"
// @Success 200 {object} Response
// @Router /api/v1/experiments/{id}/pause [post]
func (ctrl *ExperimentController) Pause(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid experiment ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.Stop(c.Request.Context(), id); err != nil {
		ctrl.logger.Error("Failed to pause experiment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "Experiment paused",
		"data":      nil,
		"timestamp": time.Now().Unix(),
	})
}
