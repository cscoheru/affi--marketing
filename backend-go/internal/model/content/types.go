package content

import "time"

// ============================================================================
// NEW DATA MODELS - Content Business Architecture
// 核心认知转变：我们是内容企业，不是Amazon推广员
// - Amazon商品 = 市场机会（MarketOpportunity）
// - 内容 = 我们的产品（Product）
// ============================================================================

// MarketStatus 市场机会状态
// watching: 观察中 - 有潜力，暂不进入
// targeting: 瞄准中 - 准备进入
// active: 活跃市场 - 正在产出内容
// saturated: 已饱和 - 竞争激烈，减少投入
// exited: 已退出

// MarketOpportunity 市场机会（Amazon商品/选品）
// Amazon商品不是我们的产品，而是我们选择进入的"市场"
type MarketOpportunity struct {
	ID      int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN    string `json:"asin" gorm:"uniqueIndex;size:20;not null"`
	Title   string `json:"title" gorm:"size:500;not null"`
	Category string  `json:"category" gorm:"size:100;index"`
	Price    string  `json:"price" gorm:"type:decimal(10,2)"` // Use string to avoid precision loss
	Rating   string  `json:"rating" gorm:"type:decimal(3,2)"` // Use string for consistency
	// 图片和评论
	ReviewCount int    `json:"reviewCount" gorm:"default:0"`
	ImageURL    string `json:"imageUrl" gorm:"size:1000"`
	// 市场状态
	Status string `json:"status" gorm:"size:20;default:watching;index"`
	// 市场评估
	MarketSize       string `json:"marketSize" gorm:"size:20"`       // large/medium/small
	CompetitionLevel string `json:"competitionLevel" gorm:"size:20"` // high/medium/low
	ContentPotential string `json:"contentPotential" gorm:"size:20"` // high/medium/low
	AIScore          int    `json:"aiScore"`                          // AI推荐评分(0-100)
	// 统计数据（从关联内容汇总）
	ContentCount     int     `json:"contentCount" gorm:"default:0"`     // 关联内容数量
	TotalClicks      int     `json:"totalClicks" gorm:"default:0"`      // 总点击
	TotalConversions int     `json:"totalConversions" gorm:"default:0"` // 总转化
	TotalRevenue     float64 `json:"totalRevenue" gorm:"type:decimal(10,2);default:0"` // 总收益
	// 时间戳
	LastSyncedAt *time.Time `json:"lastSyncedAt"`
	CreatedAt    time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (MarketOpportunity) TableName() string {
	return "market_opportunities"
}

// ProductStatus 产品（内容）状态
// draft: 研发中 - 创作中
// review: 待审核 - 质检中
// approved: 已通过 - 可上市
// published: 已上市 - 营销中
// archived: 已下架 - 退出市场

// Product 产品（内容，重新定义）
// 内容才是我们的核心产品
type Product struct {
	ID      int    `json:"id" gorm:"primaryKey;autoIncrement"`
	Slug    string `json:"slug" gorm:"uniqueIndex;size:200;not null"`
	Title   string `json:"title" gorm:"size:500;not null"`
	Type    string `json:"type" gorm:"size:20;index"` // review/guide/tutorial/list/news
	Content string `json:"content" gorm:"type:text;not null"`
	Excerpt string `json:"excerpt" gorm:"size:500"`
	// SEO
	SEOTitle       string `json:"seoTitle" gorm:"size:200"`
	SEODescription string `json:"seoDescription" gorm:"size:500"`
	SEOKeywords    string `json:"seoKeywords" gorm:"size:500"`
	// 状态
	Status string `json:"status" gorm:"size:20;default:draft;index"`
	// 元数据
	WordCount   int    `json:"wordCount" gorm:"default:0"`
	AIGenerated bool   `json:"aiGenerated" gorm:"default:false"`
	AIModel     string `json:"aiModel" gorm:"size:50"`
	// 审核信息
	ReviewedBy    int        `json:"reviewedBy" gorm:"default:0"`
	ReviewComment string     `json:"reviewComment" gorm:"type:text"`
	ReviewedAt    *time.Time `json:"reviewedAt"`
	// 发布信息
	PublishedAt *time.Time `json:"publishedAt"`
	// 关联
	ProductMarkets []ProductMarket `json:"productMarkets" gorm:"foreignKey:ProductID"`
	// 时间戳
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Product) TableName() string {
	return "products"
}

// ProductMarket 产品与市场的关联（多对多）
type ProductMarket struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID int       `json:"productId" gorm:"index;not null"`
	MarketID  int       `json:"marketId" gorm:"index;not null"`
	IsPrimary bool      `json:"isPrimary" gorm:"default:false"` // 是否主要推广产品
	// 关联的外键
	Product *Product           `json:"product,omitempty" gorm:"foreignKey:ProductID"`
	Market  *MarketOpportunity `json:"market,omitempty" gorm:"foreignKey:MarketID"`
	CreatedAt time.Time        `json:"createdAt" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (ProductMarket) TableName() string {
	return "product_markets"
}

// PublishTask 发布任务
type PublishTask struct {
	ID        int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID int    `json:"productId" gorm:"index;not null"` // 引用Product表（内容）
	Platform  string `json:"platform" gorm:"size:50;not null"`
	Status    string `json:"status" gorm:"size:20;default:pending;index"`
	// 发布结果
	PublishedURL  string `json:"publishedUrl" gorm:"size:1000"`
	ErrorMessage string `json:"errorMessage" gorm:"type:text"`
	// 表现数据
	Views       int     `json:"views" gorm:"default:0"`
	Clicks      int     `json:"clicks" gorm:"default:0"`
	Conversions int     `json:"conversions" gorm:"default:0"`
	Revenue     float64 `json:"revenue" gorm:"type:decimal(10,2);default:0"`
	// 同步状态
	LastSyncedAt *time.Time `json:"lastSyncedAt"`
	// 时间戳
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
	// 关联的外键
	Product *Product `json:"product,omitempty" gorm:"foreignKey:ProductID"`
}

// TableName 指定表名
func (PublishTask) TableName() string {
	return "publish_tasks"
}

// PublishPlatform 发布平台配置
type PublishPlatform struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string     `json:"name" gorm:"uniqueIndex;size:50;not null"`
	DisplayName string     `json:"displayName" gorm:"size:100"`
	Enabled     bool       `json:"enabled" gorm:"default:true"`
	Config      string     `json:"config" gorm:"type:jsonb"`
	Status      string     `json:"status" gorm:"size:20;default:disconnected"`
	LastTestAt  *time.Time `json:"lastTestAt"`
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (PublishPlatform) TableName() string {
	return "publish_platforms"
}

// ClickEvent 点击事件（新增）
type ClickEvent struct {
	ID      int    `json:"id" gorm:"primaryKey;autoIncrement"`
	ClickID string `json:"clickId" gorm:"uniqueIndex;size:100;not null"` // 唯一点击ID
	MarketID *int  `json:"marketId" gorm:"index"`                        // 关联的市场
	ProductID *int `json:"productId" gorm:"index"`                       // 关联的内容
	Platform string `json:"platform" gorm:"size:50"`                      // 来源平台
	// 追踪信息
	UserFingerprint string `json:"userFingerprint" gorm:"size:100"` // 设备指纹
	UTMSource       string `json:"utmSource" gorm:"size:100"`
	UTMMedium       string `json:"utmMedium" gorm:"size:100"`
	UTMCampaign     string `json:"utmCampaign" gorm:"size:100"`
	// 设备信息
	DeviceType string `json:"deviceType" gorm:"size:20"` // desktop/mobile/tablet
	Browser    string `json:"browser" gorm:"size:50"`
	Country    string `json:"country" gorm:"size:10"`
	// 时间戳
	ClickedAt time.Time `json:"clickedAt" gorm:"autoCreateTime"`
	// 关联的外键
	Market  *MarketOpportunity `json:"market,omitempty" gorm:"foreignKey:MarketID"`
	Product *Product           `json:"product,omitempty" gorm:"foreignKey:ProductID"`
}

// TableName 指定表名
func (ClickEvent) TableName() string {
	return "click_events"
}

// ConversionEvent 转化事件（从Amazon Associates回传）
type ConversionEvent struct {
	ID       int    `json:"id" gorm:"primaryKey;autoIncrement"`
	OrderID  string `json:"orderId" gorm:"size:100;index"` // Amazon订单ID
	ClickID  string `json:"clickId" gorm:"size:100;index"` // 关联点击
	MarketID *int   `json:"marketId" gorm:"index"`         // 关联的市场
	// 商品信息
	ASIN         string  `json:"asin" gorm:"size:20"`
	ProductTitle string  `json:"productTitle" gorm:"size:500"`
	Quantity     int     `json:"quantity" gorm:"default:1"`
	// 金额
	ProductPrice    float64 `json:"productPrice" gorm:"type:decimal(10,2)"`
	TotalAmount     float64 `json:"totalAmount" gorm:"type:decimal(10,2)"`
	Commission      float64 `json:"commission" gorm:"type:decimal(10,2)"`
	CommissionRate  float64 `json:"commissionRate" gorm:"type:decimal(5,4)"`
	// 时间
	OrderedAt  *time.Time `json:"orderedAt"`
	ShippedAt  *time.Time `json:"shippedAt"`
	ReportedAt time.Time  `json:"reportedAt" gorm:"autoCreateTime"`
	// 关联的外键
	Market *MarketOpportunity `json:"market,omitempty" gorm:"foreignKey:MarketID"`
}

// TableName 指定表名
func (ConversionEvent) TableName() string {
	return "conversion_events"
}

// ============================================================================
// LEGACY MODELS - Kept for backward compatibility during migration
// 这些模型将在迁移完成后移除
// ============================================================================

// Deprecated: 使用 MarketOpportunity 代替
// AmazonProduct 旧的产品模型（用于向后兼容）
// Amazon商品现在是"市场机会"，不是"产品"
type AmazonProduct struct {
	ID             int        `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN           string     `json:"asin" gorm:"uniqueIndex;size:20;not null"`
	Title          string     `json:"title" gorm:"size:500;not null"`
	Category       string     `json:"category" gorm:"size:100;index"`
	Price          float64    `json:"price" gorm:"type:decimal(10,2)"`
	Rating         float64    `json:"rating" gorm:"type:decimal(3,2)"`
	ReviewCount    int        `json:"reviewCount" gorm:"default:0"`
	ImageURL       string     `json:"imageUrl" gorm:"size:1000"`
	Status         string     `json:"status" gorm:"size:20;default:pending;index"`
	PotentialScore float64    `json:"potentialScore" gorm:"type:decimal(5,2);default:0"`
	// 生命周期时间戳
	TestingStartedAt *time.Time `json:"testingStartedAt"`
	ActiveStartedAt  *time.Time `json:"activeStartedAt"`
	ReviewingAt      *time.Time `json:"reviewingAt"`
	PhasedOutAt      *time.Time `json:"phasedOutAt"`
	// 推广追踪数据（汇总）
	TotalPromotions  int     `json:"totalPromotions" gorm:"default:0"`
	TotalImpressions int     `json:"totalImpressions" gorm:"default:0"`
	TotalClicks      int     `json:"totalClicks" gorm:"default:0"`
	TotalConversions int     `json:"totalConversions" gorm:"default:0"`
	TotalRevenue     float64 `json:"totalRevenue" gorm:"type:decimal(10,2);default:0"`
	// 最后同步时间
	LastSyncedAt *time.Time `json:"lastSyncedAt"`
	// 退出原因
	PhaseOutReason string `json:"phaseOutReason" gorm:"size:500"`
	CreatedAt     time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (AmazonProduct) TableName() string {
	return "products_legacy"
}

// Content 内容（旧模型，用于向后兼容）
// Deprecated: 内容现在使用 Product 模型
type Content struct {
	ID             int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Slug           string     `json:"slug" gorm:"uniqueIndex;size:200;not null"`
	ASIN           string     `json:"asin" gorm:"index;size:20;not null"`
	Title          string     `json:"title" gorm:"size:500;not null"`
	Type           string     `json:"type" gorm:"size:20;index"`
	Content        string     `json:"content" gorm:"type:text;not null"`
	Excerpt        string     `json:"excerpt" gorm:"size:500"`
	SEOTitle       string     `json:"seoTitle" gorm:"size:200"`
	SEODescription string     `json:"seoDescription" gorm:"size:500"`
	SEOKeywords    string     `json:"seoKeywords" gorm:"size:500"`
	Status         string     `json:"status" gorm:"size:20;default:draft;index"`
	AIGenerated    bool       `json:"aiGenerated" gorm:"default:false"`
	AIModel        string     `json:"aiModel" gorm:"size:50"`
	HumanReviewed  bool       `json:"humanReviewed" gorm:"default:false"`
	ReviewedBy     int        `json:"reviewedBy" gorm:"default:0"`
	ReviewComment  string     `json:"reviewComment" gorm:"type:text"`
	WordCount      int        `json:"wordCount" gorm:"default:0"`
	PublishedAt    *time.Time `json:"publishedAt"`
	CreatedAt      time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt      time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Content) TableName() string {
	return "contents"
}

// ============================================================================
// SUPPORTING MODELS - Unchanged
// ============================================================================

// Material 素材
type Material struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN           string    `json:"asin" gorm:"index;size:20;not null"`
	SourceType     string    `json:"sourceType" gorm:"size:50;index"`
	SourceURL      string    `json:"sourceUrl" gorm:"size:2000;not null"`
	Content        string    `json:"content" gorm:"type:text;not null"`
	SentimentScore float64   `json:"sentimentScore" gorm:"type:decimal(3,2);default:0.5"`
	Metadata       string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt      time.Time `json:"createdAt" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (Material) TableName() string {
	return "materials"
}

// PublishLog 发布日志
type PublishLog struct {
	ID       int       `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskID   *int      `json:"taskId" gorm:"index"`
	Platform string    `json:"platform" gorm:"size:50;index"`
	Type     string    `json:"type" gorm:"size:20"`
	Message  string    `json:"message" gorm:"type:text;not null"`
	Metadata string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (PublishLog) TableName() string {
	return "publish_logs"
}

// AnalyticsStats 分析统计数据
type AnalyticsStats struct {
	ID               int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Date             time.Time  `json:"date" gorm:"index"`
	TotalRevenue     float64    `json:"totalRevenue" gorm:"type:decimal(10,2);default:0"`
	TotalViews       int        `json:"totalViews" gorm:"default:0"`
	TotalClicks      int        `json:"totalClicks" gorm:"default:0"`
	TotalConversions int        `json:"totalConversions" gorm:"default:0"`
	PublishedCount   int        `json:"publishedCount" gorm:"default:0"`
	CreatedAt        time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt        time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (AnalyticsStats) TableName() string {
	return "analytics_stats"
}

// ProductPerformance 产品表现数据
type ProductPerformance struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID   int       `json:"productId" gorm:"index;not null"`
	Views       int       `json:"views" gorm:"default:0"`
	Clicks      int       `json:"clicks" gorm:"default:0"`
	Conversions int       `json:"conversions" gorm:"default:0"`
	Revenue     float64   `json:"revenue" gorm:"type:decimal(10,2);default:0"`
	Date        time.Time `json:"date" gorm:"index"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ProductPerformance) TableName() string {
	return "product_performance"
}

// MaterialCollectTask 素材收集任务
type MaterialCollectTask struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN        string    `json:"asin" gorm:"index;size:20;not null"`
	SourceTypes string    `json:"sourceTypes" gorm:"size:200;not null"`
	Status      string    `json:"status" gorm:"size:20;default:pending"`
	Progress    int       `json:"progress" gorm:"default:0"`
	Collected   int       `json:"collected" gorm:"default:0"`
	ErrorMsg    string    `json:"errorMsg" gorm:"type:text"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (MaterialCollectTask) TableName() string {
	return "material_collect_tasks"
}

// ContentGenerateTask 内容生成任务
type ContentGenerateTask struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN      string    `json:"asin" gorm:"index;size:20;not null"`
	ContentID *int      `json:"contentId" gorm:"index"`
	Type      string    `json:"type" gorm:"size:20"`
	AIModel   string    `json:"aiModel" gorm:"size:50"`
	Prompt    string    `json:"prompt" gorm:"type:text"`
	Status    string    `json:"status" gorm:"size:20;default:pending"`
	Result    string    `json:"result" gorm:"type:text"`
	ErrorMsg  string    `json:"errorMsg" gorm:"type:text"`
	Progress  int       `json:"progress" gorm:"default:0"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ContentGenerateTask) TableName() string {
	return "content_generate_tasks"
}

// User 用户（简化版，用于认证）
type User struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Email     string    `json:"email" gorm:"uniqueIndex;size:200;not null"`
	Name      string    `json:"name" gorm:"size:200"`
	Password  string    `json:"-" gorm:"size:200;not null"`
	Role      string    `json:"role" gorm:"size:20;default:viewer"`
	Status    string    `json:"status" gorm:"size:20;default:active"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}
