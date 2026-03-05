package content

import "time"

// Product 产品候选
type Product struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN           string    `json:"asin" gorm:"uniqueIndex;size:20;not null"`
	Title          string    `json:"title" gorm:"size:500;not null"`
	Category       string    `json:"category" gorm:"size:100;index"`
	Price          float64   `json:"price" gorm:"type:decimal(10,2)"`
	Rating         float64   `json:"rating" gorm:"type:decimal(3,2)"`
	ReviewCount    int       `json:"reviewCount" gorm:"default:0"`
	ImageURL       string    `json:"imageUrl" gorm:"size:1000"`
	Status         string    `json:"status" gorm:"size:20;default:pending;index"`
	PotentialScore float64   `json:"potentialScore" gorm:"type:decimal(5,2);default:0"`
	CreatedAt      time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Product) TableName() string {
	return "products"
}

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

// Content 内容
type Content struct {
	ID            int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Slug          string     `json:"slug" gorm:"uniqueIndex;size:200;not null"`
	ASIN          string     `json:"asin" gorm:"index;size:20;not null"`
	Title         string     `json:"title" gorm:"size:500;not null"`
	Type          string     `json:"type" gorm:"size:20;index"`
	Content       string     `json:"content" gorm:"type:text;not null"`
	Excerpt       string     `json:"excerpt" gorm:"size:500"`
	SEOTitle      string     `json:"seoTitle" gorm:"size:200"`
	SEODescription string    `json:"seoDescription" gorm:"size:500"`
	SEOKeywords   string     `json:"seoKeywords" gorm:"size:500"`
	Status        string     `json:"status" gorm:"size:20;default:draft;index"`
	AIGenerated   bool       `json:"aiGenerated" gorm:"default:false"`
	AIModel       string     `json:"aiModel" gorm:"size:50"`
	HumanReviewed bool       `json:"humanReviewed" gorm:"default:false"`
	ReviewedBy    int        `json:"reviewedBy" gorm:"default:0"`
	ReviewComment string     `json:"reviewComment" gorm:"type:text"`
	WordCount     int        `json:"wordCount" gorm:"default:0"`
	PublishedAt   *time.Time `json:"publishedAt"`
	CreatedAt     time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt     time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Content) TableName() string {
	return "contents"
}

// PublishTask 发布任务
type PublishTask struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ContentID int       `json:"contentId" gorm:"index;not null"`
	Platforms string    `json:"platforms" gorm:"size:500;not null"`
	Status    string    `json:"status" gorm:"size:20;default:pending;index"`
	Results   string    `json:"results" gorm:"type:jsonb"`
	ErrorMsg  string    `json:"errorMsg" gorm:"type:text"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (PublishTask) TableName() string {
	return "publish_tasks"
}

// PublishLog 发布日志
type PublishLog struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskID    *int      `json:"taskId" gorm:"index"`
	Platform  string    `json:"platform" gorm:"size:50;index"`
	Type      string    `json:"type" gorm:"size:20"`
	Message   string    `json:"message" gorm:"type:text;not null"`
	Metadata  string    `json:"metadata" gorm:"type:jsonb"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (PublishLog) TableName() string {
	return "publish_logs"
}

// PublishPlatform 发布平台配置
type PublishPlatform struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string     `json:"name" gorm:"uniqueIndex;size:50;not null"`
	DisplayName string    `json:"displayName" gorm:"size:100"`
	Type        string     `json:"type" gorm:"size:20"`
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

// AnalyticsStats 分析统计数据
type AnalyticsStats struct {
	ID              int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Date            time.Time  `json:"date" gorm:"index"`
	TotalRevenue    float64    `json:"totalRevenue" gorm:"type:decimal(10,2);default:0"`
	TotalViews      int        `json:"totalViews" gorm:"default:0"`
	TotalClicks     int        `json:"totalClicks" gorm:"default:0"`
	TotalConversions int       `json:"totalConversions" gorm:"default:0"`
	PublishedCount  int        `json:"publishedCount" gorm:"default:0"`
	CreatedAt       time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt       time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (AnalyticsStats) TableName() string {
	return "analytics_stats"
}

// ContentPerformance 内容表现数据
type ContentPerformance struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ContentID   int       `json:"contentId" gorm:"index;not null"`
	Views       int       `json:"views" gorm:"default:0"`
	Clicks      int       `json:"clicks" gorm:"default:0"`
	Conversions int       `json:"conversions" gorm:"default:0"`
	Revenue     float64   `json:"revenue" gorm:"type:decimal(10,2);default:0"`
	Date        time.Time `json:"date" gorm:"index"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ContentPerformance) TableName() string {
	return "content_performance"
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
	ID         int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ASIN       string    `json:"asin" gorm:"index;size:20;not null"`
	ContentID  *int      `json:"contentId" gorm:"index"`
	Type       string    `json:"type" gorm:"size:20"`
	AIModel    string    `json:"aiModel" gorm:"size:50"`
	Prompt     string    `json:"prompt" gorm:"type:text"`
	Status     string    `json:"status" gorm:"size:20;default:pending"`
	Result     string    `json:"result" gorm:"type:text"`
	ErrorMsg   string    `json:"errorMsg" gorm:"type:text"`
	Progress   int       `json:"progress" gorm:"default:0"`
	CreatedAt  time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt  time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
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
