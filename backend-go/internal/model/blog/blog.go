package blog

import (
	"time"

	"gorm.io/gorm"
)

// BlogPost 博客文章模型
type BlogPost struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Title       string         `gorm:"size:200;not null" json:"title"`
	Slug        string         `gorm:"uniqueIndex;size:100;not null" json:"slug"`
	Content     string         `gorm:"type:text;not null" json:"content"`
	Excerpt     string         `gorm:"size:500" json:"excerpt"`
	CategoryID  uint           `gorm:"index" json:"category_id"`
	AuthorID    uint           `gorm:"index" json:"author_id"`
	Status      string         `gorm:"size:20;default:draft" json:"status"` // draft, published
	ImageURL    string         `gorm:"size:500" json:"image_url"`
	PublishedAt *time.Time     `json:"published_at"`

	// SEO 字段
	MetaTitle       string `gorm:"size:200" json:"meta_title"`
	MetaDescription string `gorm:"size:500" json:"meta_description"`
	MetaKeywords    string `gorm:"size:200" json:"meta_keywords"`

	// 统计字段
	ViewCount     int `gorm:"default:0" json:"view_count"`
	LikeCount     int `gorm:"default:0" json:"like_count"`
	CommentCount  int `gorm:"default:0" json:"comment_count"`

	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Category *BlogCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Author   *Author       `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
}

// BlogCategory 博客分类模型
type BlogCategory struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Slug        string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Description string         `json:"description"`
	ParentID    *uint          `json:"parent_id"`
	CreatedAt   time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// 关联
	Posts    []BlogPost    `gorm:"foreignKey:CategoryID" json:"posts,omitempty"`
	Children []BlogCategory `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

// Author 作者模型（简化版）
type Author struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"size:100" json:"name"`
	Email     string `gorm:"size:100" json:"email,omitempty"`
	AvatarURL string `gorm:"size:500" json:"avatar_url,omitempty"`
}

// BlogPostListResponse 博客文章列表响应
type BlogPostListResponse struct {
	Posts      []BlogPost `json:"posts"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	PageSize   int        `json:"page_size"`
	TotalPages int        `json:"total_pages"`
}

// BlogCategoryWithCount 带文章数量的分类
type BlogCategoryWithCount struct {
	BlogCategory
	PostCount int `json:"post_count"`
}

// TableName 指定表名
func (BlogPost) TableName() string {
	return "blog_posts"
}

// TableName 指定表名
func (BlogCategory) TableName() string {
	return "blog_categories"
}

// TableName 指定表名
func (Author) TableName() string {
	return "users" // 假设作者信息存储在 users 表
}

// BeforeCreate 创建前钩子
func (p *BlogPost) BeforeCreate(tx *gorm.DB) error {
	if p.Status == "published" && p.PublishedAt == nil {
		now := time.Now()
		p.PublishedAt = &now
	}
	return nil
}

// BeforeUpdate 更新前钩子
func (p *BlogPost) BeforeUpdate(tx *gorm.DB) error {
	if p.Status == "published" && p.PublishedAt == nil {
		now := time.Now()
		p.PublishedAt = &now
	}
	return nil
}
