package settlement

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/core"
	settlementmodel "github.com/zenconsult/affi-marketing/internal/model/settlement"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
	// 使用最后点击归因作为默认归因方式
	service := core.NewSettlementService(db, core.AttributionLastClick)
	controller := NewSettlementController(service)

	settlementGroup := r.Group("/settlement")
	{
		settlementGroup.GET("/records", controller.ListRecords)
		settlementGroup.POST("/records", controller.CreateRecord)
		settlementGroup.POST("/records/:id/process", controller.ProcessRecord)
		settlementGroup.GET("/records/:id", controller.GetRecord)
	}
}

// SettlementController 结算控制器
type SettlementController struct {
	service *core.SettlementService
	logger  *zap.Logger
}

// NewSettlementController 创建控制器
func NewSettlementController(service *core.SettlementService) *SettlementController {
	return &SettlementController{
		service: service,
		logger:  logger.L(),
	}
}

// ListRecords 获取结算记录列表
// @Summary 获取结算记录列表
// @Tags 结算
// @Produce json
// @Param experiment_id query int false "实验 ID"
// @Param status query string false "状态"
// @Param page query int false "页码"
// @Param size query int false "每页数量"
// @Success 200 {object} Response
// @Router /api/v1/settlement/records [get]
func (ctrl *SettlementController) ListRecords(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	experimentID, _ := strconv.ParseUint(c.Query("experiment_id"), 10, 32)
	status := c.Query("status")

	filter := core.SettlementFilter{
		ExperimentID: uint(experimentID),
		Status:       status,
		Page:         page,
		Size:         size,
	}

	records, total, err := ctrl.service.ListRecords(c.Request.Context(), filter)
	if err != nil {
		ctrl.logger.Error("Failed to list settlement records", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   "Failed to list settlement records",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    200,
		"message": "success",
		"data": gin.H{
			"items": records,
			"total": total,
			"page":  page,
			"size":  size,
		},
		"timestamp": time.Now().Unix(),
	})
}

// CreateRecord 创建结算记录
// @Summary 创建结算记录
// @Tags 结算
// @Accept json
// @Produce json
// @Param record body settlementmodel.SettlementRecord true "结算记录"
// @Success 201 {object} Response
// @Router /api/v1/settlement/records [post]
func (ctrl *SettlementController) CreateRecord(c *gin.Context) {
	var req struct {
		ExperimentID uint      `json:"experiment_id" binding:"required"`
		StartDate    time.Time `json:"start_date" binding:"required"`
		EndDate      time.Time `json:"end_date" binding:"required"`
		Description  string    `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid request body",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	record := &settlementmodel.SettlementRecord{
		ExperimentID: req.ExperimentID,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Description:  req.Description,
	}

	if err := ctrl.service.CreateRecord(c.Request.Context(), record); err != nil {
		ctrl.logger.Error("Failed to create settlement record", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"code":    201,
		"message": "Settlement record created",
		"data":    record,
		"timestamp": time.Now().Unix(),
	})
}

// ProcessRecord 处理结算记录
// @Summary 处理结算记录
// @Tags 结算
// @Produce json
// @Param id path int true "记录 ID"
// @Success 200 {object} Response
// @Router /api/v1/settlement/records/{id}/process [post]
func (ctrl *SettlementController) ProcessRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid record ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	ctrl.logger.Info("Processing settlement record", zap.Uint("id", uint(id)))

	if err := ctrl.service.ProcessRecord(c.Request.Context(), uint(id)); err != nil {
		ctrl.logger.Error("Failed to process settlement record", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    200,
		"message": "Settlement processed",
		"data":    nil,
		"timestamp": time.Now().Unix(),
	})
}

// GetRecord 获取结算记录详情
// @Summary 获取结算记录详情
// @Tags 结算
// @Produce json
// @Param id path int true "记录 ID"
// @Success 200 {object} Response
// @Router /api/v1/settlement/records/{id} [get]
func (ctrl *SettlementController) GetRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid record ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	record, err := ctrl.service.GetRecord(c.Request.Context(), uint(id))
	if err != nil {
		ctrl.logger.Error("Failed to get settlement record", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{
			"success":   false,
			"code":      404,
			"message":   "Settlement record not found",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    200,
		"message": "success",
		"data":    record,
		"timestamp": time.Now().Unix(),
	})
}
