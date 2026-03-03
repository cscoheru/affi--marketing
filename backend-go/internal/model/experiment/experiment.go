package experiment

import (
	"time"

	"gorm.io/gorm"
)

// Experiment 商业模式实验
type Experiment struct {
	ID            uint                   `json:"id" gorm:"primaryKey"`
	Name          string                 `json:"name" gorm:"not null;size:255"`
	Description   string                 `json:"description" gorm:"type:text"`
	ExperimentType ExperimentType        `json:"experiment_type" gorm:"not null;size:50;index"`
	PluginID      string                 `json:"plugin_id" gorm:"not null;size:100"`
	Status        ExperimentStatus       `json:"status" gorm:"not null;default:'draft';size:50"`
	Config        ExperimentConfig       `json:"config" gorm:"type:jsonb"`
	Metadata      map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	StartTime     *time.Time             `json:"start_time"`
	EndTime       *time.Time             `json:"end_time"`
	CreatedBy     string                 `json:"created_by" gorm:"size:100"`
	CreatedAt     time.Time             `json:"created_at"`
	UpdatedAt     time.Time             `json:"updated_at"`

	// 关联关系
	Tracks        []Track                `json:"tracks" gorm:"foreignKey:ExperimentID"`
	Conversions   []Conversion           `json:"conversions" gorm:"foreignKey:ExperimentID"`
}

// TableName 指定表名
func (Experiment) TableName() string {
	return "experiments"
}

// ExperimentStatus 实验状态
type ExperimentStatus string

const (
	ExperimentStatusDraft     ExperimentStatus = "draft"     // 草稿
	ExperimentStatusActive    ExperimentStatus = "active"    // 进行中
	ExperimentStatusPaused    ExperimentStatus = "paused"    // 暂停
	ExperimentStatusCompleted ExperimentStatus = "completed" // 已完成
	ExperimentStatusArchived  ExperimentStatus = "archived"  // 已归档
)

// ExperimentType 实验类型
type ExperimentType string

const (
	ExperimentTypeSEO           ExperimentType = "seo"            // 程序化 SEO
	ExperimentTypeGEO           ExperimentType = "geo"            // 生成式引擎优化
	ExperimentTypeAIAgent       ExperimentType = "ai_agent"       // AI 代理电商
	ExperimentTypeAffiliateSAAS ExperimentType = "affiliate_saas" // 联盟营销 SaaS
)

// ExperimentConfig 实验配置 (JSONB)
type ExperimentConfig struct {
	// SEO 配置
	SEOConfig *SEOExperimentConfig `json:"seo_config,omitempty"`

	// GEO 配置
	GEOConfig *GEOExperimentConfig `json:"geo_config,omitempty"`

	// AI Agent 配置
	AIAgentConfig *AIAgentExperimentConfig `json:"ai_agent_config,omitempty"`

	// 联盟营销 SaaS 配置
	AffiliateSAASConfig *AffiliateSAASConfig `json:"affiliate_saas_config,omitempty"`
}

// SEOExperimentConfig SEO 实验配置
type SEOExperimentConfig struct {
	TargetKeywords    []string `json:"target_keywords"`
	ContentFrequency  int      `json:"content_frequency"` // 每天生成内容数
	TargetPlatforms   []string `json:"target_platforms"`   // 发布平台
	AutoPublish       bool     `json:"auto_publish"`
	AffiliateNetworks []string `json:"affiliate_networks"`
}

// GEOExperimentConfig GEO 实验配置
type GEOExperimentConfig struct {
	TargetQueries     []string `json:"target_queries"`
	GenerationModel   string   `json:"generation_model"`
	OptimizationGoals []string `json:"optimization_goals"`
}

// AIAgentExperimentConfig AI 代理实验配置
type AIAgentExperimentConfig struct {
	AgentType         string   `json:"agent_type"`
	ProductCategories []string `json:"product_categories"`
	TargetDemographics []string `json:"target_demographics"`
	CommissionRate    float64  `json:"commission_rate"`
}

// AffiliateSAASConfig 联盟营销 SaaS 配置
type AffiliateSAASConfig struct {
	MerchantDomains   []string          `json:"merchant_domains"`
	CommissionTiers   []CommissionTier  `json:"commission_tiers"`
	CookieDuration   int               `json:"cookie_duration"` // 天数
	ApprovalWorkflow string            `json:"approval_workflow"`
}

// CommissionTier 佣金阶梯
type CommissionTier struct {
	MinAmount float64 `json:"min_amount"`
	MaxAmount float64 `json:"max_amount"`
	Rate      float64 `json:"rate"` // 佣金率 (百分比)
}

// Track 追踪事件
type Track struct {
	ID          uint                   `json:"id" gorm:"primaryKey"`
	ExperimentID uint                   `json:"experiment_id" gorm:"not null;index"`
	PluginID    string                 `json:"plugin_id" gorm:"not null;size:100"`
	EventType   string                 `json:"event_type" gorm:"not null;size:100;index"`
	TrackingID  string                 `json:"tracking_id" gorm:"size:255;index"`
	SourceURL   string                 `json:"source_url" gorm:"type:text"`
	TargetURL   string                 `json:"target_url" gorm:"type:text"`
	Referrer    string                 `json:"referrer" gorm:"type:text"`
	UserAgent   string                 `json:"user_agent" gorm:"type:text"`
	IPAddress   string                 `json:"ip_address" gorm:"type:inet"`
	Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt   time.Time             `json:"created_at" gorm:"index"`

	// 关联关系
	Experiment  Experiment             `json:"-" gorm:"foreignKey:ExperimentID"`
}

// TableName 指定表名
func (Track) TableName() string {
	return "tracking_events"
}

// Conversion 转化事件
type Conversion struct {
	ID             uint                   `json:"id" gorm:"primaryKey"`
	ExperimentID   uint                   `json:"experiment_id" gorm:"not null;index"`
	PluginID       string                 `json:"plugin_id" gorm:"not null;size:100"`
	TrackID        string                 `json:"track_id" gorm:"size:255;index"`
	ConversionType string                 `json:"conversion_type" gorm:"size:100"`
	Amount         float64                `json:"amount" gorm:"type:decimal(10,2)"`
	CommissionRate float64                `json:"commission_rate" gorm:"type:decimal(5,2)"`
	Commission     float64                `json:"commission" gorm:"type:decimal(10,2)"`
	Status         ConversionStatus       `json:"status" gorm:"not null;default:'pending';size:50"`
	RawData        map[string]interface{} `json:"raw_data" gorm:"type:jsonb"`
	CreatedAt      time.Time             `json:"created_at" gorm:"index"`
	ConfirmedAt    *time.Time             `json:"confirmed_at"`

	// 关联关系
	Experiment     Experiment             `json:"-" gorm:"foreignKey:ExperimentID"`
}

// TableName 指定表名
func (Conversion) TableName() string {
	return "conversions"
}

// ConversionStatus 转化状态
type ConversionStatus string

const (
	ConversionStatusPending   ConversionStatus = "pending"   // 待确认
	ConversionStatusConfirmed ConversionStatus = "confirmed" // 已确认
	ConversionStatusRejected  ConversionStatus = "rejected"  // 已拒绝
)

// BeforeCreate GORM 钩子
func (e *Experiment) BeforeCreate(tx *gorm.DB) error {
	now := time.Now()
	e.CreatedAt = now
	e.UpdatedAt = now
	return nil
}

// BeforeUpdate GORM 钩子
func (e *Experiment) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
