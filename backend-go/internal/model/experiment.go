package model

import (
    "database/sql/driver"
    "encoding/json"
    "errors"
    "time"
)

// MetadataMap is a custom type for Metadata to enable Scanner/Valuer
type MetadataMap map[string]interface{}

// Scan implements sql.Scanner for MetadataMap
func (m *MetadataMap) Scan(value interface{}) error {
    if value == nil {
        *m = make(map[string]interface{})
        return nil
    }
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("type assertion to []byte failed")
    }
    return json.Unmarshal(bytes, m)
}

// Value implements driver.Valuer for MetadataMap
func (m MetadataMap) Value() (driver.Value, error) {
    if len(m) == 0 {
        return nil, nil
    }
    return json.Marshal(m)
}

// Experiment 商业模式实验
type Experiment struct {
    ID          string                 `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Name        string                 `json:"name" gorm:"type:varchar(255);not null"`
    Type        ExperimentType         `json:"type" gorm:"type:varchar(50);not null;index"`
    Status      ExperimentStatus       `json:"status" gorm:"type:varchar(50);not null;default:'draft';index"`
    Config      ExperimentConfig       `json:"config" gorm:"type:jsonb"`
    Metadata    MetadataMap            `json:"metadata" gorm:"type:jsonb"`
    StartDate   *time.Time             `json:"start_date"`
    EndDate     *time.Time             `json:"end_date"`
    CreatedBy   string                 `json:"created_by" gorm:"type:varchar(50)"`
    CreatedAt   time.Time             `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt   time.Time             `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Experiment) TableName() string {
    return "experiments"
}

// ExperimentType 实验类型
type ExperimentType string

const (
    ExperimentTypeSEO          ExperimentType = "seo"
    ExperimentTypeGEO          ExperimentType = "geo"
    ExperimentTypeAIAgent      ExperimentType = "ai_agent"
    ExperimentTypeAffiliateSAAS ExperimentType = "affiliate_saas"
)

// ExperimentStatus 实验状态
type ExperimentStatus string

const (
    ExperimentStatusDraft     ExperimentStatus = "draft"
    ExperimentStatusActive    ExperimentStatus = "active"
    ExperimentStatusPaused    ExperimentStatus = "paused"
    ExperimentStatusCompleted ExperimentStatus = "completed"
    ExperimentStatusArchived  ExperimentStatus = "archived"
)

// ExperimentConfig 实验配置
type ExperimentConfig struct {
    SEOConfig         *SEOExperimentConfig         `json:"seo_config,omitempty"`
    GEOConfig         *GEOExperimentConfig         `json:"geo_config,omitempty"`
    AIAgentConfig     *AIAgentExperimentConfig     `json:"ai_agent_config,omitempty"`
    AffiliateSAASConfig *AffiliateSAASConfig       `json:"affiliate_saas_config,omitempty"`
}

// Scan 实现 sql.Scanner 接口
func (c *ExperimentConfig) Scan(value interface{}) error {
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("type assertion to []byte failed")
    }
    return json.Unmarshal(bytes, c)
}

// Value 实现 driver.Valuer 接口
func (c ExperimentConfig) Value() (driver.Value, error) {
    return json.Marshal(c)
}

// SEOExperimentConfig SEO 实验配置
type SEOExperimentConfig struct {
    TargetKeywords    []string `json:"target_keywords"`
    ContentFrequency  int      `json:"content_frequency"`
    TargetPlatforms   []string `json:"target_platforms"`
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
    MerchantDomains  []string         `json:"merchant_domains"`
    CommissionTiers  []CommissionTier `json:"commission_tiers"`
    CookieDuration   int              `json:"cookie_duration"`
    ApprovalWorkflow string           `json:"approval_workflow"`
}

// CommissionTier 佣金层级
type CommissionTier struct {
    MinAmount float64 `json:"min_amount"`
    MaxAmount float64 `json:"max_amount"`
    Rate      float64 `json:"rate"`
}
