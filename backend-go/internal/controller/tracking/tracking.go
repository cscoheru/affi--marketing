package tracking

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
	service := core.NewTrackingService(db)
	controller := NewTrackingController(service)

	tracking := r.Group("/tracking")
	{
		tracking.POST("/events", controller.RecordEvent)
		tracking.GET("/events/:id", controller.GetEvent)
		tracking.GET("/events", controller.ListEvents)
	}
}

// TrackingController 追踪控制器
type TrackingController struct {
	service *core.TrackingService
	logger  *zap.Logger
}

// NewTrackingController 创建控制器
func NewTrackingController(service *core.TrackingService) *TrackingController {
	return &TrackingController{
		service: service,
		logger:  logger.L(),
	}
}

// RecordEvent 记录追踪事件
// @Summary 记录追踪事件
// @Tags 追踪
// @Accept json
// @Produce json
// @Param event body model.Track true "追踪事件"
// @Success 201 {object} Response
// @Router /api/v1/tracking/events [post]
func (ctrl *TrackingController) RecordEvent(c *gin.Context) {
	var req model.Track
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid request body",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	if err := ctrl.service.RecordEvent(c.Request.Context(), &req); err != nil {
		ctrl.logger.Error("Failed to record event",
			zap.String("experiment_id", req.ExperimentID),
			zap.String("event_type", req.EventType),
			zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   err.Error(),
			"timestamp": time.Now().Unix(),
		})
		return
	}

	ctrl.logger.Info("Event recorded",
		zap.String("experiment_id", req.ExperimentID),
		zap.String("event_type", req.EventType),
		zap.String("tracking_id", req.TrackingID))

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"code":    201,
		"message": "Event recorded",
		"data": gin.H{
			"event_id":    req.ID,
			"tracking_id": req.TrackingID,
		},
		"timestamp": time.Now().Unix(),
	})
}

// GetEvent 获取追踪事件
// @Summary 获取追踪事件
// @Tags 追踪
// @Produce json
// @Param id path int true "事件 ID"
// @Success 200 {object} Response
// @Router /api/v1/tracking/events/{id} [get]
func (ctrl *TrackingController) GetEvent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"code":      400,
			"message":   "Invalid event ID",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	event, err := ctrl.service.GetEvent(c.Request.Context(), uint(id))
	if err != nil {
		ctrl.logger.Error("Failed to get event", zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{
			"success":   false,
			"code":      404,
			"message":   "Event not found",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"code":      200,
		"message":   "success",
		"data":      event,
		"timestamp": time.Now().Unix(),
	})
}

// ListEvents 获取追踪事件列表
// @Summary 获取追踪事件列表
// @Tags 追踪
// @Produce json
// @Param experiment_id query int false "实验 ID"
// @Param tracking_id query string false "追踪 ID"
// @Param event_type query string false "事件类型"
// @Param page query int false "页码"
// @Param size query int false "每页数量"
// @Success 200 {object} Response
// @Router /api/v1/tracking/events [get]
func (ctrl *TrackingController) ListEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

	experimentID, _ := strconv.ParseUint(c.Query("experiment_id"), 10, 32)
	trackingID := c.Query("tracking_id")
	eventType := c.Query("event_type")

	filter := core.TrackFilter{
		ExperimentID: uint(experimentID),
		TrackingID:   trackingID,
		EventType:    eventType,
		Page:         page,
		Size:         size,
	}

	events, total, err := ctrl.service.ListEvents(c.Request.Context(), filter)
	if err != nil {
		ctrl.logger.Error("Failed to list events", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success":   false,
			"code":      500,
			"message":   "Failed to list events",
			"timestamp": time.Now().Unix(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    200,
		"message": "success",
		"data": gin.H{
			"items": events,
			"total": total,
			"page":  page,
			"size":  size,
		},
		"timestamp": time.Now().Unix(),
	})
}
