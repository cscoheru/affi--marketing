# Backend & AI Services Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Go backend service and Python AI service for Affi-Marketing, enabling Railway deployment and frontend API integration.

**Architecture:**
- Go backend (Gin + GORM) handles core business logic and exposes REST API
- Python AI service (FastAPI) provides AI content generation capabilities
- Go backend calls Python AI service via HTTP for AI operations
- Both services share PostgreSQL (阿里云) and Redis (阿里云)

**Tech Stack:**
- Go 1.21, Gin, GORM, Viper, Zap
- Python 3.11, FastAPI, Pydantic, LangChain
- PostgreSQL 15, Redis 7.x
- Railway for deployment

---

## Phase 1: Foundation (Day 1)

### Task 1: Create Go Response Utilities

**Files:**
- Create: `backend-go/pkg/response/response.go`

**Step 1: Create response utilities file**

```go
package response

import (
    "net/http"
    "time"
)

// Response 统一响应格式
type Response struct {
    Success   bool        `json:"success"`
    Code      int         `json:"code"`
    Message   string      `json:"message"`
    Data      interface{} `json:"data,omitempty"`
    Errors    []ErrorItem `json:"errors,omitempty"`
    Timestamp int64       `json:"timestamp"`
}

// ErrorItem 错误详情
type ErrorItem struct {
    Field   string `json:"field,omitempty"`
    Message string `json:"message"`
}

// NewSuccessResponse 创建成功响应
func NewSuccessResponse(data interface{}) Response {
    return Response{
        Success:   true,
        Code:      200,
        Message:   "success",
        Data:      data,
        Timestamp: time.Now().Unix(),
    }
}

// NewErrorResponse 创建错误响应
func NewErrorResponse(code int, message string, errors []ErrorItem) Response {
    return Response{
        Success:   false,
        Code:      code,
        Message:   message,
        Errors:    errors,
        Timestamp: time.Now().Unix(),
    }
}

// NewValidationErrorResponse 创建验证错误响应
func NewValidationErrorResponse(errors []ErrorItem) Response {
    return NewErrorResponse(422, "validation_error", errors)
}

// HTTP status code mapping
var StatusCodeMap = map[int]int{
    200: http.StatusOK,
    201: http.StatusCreated,
    202: http.StatusAccepted,
    400: http.StatusBadRequest,
    401: http.StatusUnauthorized,
    403: http.StatusForbidden,
    404: http.StatusNotFound,
    422: http.StatusUnprocessableEntity,
    429: http.StatusTooManyRequests,
    500: http.StatusInternalServerError,
    503: http.StatusServiceUnavailable,
}

// GetHTTPStatus 获取 HTTP 状态码
func GetHTTPStatus(code int) int {
    if status, ok := StatusCodeMap[code]; ok {
        return status
    }
    return http.StatusInternalServerError
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add pkg/response/response.go
git commit -m "feat: add unified response utilities"
```

---

### Task 2: Create Go Data Models - Experiment

**Files:**
- Create: `backend-go/internal/model/experiment.go`

**Step 1: Create experiment model**

```go
package model

import (
    "time"
    "database/sql/driver"
    "encoding/json"
    "errors"
)

// Experiment 商业模式实验
type Experiment struct {
    ID          string                 `json:"id" gorm:"primaryKey;type:varchar(50)"`
    Name        string                 `json:"name" gorm:"type:varchar(255);not null"`
    Type        ExperimentType         `json:"type" gorm:"type:varchar(50);not null;index"`
    Status      ExperimentStatus       `json:"status" gorm:"type:varchar(50);not null;default:'draft';index"`
    Config      ExperimentConfig       `json:"config" gorm:"type:jsonb"`
    Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
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
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/model/experiment.go
git commit -m "feat: add experiment data model"
```

---

### Task 3: Create Go Data Models - User

**Files:**
- Create: `backend-go/internal/model/user.go`

**Step 1: Create user model**

```go
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
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/model/user.go
git commit -m "feat: add user and api_key data models"
```

---

### Task 4: Create Database Initialization

**Files:**
- Create: `backend-go/pkg/database/postgres.go`

**Step 1: Create database package**

```go
package database

import (
    "fmt"
    "time"

    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"

    "github.com/zenconsult/affi-marketing/internal/config"
    "github.com/zenconsult/affi-marketing/internal/model"
)

// NewPostgres 创建 PostgreSQL 连接
func NewPostgres(cfg config.DatabaseConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
    )

    // 配置 GORM logger
    gormConfig := &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
        NowFunc: func() time.Time {
            return time.Now().UTC()
        },
    }

    db, err := gorm.Open(postgres.Open(dsn), gormConfig)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database: %w", err)
    }

    // 配置连接池
    sqlDB, err := db.DB()
    if err != nil {
        return nil, fmt.Errorf("failed to get database instance: %w", err)
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)
    sqlDB.SetConnMaxLifetime(time.Hour)

    return db, nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &model.Experiment{},
        &model.User{},
        &model.APIKey{},
    )
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add pkg/database/postgres.go
git commit -m "feat: add database initialization and migration"
```

---

### Task 5: Update Config to Include SSL Mode

**Files:**
- Modify: `backend-go/internal/config/config.go`

**Step 1: Read existing config**

```bash
cat /Users/kjonekong/Documents/Affi-Marketing/backend-go/internal/config/config.go
```

**Step 2: Add SSLMode to DatabaseConfig**

Find `DatabaseConfig` struct and add `SSLMode` field:

```go
type DatabaseConfig struct {
    Host     string `env:"DB_HOST,required"`
    Port     int    `env:"DB_PORT" envDefault:"5432"`
    User     string `env:"DB_USER,required"`
    Password string `env:"DB_PASSWORD,required"`
    DBName   string `env:"DB_NAME,required"`
    SSLMode  string `env:"DB_SSL_MODE" envDefault:"require"` // Add this line
}
```

**Step 3: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/config/config.go
git commit -m "feat: add SSLMode to database config"
```

---

## Phase 2: Authentication API (Day 2)

### Task 6: Create Auth Controller

**Files:**
- Create: `backend-go/internal/controller/auth/auth.go`

**Step 1: Create auth controller**

```go
package auth

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"

    "github.com/zenconsult/affi-marketing/internal/config"
    "github.com/zenconsult/affi-marketing/internal/model"
    "github.com/zenconsult/affi-marketing/pkg/response"
)

type Controller struct {
    db     *gorm.DB
    config config.Config
}

func NewController(db *gorm.DB, cfg config.Config) *Controller {
    return &Controller{
        db:     db,
        config: cfg,
    }
}

// LoginRequest 登录请求
type LoginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
    Token        string      `json:"token"`
    RefreshToken string      `json:"refresh_token"`
    User         model.User  `json:"user"`
}

// JWT Claims
type Claims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Login 用户登录
func (c *Controller) Login(ctx *gin.Context) {
    var req LoginRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "body", Message: err.Error()},
        }))
        return
    }

    // 查找用户
    var user model.User
    result := c.db.Where("email = ?", req.Email).First(&user)
    if result.Error != nil {
        ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_credentials", nil))
        return
    }

    // 验证密码
    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
        ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_credentials", nil))
        return
    }

    // 检查用户状态
    if user.Status != model.UserStatusActive {
        ctx.JSON(http.StatusForbidden, response.NewErrorResponse(403, "account_disabled", nil))
        return
    }

    // 生成 JWT Token
    accessToken, err := c.generateToken(user.ID, user.Email, string(user.Role), 24*time.Hour)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "token_generation_failed", nil))
        return
    }

    refreshToken, err := c.generateToken(user.ID, user.Email, string(user.Role), 7*24*time.Hour)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "token_generation_failed", nil))
        return
    }

    // 更新最后登录时间
    now := time.Now()
    user.LastLogin = &now
    c.db.Save(&user)

    // 清除密码字段
    user.Password = ""

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(LoginResponse{
        Token:        accessToken,
        RefreshToken: refreshToken,
        User:         user,
    }))
}

// generateToken 生成 JWT Token
func (c *Controller) generateToken(userID, email, role string, expiration time.Duration) (string, error) {
    claims := Claims{
        UserID: userID,
        Email:  email,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiration)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Subject:   userID,
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(c.config.JWT.Secret))
}

// RefreshToken 刷新 Token
func (c *Controller) RefreshToken(ctx *gin.Context) {
    var req struct {
        RefreshToken string `json:"refresh_token" binding:"required"`
    }

    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "body", Message: err.Error()},
        }))
        return
    }

    // 解析 Token
    token, err := jwt.ParseWithClaims(req.RefreshToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(c.config.JWT.Secret), nil
    })

    if err != nil || !token.Valid {
        ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_token", nil))
        return
    }

    claims, ok := token.Claims.(*Claims)
    if !ok {
        ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_token_claims", nil))
        return
    }

    // 查找用户
    var user model.User
    if err := c.db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
        ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "user_not_found", nil))
        return
    }

    // 生成新 Token
    accessToken, err := c.generateToken(user.ID, user.Email, string(user.Role), 24*time.Hour)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "token_generation_failed", nil))
        return
    }

    refreshToken, err := c.generateToken(user.ID, user.Email, string(user.Role), 7*24*time.Hour)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "token_generation_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "token":         accessToken,
        "refresh_token": refreshToken,
    }))
}

// Logout 登出
func (c *Controller) Logout(ctx *gin.Context) {
    // 在实际实现中，可能需要将 token 加入黑名单
    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "message": "logged_out_successfully",
    }))
}
```

**Step 2: Add JWT dependency**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
go get github.com/golang-jwt/jwt/v5
go get golang.org/x/crypto/bcrypt
```

**Step 3: Update config to include JWT**

Check if JWT config exists in `internal/config/config.go`:

```go
type JWTConfig struct {
    Secret           string        `env:"JWT_SECRET,required"`
    Expiration       time.Duration `env:"JWT_EXPIRATION" envDefault:"24h"`
    RefreshExpiration time.Duration `env:"JWT_REFRESH_EXPIRATION" envDefault:"168h"`
}
```

**Step 4: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/controller/auth/
git add go.mod go.sum
git commit -m "feat: add authentication controller with JWT"
```

---

### Task 7: Create Auth Middleware

**Files:**
- Create: `backend-go/internal/middleware/auth.go`

**Step 1: Create auth middleware**

```go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"

    "github.com/zenconsult/affi-marketing/internal/config"
    "github.com/zenconsult/affi-marketing/pkg/response"
)

type AuthMiddleware struct {
    jwtSecret string
}

func NewAuthMiddleware(cfg config.Config) *AuthMiddleware {
    return &AuthMiddleware{
        jwtSecret: cfg.JWT.Secret,
    }
}

// Authenticate JWT 认证中间件
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        authHeader := ctx.GetHeader("Authorization")
        if authHeader == "" {
            ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "missing_authorization_header", nil))
            ctx.Abort()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_authorization_format", nil))
            ctx.Abort()
            return
        }

        tokenString := parts[1]

        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return []byte(m.jwtSecret), nil
        })

        if err != nil || !token.Valid {
            ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_token", nil))
            ctx.Abort()
            return
        }

        claims, ok := token.Claims.(jwt.MapClaims)
        if !ok {
            ctx.JSON(http.StatusUnauthorized, response.NewErrorResponse(401, "invalid_token_claims", nil))
            ctx.Abort()
            return
        }

        // 将用户信息存入 context
        ctx.Set("user_id", claims["user_id"])
        ctx.Set("email", claims["email"])
        ctx.Set("role", claims["role"])

        ctx.Next()
    }
}

// RequireAdmin 要求管理员权限
func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
    return func(ctx *gin.Context) {
        role, exists := ctx.Get("role")
        if !exists {
            ctx.JSON(http.StatusForbidden, response.NewErrorResponse(403, "forbidden", nil))
            ctx.Abort()
            return
        }

        if role != "admin" {
            ctx.JSON(http.StatusForbidden, response.NewErrorResponse(403, "admin_required", nil))
            ctx.Abort()
            return
        }

        ctx.Next()
    }
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/middleware/auth.go
git commit -m "feat: add JWT authentication middleware"
```

---

### Task 8: Register Auth Routes

**Files:**
- Modify: `backend-go/cmd/server/main.go`

**Step 1: Read current main.go structure**

```bash
cat /Users/kjonekong/Documents/Affi-Marketing/backend-go/cmd/server/main.go
```

**Step 2: Add auth routes**

After the router is initialized, add auth routes:

```go
// Import auth controller
authController := auth.NewController(db, cfg)
authMiddleware := middleware.NewAuthMiddleware(cfg)

// Auth routes (public)
authGroup := v1.Group("/auth")
{
    authGroup.POST("/login", authController.Login)
    authGroup.POST("/refresh", authController.RefreshToken)
    authGroup.POST("/logout", authController.Logout)
}
```

**Step 3: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add cmd/server/main.go
git commit -m "feat: register authentication routes"
```

---

## Phase 3: Experiments API (Day 3)

### Task 9: Create Experiment Service

**Files:**
- Create: `backend-go/internal/service/experiment.go`

**Step 1: Create experiment service**

```go
package service

import (
    "errors"

    "github.com/google/uuid"
    "gorm.io/gorm"

    "github.com/zenconsult/affi-marketing/internal/model"
)

type ExperimentService struct {
    db *gorm.DB
}

func NewExperimentService(db *gorm.DB) *ExperimentService {
    return &ExperimentService{db: db}
}

// ListRequest 列表请求
type ListRequest struct {
    Page   int               `form:"page" binding:"min=1"`
    Size   int               `form:"size" binding:"min=1,max=100"`
    Type   string            `form:"type"`
    Status string            `form:"status"`
}

// ListResponse 列表响应
type ListResponse struct {
    Items []model.Experiment `json:"items"`
    Total int64              `json:"total"`
    Page  int                `json:"page"`
    Size  int                `json:"size"`
}

// List 获取实验列表
func (s *ExperimentService) List(req ListRequest) (*ListResponse, error) {
    query := s.db.Model(&model.Experiment{})

    // 筛选条件
    if req.Type != "" {
        query = query.Where("type = ?", req.Type)
    }
    if req.Status != "" {
        query = query.Where("status = ?", req.Status)
    }

    // 默认分页
    if req.Page == 0 {
        req.Page = 1
    }
    if req.Size == 0 {
        req.Size = 20
    }

    // 计算总数
    var total int64
    if err := query.Count(&total).Error; err != nil {
        return nil, err
    }

    // 分页查询
    var items []model.Experiment
    offset := (req.Page - 1) * req.Size
    if err := query.Offset(offset).Limit(req.Size).Order("created_at DESC").Find(&items).Error; err != nil {
        return nil, err
    }

    return &ListResponse{
        Items: items,
        Total: total,
        Page:  req.Page,
        Size:  req.Size,
    }, nil
}

// Get 获取实验详情
func (s *ExperimentService) Get(id string) (*model.Experiment, error) {
    var experiment model.Experiment
    if err := s.db.Where("id = ?", id).First(&experiment).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("experiment_not_found")
        }
        return nil, err
    }
    return &experiment, nil
}

// CreateRequest 创建请求
type CreateRequest struct {
    Name   string                 `json:"name" binding:"required,min=1,max=255"`
    Type   model.ExperimentType    `json:"type" binding:"required"`
    Config model.ExperimentConfig  `json:"config"`
}

// Create 创建实验
func (s *ExperimentService) Create(req CreateRequest, createdBy string) (*model.Experiment, error) {
    experiment := &model.Experiment{
        ID:        uuid.New().String(),
        Name:      req.Name,
        Type:      req.Type,
        Status:    model.ExperimentStatusDraft,
        Config:    req.Config,
        CreatedBy: createdBy,
    }

    if err := s.db.Create(experiment).Error; err != nil {
        return nil, err
    }

    return experiment, nil
}

// UpdateRequest 更新请求
type UpdateRequest struct {
    Name   *string                `json:"name"`
    Status *model.ExperimentStatus `json:"status"`
    Config *model.ExperimentConfig `json:"config"`
}

// Update 更新实验
func (s *ExperimentService) Update(id string, req UpdateRequest) (*model.Experiment, error) {
    var experiment model.Experiment
    if err := s.db.Where("id = ?", id).First(&experiment).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, errors.New("experiment_not_found")
        }
        return nil, err
    }

    updates := make(map[string]interface{})

    if req.Name != nil {
        updates["name"] = *req.Name
    }
    if req.Status != nil {
        updates["status"] = *req.Status
    }
    if req.Config != nil {
        updates["config"] = *req.Config
    }

    if err := s.db.Model(&experiment).Updates(updates).Error; err != nil {
        return nil, err
    }

    return &experiment, nil
}

// Delete 删除实验
func (s *ExperimentService) Delete(id string) error {
    result := s.db.Delete(&model.Experiment{}, "id = ?", id)
    if result.Error != nil {
        return result.Error
    }
    if result.RowsAffected == 0 {
        return errors.New("experiment_not_found")
    }
    return nil
}

// UpdateStatus 更新实验状态
func (s *ExperimentService) UpdateStatus(id string, status model.ExperimentStatus) error {
    var experiment model.Experiment
    if err := s.db.Where("id = ?", id).First(&experiment).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return errors.New("experiment_not_found")
        }
        return err
    }

    experiment.Status = status
    return s.db.Save(&experiment).Error
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/service/experiment.go
git commit -m "feat: add experiment service with CRUD operations"
```

---

### Task 10: Create Experiment Controller

**Files:**
- Create: `backend-go/internal/controller/experiment/experiment.go`

**Step 1: Create experiment controller**

```go
package experiment

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "github.com/zenconsult/affi-marketing/internal/model"
    "github.com/zenconsult/affi-marketing/internal/service"
    "github.com/zenconsult/affi-marketing/pkg/response"
)

type Controller struct {
    service *service.ExperimentService
}

func NewController(db *gorm.DB) *Controller {
    return &Controller{
        service: service.NewExperimentService(db),
    }
}

// List 获取实验列表
// GET /api/v1/experiments
func (c *Controller) List(ctx *gin.Context) {
    var req service.ListRequest
    if err := ctx.ShouldBindQuery(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "query", Message: err.Error()},
        }))
        return
    }

    result, err := c.service.List(req)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "internal_error", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(result))
}

// Get 获取实验详情
// GET /api/v1/experiments/:id
func (c *Controller) Get(ctx *gin.Context) {
    id := ctx.Param("id")

    experiment, err := c.service.Get(id)
    if err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "internal_error", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(experiment))
}

// Create 创建实验
// POST /api/v1/experiments
func (c *Controller) Create(ctx *gin.Context) {
    var req service.CreateRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "body", Message: err.Error()},
        }))
        return
    }

    // 从 context 获取用户 ID
    userID, exists := ctx.Get("user_id")
    if !exists {
        userID = "system" // 默认用户
    }

    experiment, err := c.service.Create(req, userID.(string))
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "creation_failed", nil))
        return
    }

    ctx.JSON(http.StatusCreated, response.NewSuccessResponse(experiment))
}

// Update 更新实验
// PUT /api/v1/experiments/:id
func (c *Controller) Update(ctx *gin.Context) {
    id := ctx.Param("id")

    var req service.UpdateRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "body", Message: err.Error()},
        }))
        return
    }

    experiment, err := c.service.Update(id, req)
    if err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "update_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(experiment))
}

// Delete 删除实验
// DELETE /api/v1/experiments/:id
func (c *Controller) Delete(ctx *gin.Context) {
    id := ctx.Param("id")

    if err := c.service.Delete(id); err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "deletion_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "message": "experiment_deleted",
    }))
}

// Start 启动实验
// POST /api/v1/experiments/:id/start
func (c *Controller) Start(ctx *gin.Context) {
    id := ctx.Param("id")

    if err := c.service.UpdateStatus(id, model.ExperimentStatusActive); err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "status_update_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "message": "experiment_started",
        "id":      id,
        "status":  "active",
    }))
}

// Stop 停止实验
// POST /api/v1/experiments/:id/stop
func (c *Controller) Stop(ctx *gin.Context) {
    id := ctx.Param("id")

    if err := c.service.UpdateStatus(id, model.ExperimentStatusCompleted); err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "status_update_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "message": "experiment_stopped",
        "id":      id,
        "status":  "completed",
    }))
}

// Pause 暂停实验
// POST /api/v1/experiments/:id/pause
func (c *Controller) Pause(ctx *gin.Context) {
    id := ctx.Param("id")

    if err := c.service.UpdateStatus(id, model.ExperimentStatusPaused); err != nil {
        if err.Error() == "experiment_not_found" {
            ctx.JSON(http.StatusNotFound, response.NewErrorResponse(404, "experiment_not_found", nil))
            return
        }
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "status_update_failed", nil))
        return
    }

    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "message": "experiment_paused",
        "id":      id,
        "status":  "paused",
    }))
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/controller/experiment/
git commit -m "feat: add experiment controller with all CRUD endpoints"
```

---

### Task 11: Register Experiment Routes

**Files:**
- Modify: `backend-go/cmd/server/main.go`

**Step 1: Add experiment routes**

```go
// Import experiment controller
experimentController := experiment.NewController(db)

// Experiments routes (protected by auth)
experiments := v1.Group("/experiments")
experiments.Use(authMiddleware.Authenticate())
{
    experiments.GET("", experimentController.List)
    experiments.POST("", experimentController.Create)
    experiments.GET("/:id", experimentController.Get)
    experiments.PUT("/:id", experimentController.Update)
    experiments.DELETE("/:id", experimentController.Delete)
    experiments.POST("/:id/start", experimentController.Start)
    experiments.POST("/:id/stop", experimentController.Stop)
    experiments.POST("/:id/pause", experimentController.Pause)
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add cmd/server/main.go
git commit -m "feat: register experiment routes with authentication"
```

---

## Phase 4: AI Service Integration (Day 4)

### Task 12: Create AI Service Client in Go

**Files:**
- Create: `backend-go/internal/service/ai/client.go`

**Step 1: Create AI client**

```go
package ai

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "time"
)

type Client struct {
    baseURL    string
    httpClient *http.Client
    timeout    time.Duration
}

type Config struct {
    URL     string
    Timeout time.Duration
}

func NewClient(cfg Config) *Client {
    if cfg.Timeout == 0 {
        cfg.Timeout = 30 * time.Second
    }

    return &Client{
        baseURL: cfg.URL,
        httpClient: &http.Client{
            Timeout: cfg.Timeout,
        },
        timeout: cfg.Timeout,
    }
}

// GenerateContentRequest 内容生成请求
type GenerateContentRequest struct {
    Keyword string                 `json:"keyword"`
    Type    string                 `json:"type"`
    Options map[string]interface{} `json:"options"`
}

// GenerateContentResponse 内容生成响应
type GenerateContentResponse struct {
    Success bool `json:"success"`
    Code    int  `json:"code"`
    Data    struct {
        Title   string                 `json:"title"`
        Content string                 `json:"content"`
        Summary string                 `json:"summary"`
        MetaTags map[string]string     `json:"meta_tags"`
    } `json:"data"`
    Metrics struct {
        TokensUsed int     `json:"tokens_used"`
        Cost       float64 `json:"cost"`
        DurationMs int     `json:"duration_ms"`
    } `json:"metrics"`
}

// GenerateContent 生成内容
func (c *Client) GenerateContent(ctx context.Context, req GenerateContentRequest) (*GenerateContentResponse, error) {
    // 构建请求 URL
    url := fmt.Sprintf("%s/api/v1/generate-content", c.baseURL)

    // 序列化请求体
    reqBody, err := json.Marshal(req)
    if err != nil {
        return nil, fmt.Errorf("failed to marshal request: %w", err)
    }

    // 创建 HTTP 请求
    httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBody))
    if err != nil {
        return nil, fmt.Errorf("failed to create request: %w", err)
    }

    httpReq.Header.Set("Content-Type", "application/json")

    // 发送请求
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    // 读取响应体
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %w", err)
    }

    // 检查 HTTP 状态码
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("AI service returned status %d: %s", resp.StatusCode, string(body))
    }

    // 解析响应
    var result GenerateContentResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to unmarshal response: %w", err)
    }

    return &result, nil
}

// HealthCheck 检查 AI 服务健康状态
func (c *Client) HealthCheck(ctx context.Context) error {
    url := fmt.Sprintf("%s/health", c.baseURL)

    httpReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }

    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return fmt.Errorf("failed to send request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("AI service unhealthy: status %d", resp.StatusCode)
    }

    return nil
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/service/ai/client.go
git commit -m "feat: add AI service client for content generation"
```

---

### Task 13: Create AI Content Generation Controller

**Files:**
- Create: `backend-go/internal/controller/ai/content.go`

**Step 1: Create AI content controller**

```go
package ai

import (
    "net/http"

    "github.com/gin-gonic/gin"

    "github.com/zenconsult/affi-marketing/internal/service/ai"
    "github.com/zenconsult/affi-marketing/pkg/response"
)

type Controller struct {
    aiClient *ai.Client
}

func NewController(aiClient *ai.Client) *Controller {
    return &Controller{
        aiClient: aiClient,
    }
}

// GenerateContentRequest 生成内容请求
type GenerateContentRequest struct {
    Keyword string                 `json:"keyword" binding:"required"`
    Type    string                 `json:"type" binding:"required"`
    Options map[string]interface{} `json:"options"`
}

// GenerateContent 生成 AI 内容
// POST /api/v1/ai/generate-content
func (c *Controller) GenerateContent(ctx *gin.Context) {
    var req GenerateContentRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, response.NewValidationErrorResponse([]response.ErrorItem{
            {Field: "body", Message: err.Error()},
        }))
        return
    }

    // 调用 AI 服务
    aiReq := ai.GenerateContentRequest{
        Keyword: req.Keyword,
        Type:    req.Type,
        Options: req.Options,
    }

    aiResp, err := c.aiClient.GenerateContent(ctx.Request.Context(), aiReq)
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, response.NewErrorResponse(500, "ai_service_error", []response.ErrorItem{
            {Message: err.Error()},
        }))
        return
    }

    // 返回结果
    ctx.JSON(http.StatusOK, response.NewSuccessResponse(gin.H{
        "title":      aiResp.Data.Title,
        "content":    aiResp.Data.Content,
        "summary":    aiResp.Data.Summary,
        "meta_tags":  aiResp.Data.MetaTags,
        "metrics":    aiResp.Metrics,
    }))
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/controller/ai/
git commit -m "feat: add AI content generation controller"
```

---

### Task 14: Register AI Routes

**Files:**
- Modify: `backend-go/cmd/server/main.go`

**Step 1: Initialize AI client and register routes**

```go
// Import AI controller and service
aiClient := ai.NewClient(ai.Config{
    URL:     cfg.AI.ServiceURL,
    Timeout: 30 * time.Second,
})
aiController := ai2.NewController(aiClient)

// AI routes (protected)
ai := v1.Group("/ai")
ai.Use(authMiddleware.Authenticate())
{
    ai.POST("/generate-content", aiController.GenerateContent)
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add cmd/server/main.go
git commit -m "feat: register AI content generation routes"
```

---

## Phase 5: Python AI Service (Day 4-5)

### Task 15: Create AI Service Pydantic Models

**Files:**
- Create: `ai-service/app/models/schemas.py`

**Step 1: Create Pydantic models**

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = "healthy"
    version: str = "1.0.0"
    services: Dict[str, str] = {}


class ContentGenerateRequest(BaseModel):
    """内容生成请求"""
    keyword: str = Field(..., description="关键词或主题")
    content_type: str = Field(..., description="内容类型: seo_article, product_description, etc.")
    target_length: int = Field(1000, description="目标字数", ge=100, le=5000)
    style: Optional[str] = Field("professional", description="写作风格")
    language: str = Field("zh", description="语言")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class MetaTags(BaseModel):
    """SEO 元标签"""
    title: str
    description: str
    keywords: str
    og_title: Optional[str] = None
    og_image: Optional[str] = None
    canonical: Optional[str] = None


class ContentMetrics(BaseModel):
    """内容生成指标"""
    tokens_used: int
    cost: float
    duration_ms: int
    model: str


class ContentGenerateResponse(BaseModel):
    """内容生成响应"""
    success: bool
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: int


class ContentData(BaseModel):
    """生成的内容数据"""
    title: str
    content: str
    summary: str
    meta_tags: MetaTags
    metrics: ContentMetrics
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
git add app/models/schemas.py
git commit -m "feat: add Pydantic models for AI service"
```

---

### Task 16: Create AI Service Manager

**Files:**
- Create: `ai-service/app/services/manager.py`

**Step 1: Create service manager**

```python
from typing import Optional, Dict, Any
from datetime import datetime
import time

from app.adapters.qwen_adapter import QwenAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.chatglm_adapter import ChatGLMAdapter
from app.models.schemas import (
    ContentGenerateRequest,
    ContentData,
    MetaTags,
    ContentMetrics
)
from app.services.monitoring.cost_tracker import CostTracker


class AIServiceManager:
    """AI 服务管理器"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.adapters = {}
        self.cost_tracker = CostTracker()
        self._init_adapters()

    def _init_adapters(self):
        """初始化所有 AI 适配器"""

        # Qwen (阿里云千问)
        if qwen_key := self.config.get("dashscope_api_key"):
            self.adapters["qwen"] = QwenAdapter(api_key=qwen_key)

        # OpenAI
        if openai_key := self.config.get("openai_api_key"):
            self.adapters["openai"] = OpenAIAdapter(api_key=openai_key)

        # ChatGLM
        if chatglm_key := self.config.get("chatglm_api_key"):
            self.adapters["chatglm"] = ChatGLMAdapter(api_key=chatglm_key)

    def get_adapter(self, model_name: Optional[str] = None):
        """获取指定的适配器"""
        if not model_name:
            # 默认使用第一个可用的适配器
            model_name = next(iter(self.adapters.keys()), None)

        if model_name and model_name in self.adapters:
            return self.adapters[model_name]

        raise ValueError(f"Adapter '{model_name}' not found or not configured")

    async def generate_content(
        self,
        request: ContentGenerateRequest,
        model: Optional[str] = None
    ) -> ContentData:
        """生成内容"""

        # 获取适配器
        adapter = self.get_adapter(model)
        model_name = model or list(self.adapters.keys())[0]

        # 构建提示词
        prompt = self._build_prompt(request)

        # 调用 AI 模型
        start_time = time.time()
        result = await adapter.generate(
            prompt=prompt,
            max_tokens=request.target_length * 2,  # 估算 token 数
        )
        duration_ms = int((time.time() - start_time) * 1000)

        # 解析结果
        content_data = self._parse_result(result, request, model_name, duration_ms)

        # 记录成本
        await self.cost_tracker.track_usage(
            model=model_name,
            tokens=content_data.metrics.tokens_used,
            cost=content_data.metrics.cost
        )

        return content_data

    def _build_prompt(self, request: ContentGenerateRequest) -> str:
        """构建提示词"""

        if request.content_type == "seo_article":
            return self._build_seo_prompt(request)
        elif request.content_type == "product_description":
            return self._build_product_prompt(request)
        else:
            return self._build_generic_prompt(request)

    def _build_seo_prompt(self, request: ContentGenerateRequest) -> str:
        """构建 SEO 文章提示词"""
        return f"""请基于关键词"{request.keyword}"撰写一篇 SEO 优化的文章。

要求：
- 字数约 {request.target_length} 字
- 风格：{request.style}
- 语言：{request.language}
- 包含吸引人的标题
- 内容结构清晰，有明确的段落和小标题
- 自然融入关键词
- 适合搜索引擎优化

请以以下格式返回：
---
标题：[文章标题]

摘要：[文章摘要，100字以内]

正文：
[文章正文]

---
SEO 元标签建议：
- Title: [标题标签]
- Description: [描述标签]
- Keywords: [关键词标签]
"""

    def _build_product_prompt(self, request: ContentGenerateRequest) -> str:
        """构建产品描述提示词"""
        return f"""请为产品"{request.keyword}"撰写一段吸引人的产品描述。

要求：
- 字数约 {request.target_length} 字
- 风格：{request.style}
- 语言：{request.language}
- 突出产品特点和优势
- 具有说服力和吸引力

请以以下格式返回：
---
标题：[产品标题]

描述：
[产品描述]

---
SEO 元标签建议：
- Title: [标题标签]
- Description: [描述标签]
"""

    def _build_generic_prompt(self, request: ContentGenerateRequest) -> str:
        """构建通用提示词"""
        return f"""请基于"{request.keyword}"撰写{request.content_type}类型的内容。

要求：
- 字数约 {request.target_length} 字
- 风格：{request.style}
- 语言：{request.language}
"""

    def _parse_result(
        self,
        result: str,
        request: ContentGenerateRequest,
        model: str,
        duration_ms: int
    ) -> ContentData:
        """解析 AI 返回结果"""

        # 简单解析（实际需要更复杂的解析逻辑）
        lines = result.split('\n')

        title = request.keyword
        content = result
        summary = result[:200] + "..." if len(result) > 200 else result

        # 提取 SEO 元标签
        meta_tags = MetaTags(
            title=title,
            description=summary,
            keywords=request.keyword
        )

        # 估算成本（简化）
        tokens = len(result) // 2  # 粗略估算
        cost = self._estimate_cost(model, tokens)

        metrics = ContentMetrics(
            tokens_used=tokens,
            cost=cost,
            duration_ms=duration_ms,
            model=model
        )

        return ContentData(
            title=title,
            content=content,
            summary=summary,
            meta_tags=meta_tags,
            metrics=metrics
        )

    def _estimate_cost(self, model: str, tokens: int) -> float:
        """估算成本"""
        # 简化成本计算
        costs = {
            "qwen": 0.0001,
            "openai": 0.0003,
            "chatglm": 0.0001
        }
        per_token_cost = costs.get(model, 0.0001)
        return per_token_cost * tokens
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
git add app/services/manager.py
git commit -m "feat: add AI service manager with multi-adapter support"
```

---

### Task 17: Update AI Service Main Application

**Files:**
- Modify: `ai-service/app/main.py`

**Step 1: Read existing main.py**

```bash
cat /Users/kjonekong/Documents/Affi-Marketing/ai-service/app/main.py
```

**Step 2: Update main.py with complete routes**

Ensure main.py includes:

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import time

from app.config import settings
from app.models.schemas import (
    HealthResponse,
    ContentGenerateRequest,
    ContentGenerateResponse
)
from app.services.manager import AIServiceManager


# AI Service Manager (全局实例)
ai_manager: AIServiceManager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global ai_manager

    # 启动时初始化
    ai_manager = AIServiceManager({
        "dashscope_api_key": settings.dashscope_api_key,
        "openai_api_key": settings.openai_api_key,
        "chatglm_api_key": settings.chatglm_api_key,
    })

    yield

    # 关闭时清理
    pass


# 创建 FastAPI 应用
app = FastAPI(
    title="Affi-Marketing AI Service",
    description="AI content generation service for affiliate marketing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "ai_adapters": "ok" if ai_manager and ai_manager.adapters else "not_configured"
        }
    )


@app.post("/api/v1/generate-content", response_model=ContentGenerateResponse)
async def generate_content(request: ContentGenerateRequest):
    """生成内容"""

    if not ai_manager:
        raise HTTPException(status_code=503, detail="AI service not initialized")

    try:
        result = await ai_manager.generate_content(request)

        return ContentGenerateResponse(
            success=True,
            code=200,
            message="success",
            data={
                "title": result.title,
                "content": result.content,
                "summary": result.summary,
                "meta_tags": result.meta_tags.dict(),
                "metrics": result.metrics.dict()
            },
            timestamp=int(time.time())
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "Affi-Marketing AI Service",
        "version": "1.0.0",
        "status": "running"
    }
```

**Step 3: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
git add app/main.py
git commit -m "feat: update main.py with complete API routes"
```

---

### Task 18: Create AI Service Environment Template

**Files:**
- Create: `ai-service/.env.example`

**Step 1: Create .env.example**

```bash
# Application
APP_NAME=affi-marketing-ai
APP_VERSION=1.0.0
ENVIRONMENT=production
API_HOST=0.0.0.0
API_PORT=8000

# AI API Keys (配置至少一个)
DASHSCOPE_API_KEY=your_dashscope_key_here
OPENAI_API_KEY=your_openai_key_here
CHATGLM_API_KEY=your_chatglm_key_here

# Database (可选，用于缓存)
# DATABASE_URL=postgresql+asyncpg://postgres:password@host:5432/dbname

# Redis (可选，用于缓存)
# REDIS_URL=redis://:password@host:6379/0

# CORS
CORS_ORIGINS=https://hub.zenconsult.top,https://vue.example.com

# Logging
LOG_LEVEL=INFO
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
git add .env.example
git commit -m "feat: add environment variables template"
```

---

## Phase 6: Health Check & Testing (Day 5)

### Task 19: Create Health Check Endpoint in Go

**Files:**
- Create: `backend-go/internal/controller/health/health.go`

**Step 1: Create health check controller**

```go
package health

import (
    "net/http"
    "runtime"
    "time"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "github.com/zenconsult/affi-marketing/internal/service/ai"
    "github.com/zenconsult/affi-marketing/pkg/response"
)

type Controller struct {
    db      *gorm.DB
    aiClient *ai.Client
}

func NewController(db *gorm.DB, aiClient *ai.Client) *Controller {
    return &Controller{
        db:      db,
        aiClient: aiClient,
    }
}

// CheckResponse 健康检查响应
type CheckResponse struct {
    Status   string            `json:"status"`
    Version  string            `json:"version"`
    Services map[string]string `json:"services"`
    System   SystemInfo        `json:"system"`
}

// SystemInfo 系统信息
type SystemInfo struct {
    GoVersion   string `json:"go_version"`
    NumGoroutine int    `json:"num_goroutine"`
    MemoryAlloc  uint64 `json:"memory_alloc"`
    Uptime       string `json:"uptime"`
}

var startTime = time.Now()

// Health 健康检查
// GET /health
func (c *Controller) Health(ctx *gin.Context) {
    services := make(map[string]string)

    // 检查数据库
    sqlDB, err := c.db.DB()
    if err != nil {
        services["database"] = "error"
    } else if err := sqlDB.Ping(); err != nil {
        services["database"] = "unhealthy"
    } else {
        services["database"] = "ok"
    }

    // 检查 AI 服务
    if c.aiClient != nil {
        if err := c.aiClient.HealthCheck(ctx.Request.Context()); err != nil {
            services["ai_service"] = "unreachable"
        } else {
            services["ai_service"] = "ok"
        }
    } else {
        services["ai_service"] = "not_configured"
    }

    // 系统信息
    var m runtime.MemStats
    runtime.ReadMemStats(&m)

    system := SystemInfo{
        GoVersion:    runtime.Version(),
        NumGoroutine: runtime.NumGoroutine(),
        MemoryAlloc:  m.Alloc,
        Uptime:       time.Since(startTime).String(),
    }

    // 判断整体状态
    status := "healthy"
    for _, s := range services {
        if s != "ok" && s != "not_configured" {
            status = "unhealthy"
            break
        }
    }

    ctx.JSON(http.StatusOK, CheckResponse{
        Status:   status,
        Version:  "1.0.0",
        Services: services,
        System:   system,
    })
}
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add internal/controller/health/
git commit -m "feat: add health check controller"
```

---

### Task 20: Register Health Check Route

**Files:**
- Modify: `backend-go/cmd/server/main.go`

**Step 1: Add health check route (public, no auth)**

```go
// Import health controller
healthController := health.NewController(db, aiClient)

// Health check (public)
r.GET("/health", healthController.Health)
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add cmd/server/main.go
git commit -m "feat: register health check route"
```

---

### Task 21: Create Backend .env.example

**Files:**
- Create: `backend-go/.env.example`

**Step 1: Create .env.example**

```bash
# Server
PORT=8080
GIN_MODE=release

# Database (阿里云杭州)
DB_HOST=139.224.42.111
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=business_hub
DB_SSL_MODE=require

# Redis (阿里云杭州)
REDIS_HOST=139.224.42.111
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
REDIS_DB=0

# JWT
JWT_SECRET=your_jwt_secret_here_change_in_production
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=168h

# AI Service
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_TIMEOUT=30s

# CORS
CORS_ALLOWED_ORIGINS=https://hub.zenconsult.top,https://vue.example.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add .env.example
git commit -m "feat: add environment variables template"
```

---

## Phase 7: Build & Deploy Verification (Day 6)

### Task 22: Verify Go Build

**Files:**
- None

**Step 1: Build Go application**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
go build -o server cmd/server/main.go
```

**Step 2: Verify build output**

Expected: No errors, `server` executable created

**Step 3: Clean build artifact**

```bash
rm -f server
```

**Step 4: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add -A && git commit -m "chore: verify build succeeds"
```

---

### Task 23: Verify Python Dependencies

**Files:**
- None

**Step 1: Check Python dependencies**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
pip install -r requirements.txt --dry-run
```

**Step 2: Verify all imports exist**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
python -m py_compile app/main.py
```

**Step 3: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/ai-service
git add -A && git commit -m "chore: verify Python dependencies"
```

---

### Task 24: Create Deployment Documentation

**Files:**
- Create: `backend-go/DEPLOYMENT.md`

**Step 1: Create deployment guide**

```markdown
# Backend Service Deployment Guide

## Prerequisites

- Railway account
- PostgreSQL database (阿里云杭州: 139.224.42.111:5432)
- Redis instance (阿里云杭州: 139.224.42.111:6379)
- AI Service deployed

## Environment Variables

Required environment variables (see `.env.example`):

### Database
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `DB_SSL_MODE`: SSL mode (default: require)

### Redis
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port (default: 6379)
- `REDIS_PASSWORD`: Redis password
- `REDIS_DB`: Redis database (default: 0)

### JWT
- `JWT_SECRET`: JWT signing secret (generate a strong random string)

### AI Service
- `AI_SERVICE_URL`: AI Service URL (e.g., http://ai-service.railway.app)

### CORS
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins

## Railway Deployment

1. Create new Railway project
2. Add GitHub repository
3. Select `backend-go` directory as root
4. Add environment variables
5. Deploy

## Health Check

After deployment, verify health:

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "ai_service": "ok"
  }
}
```

## Database Migration

On first deploy, the app will auto-migrate tables:
- experiments
- users
- api_keys

## Troubleshooting

### Database Connection Failed
- Verify DB_HOST and DB_PORT
- Check DB_PASSWORD
- Ensure SSL_MODE is correct (require for remote DB)

### AI Service Unreachable
- Verify AI_SERVICE_URL is correct
- Ensure AI Service is deployed and healthy
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
git add DEPLOYMENT.md
git commit -m "docs: add deployment guide"
```

---

### Task 25: Update PROJECT_PROGRESS.md

**Files:**
- Modify: `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`

**Step 1: Update progress for 04-后端与AI**

Add to PROJECT_PROGRESS.md:

```markdown
### 04-后端与AI
**状态**: ✅完成
**当前阶段**: 实施完成
**开始时间**: 2026-03-05
**完成时间**: 2026-03-05

**依赖**:
- [x] 01-架构师完成架构设计 ✅

**产出文件**:
- [x] backend-go/pkg/response/response.go: 统一响应格式
- [x] backend-go/internal/model/: 数据模型 (experiment, user)
- [x] backend-go/internal/controller/auth/: 认证控制器
- [x] backend-go/internal/controller/experiment/: 实验控制器
- [x] backend-go/internal/controller/ai/: AI 内容生成控制器
- [x] backend-go/internal/controller/health/: 健康检查
- [x] backend-go/internal/service/: 业务服务层
- [x] backend-go/pkg/database/: 数据库初始化
- [x] backend-go/.env.example: 环境变量模板
- [x] backend-go/DEPLOYMENT.md: 部署文档
- [x] ai-service/app/models/schemas.py: Pydantic 模型
- [x] ai-service/app/services/manager.py: AI 服务管理器
- [x] ai-service/.env.example: 环境变量模板
- [x] docs/plans/2026-03-05-backend-ai-implementation.md: 实施计划
- [x] docs/plans/2026-03-05-backend-ai-implementation-design.md: 设计文档

**API 端点**:
- POST /api/v1/auth/login - 用户登录
- POST /api/v1/auth/refresh - 刷新 Token
- POST /api/v1/auth/logout - 登出
- GET /api/v1/experiments - 实验列表
- POST /api/v1/experiments - 创建实验
- GET /api/v1/experiments/:id - 实验详情
- PUT /api/v1/experiments/:id - 更新实验
- DELETE /api/v1/experiments/:id - 删除实验
- POST /api/v1/experiments/:id/start - 启动实验
- POST /api/v1/experiments/:id/stop - 停止实验
- POST /api/v1/experiments/:id/pause - 暂停实验
- POST /api/v1/ai/generate-content - AI 内容生成
- GET /health - 健康检查

**遗留问题**:
- [ ] 需要配置 AI API Keys (DASHSCOPE_API_KEY, OPENAI_API_KEY, CHATGLM_API_KEY)
- [ ] 需要在 Railway 配置环境变量
- [ ] 需要部署到 Railway 并验证
```

**Step 2: Commit**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing
git add PROJECT_PROGRESS.md
git commit -m "docs: update progress for 04-backend-ai role"
```

---

## Summary

This implementation plan covers:

1. **Foundation**: Response utilities, data models, database initialization
2. **Authentication**: JWT-based auth with login/logout/refresh
3. **Experiments API**: Full CRUD operations with status control
4. **AI Integration**: Go client to Python AI service
5. **AI Service**: Multi-adapter AI service with Qwen/OpenAI/ChatGLM support
6. **Health Check**: Comprehensive health monitoring
7. **Deployment**: Environment templates and deployment documentation

**Total Tasks**: 25
**Estimated Duration**: 5-6 days
**Tech Stack**: Go 1.21, Python 3.11, FastAPI, Gin, GORM, PostgreSQL, Redis
