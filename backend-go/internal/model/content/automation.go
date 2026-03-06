package content

import "time"

// ============================================================
// AI 相关扩展模型
// ============================================================

// ProductAIInfo 产品 AI 分析信息（扩展 Product）
type ProductAIInfo struct {
	ID               int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID        int       `json:"productId" gorm:"uniqueIndex;not null"`
	AIRecommendScore float64   `json:"aiRecommendScore" gorm:"type:decimal(5,2)"`        // AI推荐评分 0-100
	AIRecommendLevel string    `json:"aiRecommendLevel" gorm:"size:20"`                   // high/medium/low
	AIAnalysis       string    `json:"aiAnalysis" gorm:"type:text"`                       // AI分析详情
	ProfitPotential  float64   `json:"profitPotential" gorm:"type:decimal(5,2)"`          // 利润潜力评分
	CompetitionLevel string    `json:"competitionLevel" gorm:"size:20"`                   // high/medium/low
	MarketTrend      string    `json:"marketTrend" gorm:"size:20"`                        // rising/stable/declining
	KeySellingPoints string    `json:"keySellingPoints" gorm:"type:text"`                 // 关键卖点 JSON
	TargetAudience   string    `json:"targetAudience" gorm:"type:text"`                   // 目标受众
	ContentAngles    string    `json:"contentAngles" gorm:"type:text"`                    // 内容角度 JSON
	AnalyzedAt       time.Time `json:"analyzedAt" gorm:"autoCreateTime"`
	UpdatedAt        time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ProductAIInfo) TableName() string {
	return "product_ai_info"
}

// MaterialAIReview 素材 AI 审核结果（扩展 Material）
type MaterialAIReview struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	MaterialID     int       `json:"materialId" gorm:"uniqueIndex;not null"`
	QualityScore   float64   `json:"qualityScore" gorm:"type:decimal(5,2)"`      // 质量评分 0-100
	ValidityScore  float64   `json:"validityScore" gorm:"type:decimal(5,2)"`     // 有效性评分
	RelevanceScore float64   `json:"relevanceScore" gorm:"type:decimal(5,2)"`    // 相关性评分
	Sentiment      string    `json:"sentiment" gorm:"size:20"`                   // positive/neutral/negative
	Summary        string    `json:"summary" gorm:"type:text"`                   // AI摘要
	KeyPoints      string    `json:"keyPoints" gorm:"type:text"`                 // 关键点 JSON
	ProsPoints     string    `json:"prosPoints" gorm:"type:text"`                // 优点 JSON
	ConsPoints     string    `json:"consPoints" gorm:"type:text"`                // 缺点 JSON
	UsageScenarios string    `json:"usageScenarios" gorm:"type:text"`            // 使用场景 JSON
	IsUsable       bool      `json:"isUsable" gorm:"default:true"`               // 是否可用于创作
	ReviewReason   string    `json:"reviewReason" gorm:"type:text"`              // 审核理由
	ReviewedAt     time.Time `json:"reviewedAt" gorm:"autoCreateTime"`
}

// TableName 指定表名
func (MaterialAIReview) TableName() string {
	return "material_ai_reviews"
}

// ContentGenerationJob 内容生成任务（增强版）
type ContentGenerationJob struct {
	ID                 int        `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID          int        `json:"productId" gorm:"index;not null"`
	ProductASIN        string     `json:"productAsin" gorm:"size:20;index"`
	MaterialIDs        string     `json:"materialIds" gorm:"type:jsonb"`              // 使用的素材ID列表
	ContentType        string     `json:"contentType" gorm:"size:50;not null"`        // review/guide/comparison/science
	TargetPlatform     string     `json:"targetPlatform" gorm:"size:50"`              // blogger/medium/social
	TargetKeywords     string     `json:"targetKeywords" gorm:"type:jsonb"`           // 目标关键词
	Tone               string     `json:"tone" gorm:"size:50;default:professional"`   // professional/casual/technical
	Length             string     `json:"length" gorm:"size:20;default:medium"`       // short/medium/long
	CustomInstructions string     `json:"customInstructions" gorm:"type:text"`        // 自定义指令
	// 生成结果
	GeneratedTitle   string     `json:"generatedTitle" gorm:"size:500"`
	GeneratedContent string     `json:"generatedContent" gorm:"type:text"`
	GeneratedSlug    string     `json:"generatedSlug" gorm:"size:500"`
	GeneratedExcerpt string     `json:"generatedExcerpt" gorm:"type:text"`
	SEOMetadata      string     `json:"seoMetadata" gorm:"type:jsonb"`           // SEO元数据
	// AI 处理信息
	Status     string `json:"status" gorm:"size:50;default:pending;index"` // pending/processing/completed/failed
	AIModel    string `json:"aiModel" gorm:"size:50"`                      // 使用的模型
	TokensUsed int    `json:"tokensUsed" gorm:"default:0"`
	ErrorMsg   string `json:"errorMsg" gorm:"type:text"`
	// 用户审核
	UserReviewed   bool       `json:"userReviewed" gorm:"default:false"`
	UserEdits      string     `json:"userEdits" gorm:"type:text"`      // 用户修改
	FinalContent   string     `json:"finalContent" gorm:"type:text"`   // 最终内容
	ReviewStatus   string     `json:"reviewStatus" gorm:"size:20"`     // pending/approved/rejected
	ReviewedBy     int        `json:"reviewedBy" gorm:"default:0"`
	ReviewedAt     *time.Time `json:"reviewedAt"`
	// 关联内容
	ContentID *int `json:"contentId" gorm:"index"` // 生成的正式内容ID
	// 时间戳
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	StartedAt   *time.Time `json:"startedAt"`
	CompletedAt *time.Time `json:"completedAt"`
}

// TableName 指定表名
func (ContentGenerationJob) TableName() string {
	return "content_generation_jobs"
}

// ContentGenerationTemplate 内容生成模板
type ContentGenerationTemplate struct {
	ID          int       `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"size:200;not null"`
	Type        string    `json:"type" gorm:"size:50;not null"`          // review/guide/comparison
	Platform    string    `json:"platform" gorm:"size:50"`               // blogger/medium/social/all
	Prompt      string    `json:"prompt" gorm:"type:text;not null"`      // 提示词模板
	Variables   string    `json:"variables" gorm:"type:jsonb"`           // 变量定义
	Examples    string    `json:"examples" gorm:"type:jsonb"`            // 示例
	IsDefault   bool      `json:"isDefault" gorm:"default:false"`
	IsActive    bool      `json:"isActive" gorm:"default:true"`
	CreatedAt   time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ContentGenerationTemplate) TableName() string {
	return "content_generation_templates"
}

// ============================================================
// 工作流状态模型
// ============================================================

// ContentWorkflow 内容工作流状态
type ContentWorkflow struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	ProductID      int       `json:"productId" gorm:"index;not null"`
	ProductASIN    string    `json:"productAsin" gorm:"size:20;index"`
	CurrentStage   string    `json:"currentStage" gorm:"size:50;not null"`     // selection/collection/review/generation/approval/publish
	StageStatus    string    `json:"stageStatus" gorm:"size:50"`               // pending/in_progress/completed/failed
	// 各阶段状态
	SelectionStatus    string `json:"selectionStatus" gorm:"size:50;default:pending"`
	CollectionStatus   string `json:"collectionStatus" gorm:"size:50;default:pending"`
	AIReviewStatus     string `json:"aiReviewStatus" gorm:"size:50;default:pending"`
	GenerationStatus   string `json:"generationStatus" gorm:"size:50;default:pending"`
	UserApprovalStatus string `json:"userApprovalStatus" gorm:"size:50;default:pending"`
	PublishStatus      string `json:"publishStatus" gorm:"size:50;default:pending"`
	// 统计
	MaterialsCollected int `json:"materialsCollected" gorm:"default:0"`
	MaterialsReviewed  int `json:"materialsReviewed" gorm:"default:0"`
	MaterialsUsable    int `json:"materialsUsable" gorm:"default:0"`
	ContentsGenerated  int `json:"contentsGenerated" gorm:"default:0"`
	ContentsApproved   int `json:"contentsApproved" gorm:"default:0"`
	ContentsPublished  int `json:"contentsPublished" gorm:"default:0"`
	// 时间戳
	StartedAt   *time.Time `json:"startedAt"`
	CompletedAt *time.Time `json:"completedAt"`
	CreatedAt   time.Time  `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt   time.Time  `json:"updatedAt" gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (ContentWorkflow) TableName() string {
	return "content_workflows"
}
