package content

import "time"

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
	Title      string       `json:"title" gorm:"size:200;not null"`
	Type       MaterialType `json:"type" gorm:"size:20;not null;index"`
	Content    string       `json:"content" gorm:"type:text"`
	SourceURL  string       `json:"sourceUrl" gorm:"size:500"`
	FilePath   string       `json:"filePath" gorm:"size:500"`
	FileName   string       `json:"fileName" gorm:"size:200"`
	FileSize   int64        `json:"fileSize" gorm:"default:0"`
	MarketID   int          `json:"marketId" gorm:"not null;index"`
	WordCount  int          `json:"wordCount" gorm:"default:0"`
	Metadata   string       `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	CreatedAt  time.Time    `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt  time.Time    `json:"updatedAt" gorm:"autoUpdateTime"`
	// 关联
	Market     *MarketOpportunity `json:"market,omitempty" gorm:"foreignKey:MarketID"`
}

// TableName 指定表名
func (Material) TableName() string {
	return "materials"
}
