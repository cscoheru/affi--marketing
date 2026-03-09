package content

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有内容自动化相关的路由
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	// 创建各个控制器
	marketsController := NewMarketsController(db)       // 新增：市场战略控制器
	productsController := NewProductsController(db)     // 将重构：产品研发控制器
	materialsController := NewMaterialsController(db)
	contentsController := NewContentsController(db)
	publishController := NewPublishController(db)
	analyticsController := NewAnalyticsController(db)
	scheduleController := NewScheduleController(db)     // 新增：定时任务控制器

	// 注册各控制器的路由
	marketsController.RegisterRoutes(router)  // 新增：市场战略路由
	productsController.RegisterRoutes(router)
	materialsController.RegisterRoutes(router)
	contentsController.RegisterRoutes(router)
	publishController.RegisterRoutes(router)
	analyticsController.RegisterRoutes(router)
	scheduleController.RegisterRoutes(router) // 新增：定时任务路由
}
