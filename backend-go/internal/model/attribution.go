package model

import (
	"time"
)

// Conversion 转化记录
type Conversion struct {
	ID           string                 `json:"id" gorm:"primaryKey;type:varchar(50)"`
	TrackID      string                 `json:"track_id" gorm:"type:varchar(100);not null;index"`
	ExperimentID string                 `json:"experiment_id" gorm:"type:varchar(50);not null;index"`
	Amount       float64                `json:"amount" gorm:"type:decimal(10,2)"`
	Currency     string                 `json:"currency" gorm:"type:varchar(10);default:'USD'"`
	Metadata     map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt    time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Conversion) TableName() string {
	return "conversions"
}

// Touchpoint 触点记录
type Touchpoint struct {
	ID           string                 `json:"id" gorm:"primaryKey;type:varchar(50)"`
	TrackID      string                 `json:"track_id" gorm:"type:varchar(100);not null;index"`
	ExperimentID string                 `json:"experiment_id" gorm:"type:varchar(50);not null;index"`
	Timestamp    time.Time              `json:"timestamp" gorm:"not null;index"`
	Action       string                 `json:"action" gorm:"type:varchar(100)"`
	Value        float64                `json:"value" gorm:"type:decimal(10,2)"`
	Metadata     map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
	CreatedAt    time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Touchpoint) TableName() string {
	return "touchpoints"
}
