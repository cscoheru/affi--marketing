package content

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册所有内容自动化相关的路由
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	// 创建各个控制器
	authController := NewAuthController(db)
	productsController := NewProductsController(db)
	materialsController := NewMaterialsController(db)
	contentsController := NewContentsController(db)
	publishController := NewPublishController(db)
	analyticsController := NewAnalyticsController(db)

	// 注册各控制器的路由
	authController.RegisterRoutes(router)
	productsController.RegisterRoutes(router)
	materialsController.RegisterRoutes(router)
	contentsController.RegisterRoutes(router)
	publishController.RegisterRoutes(router)
	analyticsController.RegisterRoutes(router)
}
