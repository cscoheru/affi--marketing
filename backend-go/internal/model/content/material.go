package content

import (
	"time"

	"gorm.io/gorm"
)

// MaterialType 素材类型
type MaterialType string

const (
	MaterialTypeProductIntro  MaterialType = "product_intro"
	MaterialTypeUserReview    MaterialType = "user_review"
	MaterialTypeYouTubeReview MaterialType = "youtube_review"
	MaterialTypeAttachment    MaterialType = "attachment"
)

// Material 素材
type Material struct {
	ID         int          `json:"id" gorm:"primaryKey;autoIncrement"`
	Title      string       `json:"title" gorm:"size:200;not null;default:'Untitled Material'"`
	Type       MaterialType `json:"type" gorm:"size:20;not null;index;default:'product_intro'"`
	Content    string       `json:"content" gorm:"type:text"`
	SourceURL  string       `json:"sourceUrl" gorm:"size:500"`
	FilePath   string       `json:"filePath" gorm:"size:500"`
	FileName   string       `json:"fileName" gorm:"size:200"`
	FileSize   int64        `json:"fileSize" gorm:"default:0"`
	Asin       string       `json:"asin" gorm:"column:asin;size:20;not null;default:'UNKNOWN'"`
	MarketID   int          `json:"marketId" gorm:"index"`
	WordCount  int          `json:"wordCount" gorm:"default:0"`
	Metadata   string       `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	CreatedAt  time.Time    `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt  time.Time    `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (Material) TableName() string {
	return "materials"
}

// BeforeCreate GORM hook - ensures Asin is set before insert
func (m *Material) BeforeCreate(tx *gorm.DB) error {
	if m.Asin == "" {
		m.Asin = "UNKNOWN"
	}
	return nil
}
