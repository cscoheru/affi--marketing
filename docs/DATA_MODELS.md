# 数据模型设计文档

## 文档信息

| 字段 | 值 |
|------|-----|
| **文档版本** | v1.0 |
| **创建日期** | 2026-03-03 |
| **创建角色** | 01-架构师 |
| **项目阶段** | 架构设计 |

---

## 1. 数据模型概述

### 1.1 核心实体关系

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Experiments│         │    Tracks   │         │  Conversions │
├─────────────┤         ├─────────────┤         ├──────────────┤
│ id          │         │ id          │         │ id           │
│ name        │    ┌────│ experiment_id│◄────┐   │ track_id     │
│ type        │    │    │ visitor_id  │     │   │ amount       │
│ status      │    │    │ event_type  │     │   │ currency     │
│ config      │    │    │ properties  │     │   │ status       │
│ created_at  │    │    │ timestamp   │     │   │ attributed_to│
└─────────────┘    │    └─────────────┘     │   │ created_at   │
                   │                         └──────────────┘
                   ▼
┌─────────────────────────────┐              │
│        Touchpoints          │              │
├─────────────────────────────┤              │
│ id                          │              │
│ track_id                    │◄─────────────┘
│ channel                     │
│ source                      │
│ campaign                    │
│ content                     │
│ position                    │
└─────────────────────────────┘

┌─────────────────────────────┐
│        Settlements          │
├─────────────────────────────┤
│ id                          │
│ conversion_id               │◄──── Conversions
│ period                      │
│ total_amount                │
│ platform_fee                │
│ affiliate_share             │
│ status                      │
│ paid_at                     │
└─────────────────────────────┘
```

---

## 2. 核心数据模型

### 2.1 实验模型 (Experiment)

```go
// Experiment 商业模式实验
type Experiment struct {
    ID          string                 `json:"id" gorm:"primaryKey"`
    Name        string                 `json:"name" gorm:"not null"`
    Type        ExperimentType         `json:"type" gorm:"not null"`
    Status      ExperimentStatus       `json:"status" gorm:"not null;default:'draft'"`
    Config      ExperimentConfig       `json:"config" gorm:"type:jsonb"`
    Metadata    map[string]interface{} `json:"metadata" gorm:"type:jsonb"`
    StartDate   *time.Time             `json:"start_date"`
    EndDate     *time.Time             `json:"end_date"`
    CreatedBy   string                 `json:"created_by"`
    CreatedAt   time.Time             `json:"created_at"`
    UpdatedAt   time.Time             `json:"updated_at"`

    // 关联关系
    Tracks      []Track               `json:"tracks" gorm:"foreignKey:ExperimentID"`
    Conversions []Conversion          `json:"conversions" gorm:"foreignKey:ExperimentID"`
}

// ExperimentType 实验类型
type ExperimentType string

const (
    ExperimentTypeSEO          ExperimentType = "seo"           // 程序化 SEO
    ExperimentTypeGEO          ExperimentType = "geo"           // 生成式引擎优化
    ExperimentTypeAIAgent      ExperimentType = "ai_agent"      // AI 代理电商
    ExperimentTypeAffiliateSAAS ExperimentType = "affiliate_saas" // 联盟营销 SaaS
)

// ExperimentStatus 实验状态
type ExperimentStatus string

const (
    ExperimentStatusDraft      ExperimentStatus = "draft"       // 草稿
    ExperimentStatusActive     ExperimentStatus = "active"      // 进行中
    ExperimentStatusPaused     ExperimentStatus = "paused"      // 暂停
    ExperimentStatusCompleted  ExperimentStatus = "completed"   // 已完成
    ExperimentStatusArchived   ExperimentStatus = "archived"    // 已归档
)

// ExperimentConfig 实验配置
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
    MerchantDomains   []string `json:"merchant_domains"`
    CommissionTiers   []CommissionTier `json:"commission_tiers"`
    CookieDuration   int      `json:"cookie_duration"` // 天数
    ApprovalWorkflow string   `json:"approval_workflow"`
}
```

### 2.2 追踪事件模型 (Track)

```go
// Track 追踪事件
type Track struct {
    ID           string                 `json:"id" gorm:"primaryKey"`
    ExperimentID string                 `json:"experiment_id" gorm:"not null;index"`
    VisitorID    string                 `json:"visitor_id" gorm:"not null;index"`
    SessionID    string                 `json:"session_id" gorm:"index"`
    EventType    TrackEventType         `json:"event_type" gorm:"not null;index"`
    Properties   map[string]interface{} `json:"properties" gorm:"type:jsonb"`
    Touchpoints  []Touchpoint           `json:"touchpoints" gorm:"foreignKey:TrackID"`
    Timestamp    time.Time             `json:"timestamp" gorm:"not null;index"`
    CreatedAt    time.Time             `json:"created_at"`
}

// TrackEventType 事件类型
type TrackEventType string

const (
    EventTypePageView      TrackEventType = "page_view"       // 页面浏览
    EventTypeClick         TrackEventType = "click"           // 点击
    EventTypeSubmit        TrackEventType = "submit"          // 表单提交
    EventTypePurchase      TrackEventType = "purchase"        // 购买
    EventTypeSignup        TrackEventType = "signup"          // 注册
    EventTypeCustom        TrackEventType = "custom"          // 自定义事件
)

// Touchpoint 触点
type Touchpoint struct {
    ID          string       `json:"id" gorm:"primaryKey"`
    TrackID     string       `json:"track_id" gorm:"not null;index"`
    Channel     string       `json:"channel" gorm:"not null"`    // organic, paid, social, email, direct
    Source      string       `json:"source" gorm:"not null"`     // google, facebook, twitter, etc.
    Campaign    string       `json:"campaign"`                    // utm_campaign
    Content     string       `json:"content"`                     // utm_content
    Term        string       `json:"term"`                        // utm_term
    Medium      string       `json:"medium"`                      // utm_medium
    Position    int          `json:"position"`                    // 在路径中的位置
    FirstSeen   time.Time    `json:"first_seen"`
    ReferrerURL string       `json:"referrer_url"`
    LandingPage string       `json:"landing_page"`
    CreatedAt   time.Time    `json:"created_at"`
}
```

### 2.3 转化模型 (Conversion)

```go
// Conversion 转化事件
type Conversion struct {
    ID           string           `json:"id" gorm:"primaryKey"`
    ExperimentID string           `json:"experiment_id" gorm:"not null;index"`
    TrackID      string           `json:"track_id" gorm:"not null;index"`
    VisitorID    string           `json:"visitor_id" gorm:"not null;index"`
    Type         ConversionType   `json:"type" gorm:"not null;index"`
    Amount       float64          `json:"amount"`
    Currency     string           `json:"currency" gorm:"default:'USD'"`
    Status       ConversionStatus `json:"status" gorm:"not null;default:'pending'"`
    AttributedTo string           `json:"attributed_to"` // 归因的触点 ID
    AttributionModel string       `json:"attribution_model" gorm:"default:'last_click'"`
    AttributionValue float64     `json:"attribution_value"` // 归因值
    Properties   map[string]interface{} `json:"properties" gorm:"type:jsonb"`
    OccurredAt   time.Time       `json:"occurred_at" gorm:"not null;index"`
    CreatedAt    time.Time       `json:"created_at"`

    // 关联关系
    Settlement   *Settlement      `json:"settlement" gorm:"foreignKey:ConversionID"`
}

// ConversionType 转化类型
type ConversionType string

const (
    ConversionTypeLead       ConversionType = "lead"        // 线索
    ConversionTypeSignup     ConversionType = "signup"      // 注册
    ConversionTypePurchase   ConversionType = "purchase"    // 购买
    ConversionTypeSubscription ConversionType = "subscription" // 订阅
    ConversionTypeCustom     ConversionType = "custom"      // 自定义
)

// ConversionStatus 转化状态
type ConversionStatus string

const (
    ConversionStatusPending   ConversionStatus = "pending"    // 待处理
    ConversionStatusApproved  ConversionStatus = "approved"   // 已确认
    ConversionStatusRejected  ConversionStatus = "rejected"   // 已拒绝
    ConversionStatusPaid      ConversionStatus = "paid"       // 已结算
)
```

### 2.4 结算模型 (Settlement)

```go
// Settlement 结算记录
type Settlement struct {
    ID            string            `json:"id" gorm:"primaryKey"`
    ConversionID  string            `json:"conversion_id" gorm:"not null;uniqueIndex"`
    Period        string            `json:"period" gorm:"not null;index"` // YYYY-MM
    TotalAmount   float64           `json:"total_amount"`
    Currency      string            `json:"currency" gorm:"default:'USD'"`
    PlatformFee   float64           `json:"platform_fee"`    // 平台费用
    AffiliateShare float64          `json:"affiliate_share"`  // 联盟伙伴分成
    Breakdown     SettlementBreakdown `json:"breakdown" gorm:"type:jsonb"`
    Status        SettlementStatus  `json:"status" gorm:"not null;default:'pending'"`
    InvoiceURL    string            `json:"invoice_url"`
    PaidAt        *time.Time        `json:"paid_at"`
    CreatedAt     time.Time         `json:"created_at"`
    UpdatedAt     time.Time         `json:"updated_at"`
}

// SettlementBreakdown 结算明细
type SettlementBreakdown struct {
    Items []SettlementItem `json:"items"`
}

type SettlementItem struct {
    Description string  `json:"description"`
    Amount      float64 `json:"amount"`
    Percentage float64 `json:"percentage"`
}

// SettlementStatus 结算状态
type SettlementStatus string

const (
    SettlementStatusPending   SettlementStatus = "pending"    // 待结算
    SettlementStatusProcessing SettlementStatus = "processing" // 处理中
    SettlementStatusCompleted SettlementStatus = "completed"  // 已完成
    SettlementStatusFailed    SettlementStatus = "failed"     // 失败
)
```

---

## 3. 辅助数据模型

### 3.1 用户模型 (User)

```go
// User 系统用户
type User struct {
    ID        string    `json:"id" gorm:"primaryKey"`
    Email     string    `json:"email" gorm:"uniqueIndex;not null"`
    Name      string    `json:"name"`
    Password  string    `json:"-" gorm:"not null"`
    Role      UserRole  `json:"role" gorm:"not null;default:'user'"`
    Status    UserStatus `json:"status" gorm:"not null;default:'active'"`
    APIToken  string    `json:"api_token" gorm:"uniqueIndex"`
    LastLogin *time.Time `json:"last_login"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// UserRole 用户角色
type UserRole string

const (
    UserRoleAdmin     UserRole = "admin"     // 管理员
    UserRoleUser      UserRole = "user"      // 普通用户
    UserRoleAffiliate UserRole = "affiliate" // 联盟伙伴
)

// UserStatus 用户状态
type UserStatus string

const (
    UserStatusActive   UserStatus = "active"   // 活跃
    UserStatusInactive UserStatus = "inactive" // 停用
    UserStatusSuspended UserStatus = "suspended" // 暂停
)
```

### 3.2 API 密钥模型 (APIKey)

```go
// APIKey API 密钥
type APIKey struct {
    ID          string    `json:"id" gorm:"primaryKey"`
    UserID      string    `json:"user_id" gorm:"not null;index"`
    Name        string    `json:"name" gorm:"not null"`
    Key         string    `json:"key" gorm:"uniqueIndex;not null"`
    Scopes      []string  `json:"scopes" gorm:"type:text[]"`
    LastUsed    *time.Time `json:"last_used"`
    ExpiresAt   *time.Time `json:"expires_at"`
    CreatedAt   time.Time `json:"created_at"`
}
```

### 3.3 访问者模型 (Visitor)

```go
// Visitor 访问者
type Visitor struct {
    ID            string                 `json:"id" gorm:"primaryKey"`
    Fingerprint   string                 `json:"fingerprint" gorm:"uniqueIndex;not null"`
    FirstSeen     time.Time              `json:"first_seen"`
    LastSeen      time.Time              `json:"last_seen"`
    SessionCount  int                    `json:"session_count"`
    Properties    map[string]interface{} `json:"properties" gorm:"type:jsonb"`
    CustomID      string                 `json:"custom_id" gorm:"index"`
    CreatedAt     time.Time              `json:"created_at"`
    UpdatedAt     time.Time              `json:"updated_at"`

    // 关联关系
    Tracks        []Track      `json:"tracks" gorm:"foreignKey:VisitorID"`
    Conversions   []Conversion `json:"conversions" gorm:"foreignKey:VisitorID"`
}
```

---

## 4. 插件数据模型

### 4.1 SEO 内容模型 (SEOContent)

```go
// SEOContent SEO 生成的内容
type SEOContent struct {
    ID           string       `json:"id" gorm:"primaryKey"`
    ExperimentID string       `json:"experiment_id" gorm:"not null;index"`
    Title        string       `json:"title" gorm:"not null"`
    Content      string       `json:"content" gorm:"type:text"`
    Summary      string       `json:"summary"`
    Keywords     []string     `json:"keywords" gorm:"type:text[]"`
    MetaTags     MetaTags     `json:"meta_tags" gorm:"type:jsonb"`
    Status       ContentStatus `json:"status" gorm:"not null;default:'draft'"`
    PublishedAt  *time.Time   `json:"published_at"`
    URL          string       `json:"url"`
    Metrics      ContentMetrics `json:"metrics" gorm:"type:jsonb"`
    CreatedAt    time.Time    `json:"created_at"`
    UpdatedAt    time.Time    `json:"updated_at"`
}

// MetaTags 元标签
type MetaTags struct {
    Title       string   `json:"title"`
    Description string   `json:"description"`
    Keywords    string   `json:"keywords"`
    OGTitle     string   `json:"og_title"`
    OGImage     string   `json:"og_image"`
    Canonical   string   `json:"canonical"`
}

// ContentStatus 内容状态
type ContentStatus string

const (
    ContentStatusDraft     ContentStatus = "draft"     // 草稿
    ContentStatusGenerated ContentStatus = "generated" // 已生成
    ContentStatusPublished ContentStatus = "published" // 已发布
    ContentStatusArchived  ContentStatus = "archived"  // 已归档
)

// ContentMetrics 内容指标
type ContentMetrics struct {
    Views       int     `json:"views"`
    Clicks      int     `json:"clicks"`
    Conversions int     `json:"conversions"`
    Revenue     float64 `json:"revenue"`
    SERPRank    int     `json:"serp_rank"`
    Backlinks   int     `json:"backlinks"`
}
```

### 4.2 归因结果模型 (AttributionResult)

```go
// AttributionResult 归因结果
type AttributionResult struct {
    ID           string              `json:"id" gorm:"primaryKey"`
    ConversionID string              `json:"conversion_id" gorm:"not null;uniqueIndex"`
    Model        AttributionModel    `json:"model" gorm:"not null;index"`
    Winner       string              `json:"winner"` // 获胜触点 ID
    Contribution float64             `json:"contribution"`
    Path         []TouchpointSnapshot `json:"path" gorm:"type:jsonb"`
    Score        float64             `json:"score"`
    Confidence   float64             `json:"confidence"`
    CreatedAt    time.Time           `json:"created_at"`
}

// AttributionModel 归因模型
type AttributionModel string

const (
    AttributionModelLastClick   AttributionModel = "last_click"    // 最后点击
    AttributionModelFirstClick  AttributionModel = "first_click"   // 首次点击
    AttributionModelLinear      AttributionModel = "linear"        // 线性归因
    AttributionModelTimeDecay  AttributionModel = "time_decay"    // 时间衰减
    AttributionModelPositionBased AttributionModel = "position_based" // 位置归因
)

// TouchpointSnapshot 触点快照
type TouchpointSnapshot struct {
    ID        string    `json:"id"`
    Channel   string    `json:"channel"`
    Source    string    `json:"source"`
    Position  int       `json:"position"`
    TimeDelta int       `json:"time_delta"` // 距转化的时间差（秒）
}
```

---

## 5. 数据库表结构

### 5.1 表命名规范

| 模型 | 表名 | 说明 |
|------|------|------|
| Experiment | experiments | 实验表 |
| Track | tracks | 追踪事件表 |
| Touchpoint | touchpoints | 触点表 |
| Conversion | conversions | 转化表 |
| Settlement | settlements | 结算表 |
| User | users | 用户表 |
| Visitor | visitors | 访问者表 |
| APIKey | api_keys | API 密钥表 |
| SEOContent | seo_contents | SEO 内容表 |
| AttributionResult | attribution_results | 归因结果表 |

### 5.2 索引策略

```sql
-- 复合索引
CREATE INDEX idx_tracks_experiment_visitor ON tracks(experiment_id, visitor_id);
CREATE INDEX idx_tracks_experiment_timestamp ON tracks(experiment_id, timestamp DESC);
CREATE INDEX idx_conversions_experiment_status ON conversions(experiment_id, status);
CREATE INDEX idx_conversions_visitor_occurred ON conversions(visitor_id, occurred_at DESC);

-- JSONB 索引
CREATE INDEX idx_tracks_properties ON tracks USING GIN (properties);
CREATE INDEX idx_experiments_config ON experiments USING GIN (config);
```

---

## 6. 数据关系图 (ERD)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ role            │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐         ┌─────────────────┐
│  experiments    │         │  api_keys       │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ name            │         │ user_id (FK)    │
│ type            │         │ key             │
│ status          │         │ scopes          │
│ config (JSONB)  │         └─────────────────┘
│ created_by (FK) │
└─────────────────┘
        │
        │ 1:N
        ▼
┌─────────────────┐
│     tracks      │
├─────────────────┤
│ id (PK)         │
│ experiment_id   │──┐
│ visitor_id (FK) │  │
│ event_type      │  │
│ timestamp       │  │
└─────────────────┘  │
        │            │
        │ 1:N        │ 1:N
        ▼            ▼
┌─────────────────┐         ┌─────────────────┐
│  touchpoints    │         │  conversions    │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ track_id (FK)   │◄────────│ track_id (FK)   │
│ channel         │         │ amount          │
│ source          │         │ status          │
└─────────────────┘         │ attributed_to   │
                            └─────────────────┘
                                     │
                                     │ 1:1
                                     ▼
                            ┌─────────────────┐
                            │  settlements    │
┌─────────────────┐         ├─────────────────┤
│  visitors       │         │ id (PK)         │
├─────────────────┤         │ conversion_id   │
│ id (PK)         │         │ period          │
│ fingerprint    │         │ total_amount    │
│ first_seen      │         │ status          │
└─────────────────┘         └─────────────────┘
```

---

*文档创建者: 01-架构师*
*最后更新: 2026-03-03*
