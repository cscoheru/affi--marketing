package model

import (
    "time"
)

// User 系统用户
type User struct {
    ID        string    `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Email     string    `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
    Name      string    `json:"name" gorm:"type:varchar(255)"`
    Password  string    `json:"-" gorm:"type:varchar(255);not null"`
    Role      UserRole  `json:"role" gorm:"type:varchar(50);not null;default:'user'"`
    Status    UserStatus `json:"status" gorm:"type:varchar(50);not null;default:'active'"`
    APIToken  string    `json:"api_token" gorm:"type:varchar(255);uniqueIndex"`
    LastLogin *time.Time `json:"last_login"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (User) TableName() string {
    return "users"
}

// UserRole 用户角色
type UserRole string

const (
    UserRoleAdmin     UserRole = "admin"
    UserRoleUser      UserRole = "user"
    UserRoleAffiliate UserRole = "affiliate"
)

// UserStatus 用户状态
type UserStatus string

const (
    UserStatusActive   UserStatus = "active"
    UserStatusInactive UserStatus = "inactive"
    UserStatusSuspended UserStatus = "suspended"
)

// APIKey API 密钥
type APIKey struct {
    ID        string    `json:"id" gorm:"primaryKey;type:varchar(50)"`
    UserID    string    `json:"user_id" gorm:"type:varchar(50);not null;index"`
    Name      string    `json:"name" gorm:"type:varchar(255);not null"`
    Key       string    `json:"key" gorm:"type:varchar(255);uniqueIndex;not null"`
    Scopes    []string  `json:"scopes" gorm:"type:text[]"`
    LastUsed  *time.Time `json:"last_used"`
    ExpiresAt *time.Time `json:"expires_at"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (APIKey) TableName() string {
    return "api_keys"
}
