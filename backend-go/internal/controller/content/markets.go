package content

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// MarketsController 市场战略控制器
// 处理市场机会（Amazon商品作为市场）的管理
type MarketsController struct {
	db *gorm.DB
}

// NewMarketsController 创建市场战略控制器
func NewMarketsController(db *gorm.DB) *MarketsController {
	return &MarketsController{db: db}
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

// ListMarketsRequest 市场列表请求
type ListMarketsRequest struct {
	Status   string `form:"status"`   // 按状态筛选
	Category string `form:"category"` // 按品类筛选
	Search   string `form:"search"`   // 搜索标题或ASIN
	Page     int    `form:"page" binding:"min=1"`
	PageSize int    `form:"pageSize" binding:"min=1,max=100"`
}

// ListMarketsResponse 市场列表响应
type ListMarketsResponse struct {
	Markets  []content.MarketOpportunity `json:"markets"`
	Total    int64                      `json:"total"`
	Page     int                        `json:"page"`
	PageSize int                        `json:"pageSize"`
}

// CreateMarketRequest 创建市场机会请求
type CreateMarketRequest struct {
	ASIN      string `json:"asin" binding:"required"`
	Title     string `json:"title" binding:"required"`
	Category  string `json:"category"`
	Price     string `json:"price"`
	Rating    string `json:"rating"`
	ReviewCount int    `json:"reviewCount"`
	ImageURL  string `json:"imageUrl"`
	Status    string  `json:"status" binding:"omitempty,oneof=watching targeting active saturated exited"`
	MarketSize       string `json:"marketSize" binding:"omitempty,oneof=large medium small"`
	CompetitionLevel string `json:"competitionLevel" binding:"omitempty,oneof=high medium low"`
	ContentPotential string `json:"contentPotential" binding:"omitempty,oneof=high medium low"`
	AIScore          int    `json:"aiScore" binding:"min=0,max=100"`
}

// UpdateMarketRequest 更新市场机会请求
type UpdateMarketRequest struct {
	Title            *string `json:"title"`
	Category         *string `json:"category"`
	Price            *string `json:"price"`
	Rating           *string `json:"rating"`
	ImageURL         *string `json:"imageUrl"`
	MarketSize       *string `json:"marketSize" binding:"omitempty,oneof=large medium small"`
	CompetitionLevel *string `json:"competitionLevel" binding:"omitempty,oneof=high medium low"`
	ContentPotential *string `json:"contentPotential" binding:"omitempty,oneof=high medium low"`
	AIScore          *int    `json:"aiScore" binding:"omitempty,min=0,max=100"`
}

// UpdateMarketStatusRequest 更新市场状态请求
type UpdateMarketStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=watching targeting active saturated exited"`
}

// FetchMarketRequest 一键采集请求
type FetchMarketRequest struct {
	ASIN string `json:"asin" binding:"required"`
}

// ============================================================================
// Route Registration
// ============================================================================

// RegisterRoutes 注册路由
func (c *MarketsController) RegisterRoutes(router *gin.RouterGroup) {
	markets := router.Group("/markets")
	{
		// 注意：固定路径路由必须在参数化路由之前注册
		markets.GET("", c.List)
		markets.POST("", c.Create)
		markets.GET("/ai-recommend", c.AIRecommend) // AI推荐市场 - 必须在 /:asin 之前
		markets.POST("/fetch", c.FetchMarket)       // 一键采集 - 必须在 /:asin 之前
		markets.GET("/:asin", c.Get)
		markets.PUT("/:asin", c.Update)
		markets.DELETE("/:asin", c.Delete)          // 删除市场
		markets.POST("/:asin/status", c.UpdateStatus)
		markets.GET("/:asin/products", c.GetProducts) // 获取关联的内容
	}
}

// ============================================================================
// Handlers
// ============================================================================

// List 获取市场列表
// GET /api/v1/markets?status=active&page=1&pageSize=20
func (c *MarketsController) List(ctx *gin.Context) {
	var req ListMarketsRequest
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
	query := c.db.Model(&content.MarketOpportunity{})

	if req.Status != "" {
		query = query.Where("status = ?", req.Status)
	}
	if req.Category != "" {
		query = query.Where("category = ?", req.Category)
	}
	if req.Search != "" {
		query = query.Where("title LIKE ? OR asin LIKE ?", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count markets", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count markets"})
		return
	}

	// 分页查询
	var markets []content.MarketOpportunity
	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(req.PageSize).Find(&markets).Error; err != nil {
		logger.Error("Failed to list markets", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list markets"})
		return
	}

	ctx.JSON(http.StatusOK, ListMarketsResponse{
		Markets:  markets,
		Total:    total,
		Page:     req.Page,
		PageSize: req.PageSize,
	})
}

// Get 获取单个市场详情
// GET /api/v1/markets/:asin
func (c *MarketsController) Get(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var market content.MarketOpportunity
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
		return
	}

	ctx.JSON(http.StatusOK, market)
}

// Create 创建市场机会
// POST /api/v1/markets
func (c *MarketsController) Create(ctx *gin.Context) {
	var req CreateMarketRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查 ASIN 是否已存在
	var existing content.MarketOpportunity
	if err := c.db.Where("asin = ?", req.ASIN).First(&existing).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "Market with this ASIN already exists"})
		return
	}

	// 处理空字符串 - PostgreSQL numeric 类型不接受空字符串
	price := req.Price
	if price == "" {
		price = "0"
	}
	rating := req.Rating
	if rating == "" {
		rating = "0"
	}

	market := content.MarketOpportunity{
		ASIN:             req.ASIN,
		Title:            req.Title,
		Category:         req.Category,
		Price:            price,
		Rating:           rating,
		ReviewCount:      req.ReviewCount,
		ImageURL:         req.ImageURL,
		Status:           req.Status,
		MarketSize:       req.MarketSize,
		CompetitionLevel: req.CompetitionLevel,
		ContentPotential: req.ContentPotential,
		AIScore:          req.AIScore,
	}

	if market.Status == "" {
		market.Status = "watching"
	}

	if err := c.db.Create(&market).Error; err != nil {
		logger.Error("Failed to create market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create market"})
		return
	}

	logger.Info("Market created", zap.String("asin", market.ASIN), zap.Int("id", market.ID))
	ctx.JSON(http.StatusCreated, market)
}

// Update 更新市场信息
// PUT /api/v1/markets/:asin
func (c *MarketsController) Update(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var req UpdateMarketRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var market content.MarketOpportunity
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
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
	if req.ImageURL != nil {
		updates["image_url"] = *req.ImageURL
	}
	if req.MarketSize != nil {
		updates["market_size"] = *req.MarketSize
	}
	if req.CompetitionLevel != nil {
		updates["competition_level"] = *req.CompetitionLevel
	}
	if req.ContentPotential != nil {
		updates["content_potential"] = *req.ContentPotential
	}
	if req.AIScore != nil {
		updates["ai_score"] = *req.AIScore
	}

	if err := c.db.Model(&market).Updates(updates).Error; err != nil {
		logger.Error("Failed to update market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update market"})
		return
	}

	// 重新查询获取更新后的数据
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		logger.Error("Failed to reload market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reload market"})
		return
	}

	logger.Info("Market updated", zap.String("asin", market.ASIN))
	ctx.JSON(http.StatusOK, market)
}

// UpdateStatus 更新市场状态
// POST /api/v1/markets/:asin/status
func (c *MarketsController) UpdateStatus(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var req UpdateMarketStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var market content.MarketOpportunity
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
		return
	}

	if err := c.db.Model(&market).Update("status", req.Status).Error; err != nil {
		logger.Error("Failed to update market status", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update market status"})
		return
	}

	logger.Info("Market status updated", zap.String("asin", asin), zap.String("status", req.Status))
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Status updated successfully",
		"status":   req.Status,
	})
}

// Delete 删除市场
// DELETE /api/v1/markets/:asin
func (c *MarketsController) Delete(ctx *gin.Context) {
	asin := ctx.Param("asin")

	var market content.MarketOpportunity
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
		return
	}

	// 删除关联的 product_markets 记录
	if err := c.db.Where("market_id = ?", market.ID).Delete(&content.ProductMarket{}).Error; err != nil {
		logger.Error("Failed to delete market associations", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete market associations"})
		return
	}

	// 删除市场
	if err := c.db.Delete(&market).Error; err != nil {
		logger.Error("Failed to delete market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete market"})
		return
	}

	logger.Info("Market deleted", zap.String("asin", asin))
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Market deleted successfully",
	})
}

// FetchProduct 一键采集市场信息（从Amazon API获取）
// POST /api/v1/markets/fetch
func (c *MarketsController) FetchMarket(ctx *gin.Context) {
	var req FetchMarketRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Fetch market request", zap.String("asin", req.ASIN))

	// 检查是否已存在
	var existingMarket content.MarketOpportunity
	if err := c.db.Where("asin = ?", req.ASIN).First(&existingMarket).Error; err == nil {
		// 已存在，返回现有数据
		logger.Info("Market already exists", zap.String("asin", req.ASIN))
		ctx.JSON(http.StatusOK, gin.H{
			"market":   existingMarket,
			"message":  "该产品已存在于市场库中",
			"existing": true,
		})
		return
	}

	// TODO: 调用Amazon Product Advertising API获取产品详情
	// 目前使用模拟数据
	market := &content.MarketOpportunity{
		ASIN:        req.ASIN,
		Title:       "Product " + req.ASIN,
		Price:       "99.99",
		Rating:      "4.5",
		ReviewCount: 1000,
		ImageURL:    "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
		Status:      "watching",
		Category:    "unknown",
	}

	// 保存到数据库
	if err := c.db.Create(market).Error; err != nil {
		logger.Error("Failed to save fetched market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "保存产品失败"})
		return
	}

	logger.Info("Market fetched and saved", zap.String("asin", req.ASIN))
	ctx.JSON(http.StatusOK, gin.H{
		"market":   market,
		"message":  "产品采集成功",
		"existing": false,
	})
}

// AIRecommendMarketsRequest AI推荐市场机会请求
// GET /api/v1/markets/ai-recommend?category=electronics&limit=10
type AIRecommendMarketsRequest struct {
	Category string `form:"category"`
	Limit    int    `form:"limit" binding:"min=1,max=20"`
}

type AIRecommendedMarket struct {
	ASIN             string `json:"asin"`
	Title            string `json:"title"`
	Price            string `json:"price"`
	ImageURL         string `json:"imageUrl"`
	Rating           string `json:"rating"`
	ReviewCount      int     `json:"reviewCount"`
	AIScore          int     `json:"aiScore"`
	AIReason         string  `json:"aiReason"`
	MarketTrend      string  `json:"marketTrend"`
	CompetitionLevel string  `json:"competitionLevel"`
	URL              string  `json:"url"`
}

func (c *MarketsController) AIRecommend(ctx *gin.Context) {
	var req AIRecommendMarketsRequest
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

	// TODO: 接入Amazon Product Advertising API进行AI分析
	// 目前返回模拟数据（基于实际市场趋势）
	mockMarkets := []AIRecommendedMarket{
		{
			ASIN:             "B08N5KWB9H",
			Title:            "Sony WH-1000XM4 无线降噪耳机",
			Price:            "349.99",
			ImageURL:         "https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg",
			Rating:           "4.7",
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
			Price:            "249.00",
			ImageURL:         "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:           "4.6",
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
			Price:            "65.99",
			ImageURL:         "https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg",
			Rating:           "4.8",
			ReviewCount:      128000,
			AIScore:          88,
			AIReason:         "价格亲民($65)、超高评分(4.8)、刚需产品、转化率高、竞争度低",
			MarketTrend:      "rising",
			CompetitionLevel: "low",
			URL:              "https://www.amazon.com/dp/B0CHX2F5QT",
		},
	}

	// 限制数量
	if req.Limit < len(mockMarkets) {
		mockMarkets = mockMarkets[:req.Limit]
	}

	logger.Info("AI recommendation request", zap.String("category", req.Category), zap.Int("limit", req.Limit))

	ctx.JSON(http.StatusOK, gin.H{
		"markets": mockMarkets,
	})
}

// GetProducts 获取市场关联的内容
// GET /api/v1/markets/:asin/products
func (c *MarketsController) GetProducts(ctx *gin.Context) {
	asin := ctx.Param("asin")

	// 首先查找市场
	var market content.MarketOpportunity
	if err := c.db.Where("asin = ?", asin).First(&market).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Market not found"})
			return
		}
		logger.Error("Failed to get market", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market"})
		return
	}

	// 查找关联的内容
	var productMarkets []content.ProductMarket
	if err := c.db.Where("market_id = ?", market.ID).Preload("Product").Find(&productMarkets).Error; err != nil {
		logger.Error("Failed to get associated products", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get associated products"})
		return
	}

	// 提取产品列表
	products := make([]content.Product, 0, len(productMarkets))
	for _, pm := range productMarkets {
		if pm.Product != nil {
			products = append(products, *pm.Product)
		}
	}

	ctx.JSON(http.StatusOK, gin.H{
		"market":   market,
		"products": products,
		"total":    len(products),
	})
}
