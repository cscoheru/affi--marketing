package settlement

import (
	"time"
)

// SettlementRecord 结算记录
type SettlementRecord struct {
	ID               uint              `json:"id" gorm:"primaryKey"`
	ExperimentID     uint              `json:"experiment_id" gorm:"not null;index"`
	StartDate        time.Time         `json:"start_date" gorm:"not null;index"`
	EndDate          time.Time         `json:"end_date" gorm:"not null;index"`
	Description      string            `json:"description" gorm:"type:text"`
	TotalConversions int               `json:"total_conversions" gorm:"default:0"`
	TotalCommission  float64           `json:"total_commission" gorm:"type:decimal(10,2);default:0"`
	Status           SettlementStatus  `json:"status" gorm:"not null;default:'pending';size:50"`
	SettlementDate   time.Time         `json:"settlement_date" gorm:"index"`
	Metadata         map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt        time.Time         `json:"created_at"`
	UpdatedAt        time.Time         `json:"updated_at"`

	// 关联关系
	Experiment       Experiment        `json:"-" gorm:"foreignKey:ExperimentID"`
}

// TableName 指定表名
func (SettlementRecord) TableName() string {
	return "settlement_records"
}

// SettlementStatus 结算状态
type SettlementStatus string

const (
	SettlementStatusPending   SettlementStatus = "pending"   // 待结算
	SettlementStatusCalculating SettlementStatus = "calculating" // 计算中
	SettlementStatusCompleted SettlementStatus = "completed" // 已完成
	SettlementStatusPaid      SettlementStatus = "paid"      // 已支付
	SettlementStatusFailed    SettlementStatus = "failed"    // 失败
)

// Touchpoint 触点
type Touchpoint struct {
	ID               uint              `json:"id" gorm:"primaryKey"`
	ExperimentID     uint              `json:"experiment_id" gorm:"not null;index"`
	TrackID          uint              `json:"track_id" gorm:"not null;index"`
	Channel          string            `json:"channel" gorm:"not null;size:100"`
	Source           string            `json:"source" gorm:"not null;size:100"`
	Campaign         string            `json:"campaign" gorm:"size:100"`
	Content          string            `json:"content" gorm:"size:100"`
	Position         int               `json:"position" gorm:"default:0"`
	AffiliateNetwork string            `json:"affiliate_network" gorm:"size:100"`
	Timestamp        time.Time         `json:"timestamp" gorm:"not null;index"`
	CreatedAt        time.Time         `json:"created_at" gorm:"index"`
	Metadata         map[string]interface{} `json:"metadata" gorm:"type:jsonb"`

	// 关联关系
	Track            Track             `json:"-" gorm:"foreignKey:TrackID"`
}

// TableName 指定表名
func (Touchpoint) TableName() string {
	return "touchpoints"
}

// AttributionResult 归因结果
type AttributionResult struct {
	ID                uint              `json:"id" gorm:"primaryKey"`
	ConversionID      uint              `json:"conversion_id" gorm:"not null;index"`
	Model             string            `json:"model" gorm:"not null;size:100"` // last_click, linear, time_decay
	Winner            string            `json:"winner" gorm:"not null;size:100"`
	TotalValue        float64           `json:"total_value" gorm:"type:decimal(10,2)"`
	PathLength        int               `json:"path_length" gorm:"default:1"`
	TouchpointCredits map[string]float64 `json:"touchpoint_credits" gorm:"type:jsonb"`
	CreatedAt         time.Time         `json:"created_at"`

	// 关联关系
	Conversion        Conversion        `json:"-" gorm:"foreignKey:ConversionID"`
}

// TableName 指定表名
func (AttributionResult) TableName() string {
	return "attribution_results"
}

// Experiment 关联的实验 (用于跨包引用)
type Experiment struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

// Track 关联的追踪 (用于跨包引用)
type Track struct {
	ID uint `json:"id"`
}

// Conversion 关联的转化 (用于跨包引用)
type Conversion struct {
	ID         uint      `json:"id"`
	TrackingID string    `json:"tracking_id"`
	Commission float64   `json:"commission"`
	CreatedAt  time.Time `json:"created_at"`
}
