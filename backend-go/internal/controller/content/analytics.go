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

// AnalyticsController 分析控制器
type AnalyticsController struct {
	db *gorm.DB
}

// NewAnalyticsController 创建分析控制器
func NewAnalyticsController(db *gorm.DB) *AnalyticsController {
	return &AnalyticsController{db: db}
}

// RegisterRoutes 注册路由
func (c *AnalyticsController) RegisterRoutes(router *gin.RouterGroup) {
	analytics := router.Group("/analytics")
	{
		analytics.GET("/stats", c.GetStats)
		analytics.GET("/content-performance", c.GetContentPerformance)
		analytics.GET("/trends", c.GetTrends)
	}
}

// StatsResponse 统计响应
type StatsResponse struct {
	TotalRevenue    float64 `json:"totalRevenue"`
	TotalViews      int64   `json:"totalViews"`
	TotalClicks     int64   `json:"totalClicks"`
	ConversionRate  float64 `json:"conversionRate"`
	PublishedCount  int64   `json:"publishedCount"`
	Trends          *TrendsData `json:"trends,omitempty"`
}

// TrendsData 趋势数据
type TrendsData struct {
	RevenueChange float64 `json:"revenueChange"`
	ViewsChange   float64 `json:"viewsChange"`
	ClicksChange  float64 `json:"clicksChange"`
}

// GetStats 获取统计数据
func (c *AnalyticsController) GetStats(ctx *gin.Context) {
	// 解析日期范围
	startDate := ctx.Query("startDate")
	endDate := ctx.Query("endDate")

	// 默认最近30天
	var start, end time.Time
	if endDate != "" {
		var err error
		end, err = time.Parse("2006-01-02", endDate)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid endDate format, use YYYY-MM-DD"})
			return
		}
	} else {
		end = time.Now()
	}

	if startDate != "" {
		var err error
		start, err = time.Parse("2006-01-02", startDate)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid startDate format, use YYYY-MM-DD"})
			return
		}
	} else {
		start = end.AddDate(0, 0, -30)
	}

	// 从 analytics_stats 表获取统计数据
	var stats content.AnalyticsStats
	err := c.db.Where("date BETWEEN ? AND ?", start, end).
		Order("date DESC").
		First(&stats).Error

	response := StatsResponse{}

	if err == nil {
		response.TotalRevenue = stats.TotalRevenue
		response.TotalViews = int64(stats.TotalViews)
		response.TotalClicks = int64(stats.TotalClicks)
		response.PublishedCount = int64(stats.PublishedCount)

		if stats.TotalClicks > 0 {
			response.ConversionRate = float64(stats.TotalConversions) / float64(stats.TotalClicks) * 100
		}
	} else if err == gorm.ErrRecordNotFound {
		// 如果没有统计数据，返回零值
		response.TotalRevenue = 0
		response.TotalViews = 0
		response.TotalClicks = 0
		response.ConversionRate = 0
		response.PublishedCount = 0
	} else {
		logger.Error("Failed to get analytics stats", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get analytics stats"})
		return
	}

	// 获取趋势数据（与上一个周期比较）
	previousStart := start.AddDate(0, 0, -int(end.Sub(start).Hours()/24))
	previousEnd := start

	var previousStats content.AnalyticsStats
	err = c.db.Where("date BETWEEN ? AND ?", previousStart, previousEnd).
		Order("date DESC").
		First(&previousStats).Error

	if err == nil {
		response.Trends = &TrendsData{
			RevenueChange: calculateChange(stats.TotalRevenue, previousStats.TotalRevenue),
			ViewsChange:   calculateChange(float64(stats.TotalViews), float64(previousStats.TotalViews)),
			ClicksChange:  calculateChange(float64(stats.TotalClicks), float64(previousStats.TotalClicks)),
		}
	}

	ctx.JSON(http.StatusOK, response)
}

// calculateChange 计算变化百分比
func calculateChange(current, previous float64) float64 {
	if previous == 0 {
		return 0
	}
	return ((current - previous) / previous) * 100
}

// ContentPerformanceResponse 内容表现响应
type ContentPerformanceResponse struct {
	Contents []ContentPerformanceItem `json:"contents"`
	Total    int64                    `json:"total"`
}

// ContentPerformanceItem 内容表现项
type ContentPerformanceItem struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Views       int     `json:"views"`
	Clicks      int     `json:"clicks"`
	Conversions int     `json:"conversions"`
	Revenue     float64 `json:"revenue"`
	CTR         float64 `json:"ctr"`         // Click-through rate
	ConvRate    float64 `json:"convRate"`    // Conversion rate
}

// GetContentPerformance 获取内容表现数据
func (c *AnalyticsController) GetContentPerformance(ctx *gin.Context) {
	limit := ctx.DefaultQuery("limit", "50")
	sortBy := ctx.DefaultQuery("sortBy", "revenue")

	// 解析 limit
	var limitInt int
	if _, err := fmt.Sscanf(limit, "%d", &limitInt); err != nil || limitInt <= 0 || limitInt > 100 {
		limitInt = 50
	}

	// 构建查询
	query := c.db.Table("contents c").
		Select("c.id, c.title, COALESCE(cp.views, 0) as views, COALESCE(cp.clicks, 0) as clicks, "+
			"COALESCE(cp.conversions, 0) as conversions, COALESCE(cp.revenue, 0) as revenue").
		Joins("LEFT JOIN content_performance cp ON c.id = cp.content_id").
		Where("c.status = ?", "published")

	// 排序
	orderClause := "revenue DESC"
	switch sortBy {
	case "views":
		orderClause = "views DESC"
	case "clicks":
		orderClause = "clicks DESC"
	case "conversions":
		orderClause = "conversions DESC"
	}
	query = query.Order(orderClause)

	// 获取总数
	var total int64
	query.Count(&total)

	// 限制结果
	query = query.Limit(limitInt)

	type result struct {
		ID          int     `json:"id"`
		Title       string  `json:"title"`
		Views       int     `json:"views"`
		Clicks      int     `json:"clicks"`
		Conversions int     `json:"conversions"`
		Revenue     float64 `json:"revenue"`
	}

	var results []result
	if err := query.Scan(&results).Error; err != nil {
		logger.Error("Failed to get content performance", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get content performance"})
		return
	}

	// 转换为响应格式
	items := make([]ContentPerformanceItem, len(results))
	for i, r := range results {
		items[i] = ContentPerformanceItem{
			ID:          r.ID,
			Title:       r.Title,
			Views:       r.Views,
			Clicks:      r.Clicks,
			Conversions: r.Conversions,
			Revenue:     r.Revenue,
		}

		// 计算 CTR
		if r.Views > 0 {
			items[i].CTR = float64(r.Clicks) / float64(r.Views) * 100
		}

		// 计算转化率
		if r.Clicks > 0 {
			items[i].ConvRate = float64(r.Conversions) / float64(r.Clicks) * 100
		}
	}

	ctx.JSON(http.StatusOK, ContentPerformanceResponse{
		Contents: items,
		Total:    total,
	})
}

// TrendsResponse 趋势响应
type TrendsResponse struct {
	Daily   []TrendDataPoint `json:"daily"`
	Weekly  []TrendDataPoint `json:"weekly"`
	Monthly []TrendDataPoint `json:"monthly"`
}

// TrendDataPoint 趋势数据点
type TrendDataPoint struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
	Views   int     `json:"views"`
	Clicks  int     `json:"clicks"`
}

// GetTrends 获取趋势数据
func (c *AnalyticsController) GetTrends(ctx *gin.Context) {
	period := ctx.DefaultQuery("period", "daily")
	limit := ctx.DefaultQuery("limit", "30")

	var limitInt int
	if _, err := fmt.Sscanf(limit, "%d", &limitInt); err != nil || limitInt <= 0 || limitInt > 365 {
		limitInt = 30
	}

	var dataPoints []TrendDataPoint

	switch period {
	case "daily":
		// 获取每日数据
		rows, err := c.db.Table("analytics_stats").
			Select("date, total_revenue as revenue, total_views as views, total_clicks as clicks").
			Order("date DESC").
			Limit(limitInt).
			Rows()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trends"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var dp TrendDataPoint
			var date time.Time
			if err := rows.Scan(&date, &dp.Revenue, &dp.Views, &dp.Clicks); err != nil {
				continue
			}
			dp.Date = date.Format("2006-01-02")
			dataPoints = append(dataPoints, dp)
		}

	case "weekly":
		// 获取每周数据（聚合）
		rows, err := c.db.Raw(`
			SELECT
				DATE_TRUNC('week', date) as week,
				SUM(total_revenue) as revenue,
				SUM(total_views) as views,
				SUM(total_clicks) as clicks
			FROM analytics_stats
			GROUP BY DATE_TRUNC('week', date)
			ORDER BY week DESC
			LIMIT ?
		`, limitInt).Rows()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trends"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var dp TrendDataPoint
			var week time.Time
			if err := rows.Scan(&week, &dp.Revenue, &dp.Views, &dp.Clicks); err != nil {
				continue
			}
			dp.Date = week.Format("2006-W01")
			dataPoints = append(dataPoints, dp)
		}

	case "monthly":
		// 获取每月数据（聚合）
		rows, err := c.db.Raw(`
			SELECT
				DATE_TRUNC('month', date) as month,
				SUM(total_revenue) as revenue,
				SUM(total_views) as views,
				SUM(total_clicks) as clicks
			FROM analytics_stats
			GROUP BY DATE_TRUNC('month', date)
			ORDER BY month DESC
			LIMIT ?
		`, limitInt).Rows()
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get trends"})
			return
		}
		defer rows.Close()

		for rows.Next() {
			var dp TrendDataPoint
			var month time.Time
			if err := rows.Scan(&month, &dp.Revenue, &dp.Views, &dp.Clicks); err != nil {
				continue
			}
			dp.Date = month.Format("2006-01")
			dataPoints = append(dataPoints, dp)
		}
	}

	ctx.JSON(http.StatusOK, TrendsResponse{
		Daily:   dataPoints,
		Weekly:  []TrendDataPoint{},
		Monthly: []TrendDataPoint{},
	})
}
