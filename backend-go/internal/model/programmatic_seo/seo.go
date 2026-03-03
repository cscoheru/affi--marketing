package programmatic_seo

import (
	"time"

	"gorm.io/gorm"
)

// SEOKeyword SEO 关键词
type SEOKeyword struct {
	ID            uint                   `json:"id" gorm:"primaryKey"`
	ExperimentID  uint                   `json:"experiment_id" gorm:"not null;index"`
	Keyword       string                 `json:"keyword" gorm:"not null;size:500;index"`
	SearchVolume  int                    `json:"search_volume"`
	Competition    string                 `json:"competition" gorm:"size:50"`
	CPC           float64                `json:"cpc" gorm:"type:decimal(10,2)"`
	Status        KeywordStatus         `json:"status" gorm:"not null;default:'pending';size:50"`
	TargetURL     string                 `json:"target_url" gorm:"type:text"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`

	// 关联关系
	ContentTasks []ContentTask          `json:"content_tasks" gorm:"foreignKey:KeywordID"`
	Metrics      []SEOMetric            `json:"metrics" gorm:"foreignKey:KeywordID"`
}

// TableName 指定表名
func (SEOKeyword) TableName() string {
	return "seo_keywords"
}

// KeywordStatus 关键词状态
type KeywordStatus string

const (
	KeywordStatusPending    KeywordStatus = "pending"    // 待处理
	KeywordStatusProcessing KeywordStatus = "processing" // 处理中
	KeywordStatusCompleted  KeywordStatus = "completed"  // 已完成
	KeywordStatusFailed     KeywordStatus = "failed"     // 失败
)

// ContentTask 内容任务
type ContentTask struct {
	ID            uint                   `json:"id" gorm:"primaryKey"`
	KeywordID     uint                   `json:"keyword_id" gorm:"not null;index"`
	Title         string                 `json:"title" gorm:"not null;size:500"`
	Content       string                 `json:"content" gorm:"type:text"`
	ContentHTML   string                 `json:"content_html" gorm:"type:text"`
	Status        TaskStatus             `json:"status" gorm:"not null;default:'pending';size:50"`
	PublishedURL  string                 `json:"published_url" gorm:"type:text"`
	PublishedAt   *time.Time             `json:"published_at"`
	GeneratedAt   *time.Time             `json:"generated_at"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`

	// 关联关系
	Keyword       SEOKeyword             `json:"-" gorm:"foreignKey:KeywordID"`
}

// TableName 指定表名
func (ContentTask) TableName() string {
	return "content_tasks"
}

// TaskStatus 任务状态
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"    // 待处理
	TaskStatusGenerating TaskStatus = "generating" // 生成中
	TaskStatusReady      TaskStatus = "ready"      // 就绪
	TaskStatusPublished  TaskStatus = "published"  // 已发布
	TaskStatusFailed     TaskStatus = "failed"     // 失败
)

// AffiliateLink 联盟链接
type AffiliateLink struct {
	ID            uint                   `json:"id" gorm:"primaryKey"`
	ExperimentID  uint                   `json:"experiment_id" gorm:"not null;index"`
	TrackID       string                 `json:"track_id" gorm:"not null;size:255;index"`
	Network       string                 `json:"network" gorm:"not null;size:100"`
	AffiliateID   string                 `json:"affiliate_id" gorm:"size:100"`
	OfferID       string                 `json:"offer_id" gorm:"size:100"`
	OriginalURL   string                 `json:"original_url" gorm:"type:text"`
	AffiliateURL  string                 `json:"affiliate_url" gorm:"type:text"`
	DeepLink      string                 `json:"deep_link" gorm:"type:text"`
	Status        LinkStatus             `json:"status" gorm:"not null;default:'active';size:50"`
	Clicks        int                    `json:"clicks" gorm:"default:0"`
	Conversions  int                    `json:"conversions" gorm:"default:0"`
	Revenue       float64                `json:"revenue" gorm:"type:decimal(10,2);default:0"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`
}

// TableName 指定表名
func (AffiliateLink) TableName() string {
	return "affiliate_links"
}

// LinkStatus 链接状态
type LinkStatus string

const (
	LinkStatusActive   LinkStatus = "active"   // 活跃
	LinkStatusInactive LinkStatus = "inactive" // 非活跃
	LinkStatusExpired  LinkStatus = "expired"  // 过期
)

// SEOMetric SEO 指标
type SEOMetric struct {
	ID            uint                   `json:"id" gorm:"primaryKey"`
	KeywordID     uint                   `json:"keyword_id" gorm:"not null;index"`
	Measurement   string                 `json:"measurement" gorm:"not null;size:100;index"`
	Value         float64                `json:"value" gorm:"type:decimal(10,2)"`
	PreviousValue float64                `json:"previous_value" gorm:"type:decimal(10,2)"`
	ChangePercent float64                `json:"change_percent" gorm:"type:decimal(5,2)"`
	MeasuredAt    time.Time             `json:"measured_at" gorm:"index"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt     time.Time             `json:"created_at"`

	// 关联关系
	Keyword       SEOKeyword             `json:"-" gorm:"foreignKey:KeywordID"`
}

// TableName 指定表名
func (SEOMetric) TableName() string {
	return "seo_metrics"
}

// MeasurementType 测量类型
const (
	MeasurementRankPosition     = "rank_position"     // 排名位置
	MeasurementOrganicClicks    = "organic_clicks"    // 自然点击
	MeasurementOrganicImpressions = "organic_impressions" // 自然展示
	MeasurementOrganicCTR       = "organic_ctr"       // 自然点击率
	MeasurementBacklinks        = "backlinks"          // 反向链接
	MeasurementDomainAuthority  = "domain_authority"  // 域名权重
)
