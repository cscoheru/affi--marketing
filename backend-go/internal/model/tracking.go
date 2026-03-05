package model

import (
	"time"
)

// Track 追踪事件
type Track struct {
	ID          string                 `json:"id" gorm:"primaryKey;type:varchar(50)"`
	TrackingID  string                 `json:"tracking_id" gorm:"type:varchar(100);not null;index"`
	ExperimentID string                `json:"experiment_id" gorm:"type:varchar(50);not null;index"`
	EventType   string                 `json:"event_type" gorm:"type:varchar(50);not null;index"`
	EventData   map[string]interface{} `json:"event_data" gorm:"type:jsonb"`
	UserAgent   string                 `json:"user_agent" gorm:"type:text"`
	IPAddress   string                 `json:"ip_address" gorm:"type:varchar(50)"`
	Referrer    string                 `json:"referrer" gorm:"type:text"`
	CreatedAt   time.Time              `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time              `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Track) TableName() string {
	return "tracks"
}
