package content

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// ProductsController 产品控制器
type ProductsController struct {
	db *gorm.DB
}

// NewProductsController 创建产品控制器
func NewProductsController(db *gorm.DB) *ProductsController {
	return &ProductsController{db: db}
}

// ListRequest 产品列表请求
type ListProductsRequest struct {
	Category string `form:"category"`
	Status   string `form:"status"`
	Search   string `form:"search"`
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=100"`
}

// CreateProductRequest 创建产品请求
type CreateProductRequest struct {
	ASIN           string  `json:"asin" binding:"required"`
	Title          string  `json:"title" binding:"required"`
	Category       string  `json:"category"`
	Price          float64 `json:"price"`
	Rating         float64 `json:"rating"`
	ReviewCount    int     `json:"reviewCount"`
	ImageURL       string  `json:"imageUrl"`
	Status         string  `json:"status" binding:"oneof=pending researching covered ignored"`
	PotentialScore float64 `json:"potentialScore"`
}

// UpdateProductRequest 更新产品请求
type UpdateProductRequest struct {
	Title          *string  `json:"title"`
	Category       *string  `json:"category"`
	Price          *float64 `json:"price"`
	Rating         *float64 `json:"rating"`
	ReviewCount    *int     `json:"reviewCount"`
	ImageURL       *string  `json:"imageUrl"`
	Status         *string  `json:"status" binding:"omitempty,oneof=pending researching covered ignored"`
	PotentialScore *float64 `json:"potentialScore"`
}

// ListProductsResponse 产品列表响应
type ListProductsResponse struct {
	Products []content.Product `json:"products"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}

// RegisterRoutes 注册路由
func (c *ProductsController) RegisterRoutes(router *gin.RouterGroup) {
	products := router.Group("/products")
	{
		products.GET("", c.List)
		products.GET("/:asin", c.Get)
		products.POST("", c.Create)
		products.PUT("/:asin", c.Update)
		products.DELETE("/:asin", c.Delete)
		products.POST("/:asin/status", c.UpdateStatus)
		products.GET("/ai-recommend", c.AIRecommend)     // AI推荐选品
		products.POST("/fetch", c.FetchProduct)         // 采集产品信息
	}
}

// List 获取产品列表
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

	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Search != "" {
		query = query.Where("title LIKE ? OR asin LIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count products", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count products"})
		return
	}

	// 分页查询
	var products []content.Product
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&products).Error; err != nil {
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

// Get 获取单个产品
func (c *ProductsController) Get(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var product content.Product
	if err := c.db.Where("asin = ?", asin).First(&product).Error; err != nil {
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

// Create 创建产品
func (c *ProductsController) Create(ctx *gin.Context) {
	var req CreateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查 ASIN 是否已存在
	var existing content.Product
	if err := c.db.Where("asin = ?", req.ASIN).First(&existing).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "Product with this ASIN already exists"})
		return
	}

	product := content.Product{
		ASIN:           req.ASIN,
		Title:          req.Title,
		Category:       req.Category,
		Price:          req.Price,
		Rating:         req.Rating,
		ReviewCount:    req.ReviewCount,
		ImageURL:       req.ImageURL,
		Status:         req.Status,
		PotentialScore: req.PotentialScore,
	}

	if req.Status == "" {
		product.Status = "pending"
	}

	if err := c.db.Create(&product).Error; err != nil {
		logger.Error("Failed to create product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	logger.Info("Product created", zap.String("asin", product.ASIN), zap.Int("id", product.ID))
	ctx.JSON(http.StatusCreated, product)
}

// Update 更新产品
func (c *ProductsController) Update(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var req UpdateProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product content.Product
	if err := c.db.Where("asin = ?", asin).First(&product).Error; err != nil {
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
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Price != nil {
		updates["price"] = *req.Price
	}
	if req.Rating != nil {
		updates["rating"] = *req.Rating
	}
	if req.ReviewCount != nil {
		updates["review_count"] = *req.ReviewCount
	}
	if req.ImageURL != nil {
		updates["image_url"] = *req.ImageURL
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.PotentialScore != nil {
		updates["potential_score"] = *req.PotentialScore
	}

	if err := c.db.Model(&product).Updates(updates).Error; err != nil {
		logger.Error("Failed to update product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// 重新查询获取更新后的数据
	if err := c.db.Where("asin = ?", asin).First(&product).Error; err != nil {
		logger.Error("Failed to reload product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload product"})
		return
	}

	logger.Info("Product updated", zap.String("asin", product.ASIN))
	ctx.JSON(http.StatusOK, product)
}

// Delete 删除产品
func (c *ProductsController) Delete(ctx *gin.Context) {
	asin := ctx.Param("asin")

	if err := c.db.Where("asin = ?", asin).Delete(&content.Product{}).Error; err != nil {
		logger.Error("Failed to delete product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	logger.Info("Product deleted", zap.String("asin", asin))
	ctx.JSON(http.StatusOK, gin.H{"message": "Product deleted successfully"})
}

// UpdateStatusRequest 更新状态请求
type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending researching covered ignored"`
}

// UpdateStatus 更新产品状态
func (c *ProductsController) UpdateStatus(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var req UpdateStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product content.Product
	if err := c.db.Where("asin = ?", asin).First(&product).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
			return
		}
		logger.Error("Failed to get product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get product"})
		return
	}

	if err := c.db.Model(&product).Update("status", req.Status).Error; err != nil {
		logger.Error("Failed to update product status", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product status"})
		return
	}

	logger.Info("Product status updated", zap.String("asin", asin), zap.String("status", req.Status))
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Status updated successfully",
		"status":   req.Status,
	})
}

// AIRecommendRequest AI推荐请求
type AIRecommendRequest struct {
	Category string `form:"category"`
	Limit    int    `form:"limit" binding:"min=1,max=20"`
}

// AIRecommendedProduct AI推荐产品响应
type AIRecommendedProduct struct {
	ASIN             string  `json:"asin"`
	Title            string  `json:"title"`
	Price            float64 `json:"price"`
	ImageURL         string  `json:"imageUrl"`
	Rating           float64 `json:"rating"`
	ReviewCount      int     `json:"reviewCount"`
	AIScore          int     `json:"aiScore"`
	AIReason         string  `json:"aiReason"`
	MarketTrend      string  `json:"marketTrend"`
	CompetitionLevel string  `json:"competitionLevel"`
	URL              string  `json:"url"`
}

// AIRecommend AI推荐选品
func (c *ProductsController) AIRecommend(ctx *gin.Context) {
	var req AIRecommendRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 默认参数
	if req.Limit == 0 {
		req.Limit = 10
	}
	if req.Category == "" {
		req.Category = "all"
	}

	// TODO: 接入Amazon Product Advertising API
	// 目前返回模拟数据（基于实际市场趋势）
	mockProducts := []AIRecommendedProduct{
		{
			ASIN:             "B08N5KWB9H",
			Title:            "Sony WH-1000XM4 无线降噪耳机",
			Price:            349.99,
			ImageURL:         "https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg",
			Rating:           4.7,
			ReviewCount:      45230,
			AIScore:          92,
			AIReason:         "高评分(4.7)、高销量(45K+评论)、降噪耳机品类领先者、利润空间约$80",
			MarketTrend:      "rising",
			CompetitionLevel: "medium",
			URL:              "https://www.amazon.com/dp/B08N5KWB9H",
		},
		{
			ASIN:             "B0BDHB9Y8M",
			Title:            "Apple AirPods Pro (2代)",
			Price:            249.00,
			ImageURL:         "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:           4.6,
			ReviewCount:      89450,
			AIScore:          85,
			AIReason:         "品牌效应强、高复购率、适合内容创作、但竞争激烈",
			MarketTrend:      "stable",
			CompetitionLevel: "high",
			URL:              "https://www.amazon.com/dp/B0BDHB9Y8M",
		},
		{
			ASIN:             "B0CHX2F5QT",
			Title:            "Anker 便携充电宝 26800mAh",
			Price:            65.99,
			ImageURL:         "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:           4.8,
			ReviewCount:      128000,
			AIScore:          88,
			AIReason:         "价格亲民($65)、超高评分(4.8)、刚需产品、转化率高、竞争度低",
			MarketTrend:      "rising",
			CompetitionLevel: "low",
			URL:              "https://www.amazon.com/dp/B0CHX2F5QT",
		},
	}

	// 限制数量
	if req.Limit < len(mockProducts) {
		mockProducts = mockProducts[:req.Limit]
	}

	logger.Info("AI recommendation request", zap.String("category", req.Category), zap.Int("limit", req.Limit))

	ctx.JSON(http.StatusOK, gin.H{
		"products": mockProducts,
	})
}

// FetchProductRequest 采集产品请求
type FetchProductRequest struct {
	ASIN string `json:"asin" binding:"required"`
}

// FetchProduct 采集产品信息（从Amazon API获取）
func (c *ProductsController) FetchProduct(ctx *gin.Context) {
	var req FetchProductRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: 调用Amazon Product Advertising API获取产品详情
	// 目前返回模拟数据
	logger.Info("Fetch product request", zap.String("asin", req.ASIN))

	// 模拟产品数据（实际应从Amazon API获取）
	product := gin.H{
		"asin":       req.ASIN,
		"title":      "Product " + req.ASIN,
		"price":      99.99,
		"imageUrl":   "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
		"rating":     4.5,
		"reviewCount": 1000,
		"status":     "pending",
	}

	ctx.JSON(http.StatusOK, gin.H{
		"product": product,
	})
}
