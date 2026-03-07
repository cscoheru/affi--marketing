package content

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// AutomationController 内容自动化控制器
type AutomationController struct {
	db         *gorm.DB
	aiBaseURL  string
	httpClient *http.Client
}

// NewAutomationController 创建自动化控制器
func NewAutomationController(db *gorm.DB, aiBaseURL string) *AutomationController {
	return &AutomationController{
		db:        db,
		aiBaseURL: aiBaseURL,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

// RegisterRoutes 注册路由
func (c *AutomationController) RegisterRoutes(router *gin.RouterGroup) {
	auto := router.Group("/automation")
	{
		// 工作流
		auto.GET("/workflows", c.ListWorkflows)
		auto.POST("/workflows", c.CreateWorkflow)
		auto.GET("/workflows/:id", c.GetWorkflow)
		auto.PUT("/workflows/:id/stage", c.UpdateWorkflowStage)

		// AI 审核素材
		auto.POST("/materials/:id/review", c.ReviewMaterial)
		auto.POST("/materials/batch-review", c.BatchReviewMaterials)

		// AI 内容生成
		auto.POST("/generate", c.GenerateContent)
		auto.GET("/jobs/:id", c.GetGenerationJob)
		auto.GET("/jobs", c.ListGenerationJobs)
		auto.PUT("/jobs/:id/approve", c.ApproveContent)
		auto.PUT("/jobs/:id/reject", c.RejectContent)

		// AI 产品推荐
		auto.POST("/products/:id/analyze", c.AnalyzeProduct)
		auto.GET("/products/recommendations", c.GetRecommendations)
	}
}

// ============================================================
// 工作流 API
// ============================================================

// WorkflowRequest 工作流请求
type WorkflowRequest struct {
	ProductID   int    `json:"productId" binding:"required"`
	ProductASIN string `json:"productAsin"`
}

// ListWorkflows 获取工作流列表
func (c *AutomationController) ListWorkflows(ctx *gin.Context) {
	status := ctx.Query("status")

	query := c.db.Model(&content.ContentWorkflow{})
	if status != "" {
		query = query.Where("stage_status = ?", status)
	}

	var workflows []content.ContentWorkflow
	if err := query.Order("created_at DESC").Limit(50).Find(&workflows).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list workflows"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"workflows": workflows})
}

// CreateWorkflow 创建工作流
func (c *AutomationController) CreateWorkflow(ctx *gin.Context) {
	var req WorkflowRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取产品信息
	var product content.AmazonProduct
	if err := c.db.First(&product, req.ProductID).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	workflow := content.ContentWorkflow{
		ProductID:      req.ProductID,
		ProductASIN:    product.ASIN,
		CurrentStage:   "selection",
		StageStatus:    "completed",
		SelectionStatus: "completed",
		CollectionStatus: "pending",
		AIReviewStatus: "pending",
		GenerationStatus: "pending",
		UserApprovalStatus: "pending",
		PublishStatus: "pending",
	}

	if err := c.db.Create(&workflow).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow"})
		return
	}

	logger.Info("Workflow created", zap.Int("workflowId", workflow.ID), zap.Int("productId", req.ProductID))
	ctx.JSON(http.StatusCreated, workflow)
}

// GetWorkflow 获取工作流详情
func (c *AutomationController) GetWorkflow(ctx *gin.Context) {
	id := ctx.Param("id")

	var workflow content.ContentWorkflow
	if err := c.db.First(&workflow, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get workflow"})
		return
	}

	// 获取关联的素材统计
	var materialsCount int64
	c.db.Model(&content.MaterialLegacy{}).Where("asin = ?", workflow.ProductASIN).Count(&materialsCount)

	// 获取生成任务统计
	var jobsCount int64
	c.db.Model(&content.ContentGenerationJob{}).Where("product_asin = ?", workflow.ProductASIN).Count(&jobsCount)

	ctx.JSON(http.StatusOK, gin.H{
		"workflow":       workflow,
		"materialsCount": materialsCount,
		"jobsCount":      jobsCount,
	})
}

// UpdateWorkflowStageRequest 更新工作流阶段请求
type UpdateWorkflowStageRequest struct {
	Stage  string `json:"stage" binding:"required"`
	Status string `json:"status" binding:"required"`
}

// UpdateWorkflowStage 更新工作流阶段
func (c *AutomationController) UpdateWorkflowStage(ctx *gin.Context) {
	id := ctx.Param("id")

	var req UpdateWorkflowStageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var workflow content.ContentWorkflow
	if err := c.db.First(&workflow, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow not found"})
		return
	}

	updates := map[string]interface{}{
		"current_stage": req.Stage,
		"stage_status":  req.Status,
	}

	// 更新对应阶段状态
	switch req.Stage {
	case "collection":
		updates["collection_status"] = req.Status
	case "review":
		updates["ai_review_status"] = req.Status
	case "generation":
		updates["generation_status"] = req.Status
	case "approval":
		updates["user_approval_status"] = req.Status
	case "publish":
		updates["publish_status"] = req.Status
	}

	if req.Status == "completed" {
		now := time.Now()
		updates["completed_at"] = &now
	}

	if err := c.db.Model(&workflow).Updates(updates).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update workflow"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Workflow updated", "workflow": workflow})
}

// ============================================================
// AI 素材审核 API
// ============================================================

// ReviewMaterialRequest 审核素材请求
type ReviewMaterialRequest struct {
	Force bool `json:"force"` // 强制重新审核
}

// ReviewMaterial AI审核单个素材
func (c *AutomationController) ReviewMaterial(ctx *gin.Context) {
	id := ctx.Param("id")

	var material content.MaterialLegacy
	if err := c.db.First(&material, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Material not found"})
		return
	}

	// 检查是否已审核
	var existingReview content.MaterialAIReview
	if err := c.db.Where("material_id = ?", material.ID).First(&existingReview).Error; err == nil {
		ctx.JSON(http.StatusOK, gin.H{"review": existingReview, "message": "Already reviewed"})
		return
	}

	// 调用 AI 服务进行审核
	review, err := c.callAIReviewMaterial(&material)
	if err != nil {
		logger.Error("Failed to review material", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "AI review failed", "details": err.Error()})
		return
	}

	// 保存审核结果
	review.MaterialID = material.ID
	if err := c.db.Create(&review).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save review"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"review": review})
}

// BatchReviewRequest 批量审核请求
type BatchReviewRequest struct {
	MaterialIDs []int `json:"materialIds" binding:"required"`
}

// BatchReviewMaterials 批量审核素材
func (c *AutomationController) BatchReviewMaterials(ctx *gin.Context) {
	var req BatchReviewRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var materials []content.MaterialLegacy
	if err := c.db.Where("id IN ?", req.MaterialIDs).Find(&materials).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch materials"})
		return
	}

	results := make([]map[string]interface{}, 0)
	for _, material := range materials {
		// 检查是否已审核
		var existingReview content.MaterialAIReview
		if err := c.db.Where("material_id = ?", material.ID).First(&existingReview).Error; err == nil {
			results = append(results, map[string]interface{}{
				"materialId": material.ID,
				"status":     "skipped",
				"reason":     "already reviewed",
				"review":     existingReview,
			})
			continue
		}

		// 调用 AI 审核
		review, err := c.callAIReviewMaterial(&material)
		if err != nil {
			results = append(results, map[string]interface{}{
				"materialId": material.ID,
				"status":     "failed",
				"error":      err.Error(),
			})
			continue
		}

		review.MaterialID = material.ID
		if err := c.db.Create(&review).Error; err != nil {
			results = append(results, map[string]interface{}{
				"materialId": material.ID,
				"status":     "failed",
				"error":      "Failed to save review",
			})
			continue
		}

		results = append(results, map[string]interface{}{
			"materialId": material.ID,
			"status":     "success",
			"review":     review,
		})
	}

	ctx.JSON(http.StatusOK, gin.H{"results": results})
}

// ============================================================
// AI 内容生成 API
// ============================================================

// ContentGenRequest 内容生成请求
type ContentGenRequest struct {
	ProductID          int      `json:"productId" binding:"required"`
	MaterialIDs        []int    `json:"materialIds"`
	ContentType        string   `json:"contentType" binding:"required"`
	TargetPlatform     string   `json:"targetPlatform"`
	TargetKeywords     []string `json:"targetKeywords"`
	Tone               string   `json:"tone"`
	Length             string   `json:"length"`
	CustomInstructions string   `json:"customInstructions"`
}

// GenerateContent AI生成内容
func (c *AutomationController) GenerateContent(ctx *gin.Context) {
	var req ContentGenRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 获取产品信息
	var product content.AmazonProduct
	if err := c.db.First(&product, req.ProductID).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 获取素材内容
	var materials []content.MaterialLegacy
	if len(req.MaterialIDs) > 0 {
		c.db.Where("id IN ?", req.MaterialIDs).Find(&materials)
	}

	// 创建生成任务
	materialIDsJSON, _ := json.Marshal(req.MaterialIDs)
	keywordsJSON, _ := json.Marshal(req.TargetKeywords)

	job := content.ContentGenerationJob{
		ProductID:          req.ProductID,
		ProductASIN:        product.ASIN,
		MaterialIDs:        string(materialIDsJSON),
		ContentType:        req.ContentType,
		TargetPlatform:     req.TargetPlatform,
		TargetKeywords:     string(keywordsJSON),
		Tone:               req.Tone,
		Length:             req.Length,
		CustomInstructions: req.CustomInstructions,
		Status:             "pending",
	}

	if job.Tone == "" {
		job.Tone = "professional"
	}
	if job.Length == "" {
		job.Length = "medium"
	}

	if err := c.db.Create(&job).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	// 异步执行生成
	go c.executeGenerationJob(&job, &product, materials)

	logger.Info("Content generation job created", zap.Int("jobId", job.ID), zap.Int("productId", req.ProductID))
	ctx.JSON(http.StatusAccepted, gin.H{
		"jobId":   job.ID,
		"status":  "pending",
		"message": "Generation job started",
	})
}

// GetGenerationJob 获取生成任务状态
func (c *AutomationController) GetGenerationJob(ctx *gin.Context) {
	id := ctx.Param("id")

	var job content.ContentGenerationJob
	if err := c.db.First(&job, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get job"})
		return
	}

	ctx.JSON(http.StatusOK, job)
}

// ListGenerationJobs 获取生成任务列表
func (c *AutomationController) ListGenerationJobs(ctx *gin.Context) {
	status := ctx.Query("status")
	productId := ctx.Query("productId")

	query := c.db.Model(&content.ContentGenerationJob{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if productId != "" {
		query = query.Where("product_id = ?", productId)
	}

	var jobs []content.ContentGenerationJob
	if err := query.Order("created_at DESC").Limit(50).Find(&jobs).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list jobs"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"jobs": jobs})
}

// ApproveContentRequest 批准内容请求
type ApproveContentRequest struct {
	Edits string `json:"edits"` // 用户修改
}

// ApproveContent 批准内容
func (c *AutomationController) ApproveContent(ctx *gin.Context) {
	id := ctx.Param("id")

	var req ApproveContentRequest
	ctx.ShouldBindJSON(&req)

	var job content.ContentGenerationJob
	if err := c.db.First(&job, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"user_reviewed":   true,
		"review_status":   "approved",
		"reviewed_at":     &now,
		"status":          "completed",
		"completed_at":    &now,
	}

	if req.Edits != "" {
		updates["user_edits"] = req.Edits
		updates["final_content"] = req.Edits
	} else {
		updates["final_content"] = job.GeneratedContent
	}

	if err := c.db.Model(&job).Updates(updates).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve"})
		return
	}

	// TODO: 自动创建 Content 记录或提交发布任务

	ctx.JSON(http.StatusOK, gin.H{"message": "Content approved", "job": job})
}

// RejectContentRequest 拒绝内容请求
type RejectContentRequest struct {
	Reason string `json:"reason"`
}

// RejectContent 拒绝内容
func (c *AutomationController) RejectContent(ctx *gin.Context) {
	id := ctx.Param("id")

	var req RejectContentRequest
	ctx.ShouldBindJSON(&req)

	var job content.ContentGenerationJob
	if err := c.db.First(&job, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	now := time.Now()
	updates := map[string]interface{}{
		"user_reviewed": true,
		"review_status": "rejected",
		"reviewed_at":   &now,
		"status":        "failed",
		"error_msg":     req.Reason,
	}

	if err := c.db.Model(&job).Updates(updates).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Content rejected"})
}

// ============================================================
// AI 产品分析 API
// ============================================================

// AnalyzeProduct AI分析产品
func (c *AutomationController) AnalyzeProduct(ctx *gin.Context) {
	id := ctx.Param("id")

	var product content.AmazonProduct
	if err := c.db.First(&product, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// 调用 AI 服务分析产品
	analysis, err := c.callAIAnalyzeProduct(&product)
	if err != nil {
		logger.Error("Failed to analyze product", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "AI analysis failed", "details": err.Error()})
		return
	}

	// 保存分析结果
	analysis.ProductID = product.ID
	if err := c.db.Create(&analysis).Error; err != nil {
		// 尝试更新
		c.db.Model(&content.ProductAIInfo{}).Where("product_id = ?", product.ID).Updates(analysis)
	}

	ctx.JSON(http.StatusOK, gin.H{"analysis": analysis})
}

// GetRecommendations 获取AI推荐产品
func (c *AutomationController) GetRecommendations(ctx *gin.Context) {
	limit := 10

	var products []content.Product
	query := `
		SELECT p.*, pai.ai_recommend_score, pai.ai_recommend_level, pai.ai_analysis
		FROM products p
		LEFT JOIN product_ai_info pai ON p.id = pai.product_id
		WHERE p.status = 'pending'
		ORDER BY COALESCE(pai.ai_recommend_score, 0) DESC, p.potential_score DESC
		LIMIT ?
	`

	if err := c.db.Raw(query, limit).Scan(&products).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"recommendations": products})
}

// ============================================================
// AI 服务调用
// ============================================================

// callAIReviewMaterial 调用AI服务审核素材
func (c *AutomationController) callAIReviewMaterial(material *content.MaterialLegacy) (*content.MaterialAIReview, error) {
	// 构建 AI 请求
	payload := map[string]interface{}{
		"content":     material.Content,
		"source_type": material.SourceType,
		"task":        "review_material",
	}

	jsonData, _ := json.Marshal(payload)

	// 调用 AI 服务
	url := fmt.Sprintf("%s/api/v1/review-material", c.aiBaseURL)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	var result struct {
		QualityScore   float64  `json:"qualityScore"`
		ValidityScore  float64  `json:"validityScore"`
		RelevanceScore float64  `json:"relevanceScore"`
		Sentiment      string   `json:"sentiment"`
		Summary        string   `json:"summary"`
		KeyPoints      []string `json:"keyPoints"`
		ProsPoints     []string `json:"prosPoints"`
		ConsPoints     []string `json:"consPoints"`
		IsUsable       bool     `json:"isUsable"`
		ReviewReason   string   `json:"reviewReason"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	keyPointsJSON, _ := json.Marshal(result.KeyPoints)
	prosJSON, _ := json.Marshal(result.ProsPoints)
	consJSON, _ := json.Marshal(result.ConsPoints)

	return &content.MaterialAIReview{
		QualityScore:   result.QualityScore,
		ValidityScore:  result.ValidityScore,
		RelevanceScore: result.RelevanceScore,
		Sentiment:      result.Sentiment,
		Summary:        result.Summary,
		KeyPoints:      string(keyPointsJSON),
		ProsPoints:     string(prosJSON),
		ConsPoints:     string(consJSON),
		IsUsable:       result.IsUsable,
		ReviewReason:   result.ReviewReason,
	}, nil
}

// callAIAnalyzeProduct 调用AI服务分析产品
func (c *AutomationController) callAIAnalyzeProduct(product *content.AmazonProduct) (*content.ProductAIInfo, error) {
	payload := map[string]interface{}{
		"product_title":   product.Title,
		"product_asin":    product.ASIN,
		"product_price":   product.Price,
		"product_rating":  product.Rating,
		"review_count":    product.ReviewCount,
		"task":            "analyze_product",
	}

	jsonData, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/api/v1/analyze-product", c.aiBaseURL)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	var result struct {
		RecommendScore  float64  `json:"recommendScore"`
		RecommendLevel  string   `json:"recommendLevel"`
		Analysis        string   `json:"analysis"`
		ProfitPotential float64  `json:"profitPotential"`
		Competition     string   `json:"competition"`
		Trend           string   `json:"trend"`
		SellingPoints   []string `json:"sellingPoints"`
		TargetAudience  string   `json:"targetAudience"`
		ContentAngles   []string `json:"contentAngles"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	sellingPointsJSON, _ := json.Marshal(result.SellingPoints)
	anglesJSON, _ := json.Marshal(result.ContentAngles)

	return &content.ProductAIInfo{
		AIRecommendScore: result.RecommendScore,
		AIRecommendLevel: result.RecommendLevel,
		AIAnalysis:       result.Analysis,
		ProfitPotential:  result.ProfitPotential,
		CompetitionLevel: result.Competition,
		MarketTrend:      result.Trend,
		KeySellingPoints: string(sellingPointsJSON),
		TargetAudience:   result.TargetAudience,
		ContentAngles:    string(anglesJSON),
	}, nil
}

// executeGenerationJob 执行内容生成任务
func (c *AutomationController) executeGenerationJob(job *content.ContentGenerationJob, product *content.AmazonProduct, materials []content.MaterialLegacy) {
	// 更新状态为处理中
	now := time.Now()
	c.db.Model(job).Updates(map[string]interface{}{
		"status":     "processing",
		"started_at": &now,
	})

	// 构建素材内容
	var materialsContent string
	for _, m := range materials {
		materialsContent += fmt.Sprintf("\n---\n来源: %s\n内容: %s\n", m.SourceType, m.Content)
	}

	// 调用 AI 服务生成内容
	payload := map[string]interface{}{
		"product_title":      product.Title,
		"product_asin":       product.ASIN,
		"product_price":      product.Price,
		"materials_content":  materialsContent,
		"content_type":       job.ContentType,
		"target_platform":    job.TargetPlatform,
		"target_keywords":    job.TargetKeywords,
		"tone":               job.Tone,
		"length":             job.Length,
		"custom_instructions": job.CustomInstructions,
		"task":               "generate_content",
	}

	jsonData, _ := json.Marshal(payload)

	url := fmt.Sprintf("%s/api/v1/generate-content", c.aiBaseURL)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.db.Model(job).Updates(map[string]interface{}{
			"status":    "failed",
			"error_msg": err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.db.Model(job).Updates(map[string]interface{}{
			"status":    "failed",
			"error_msg": fmt.Sprintf("AI service returned status %d", resp.StatusCode),
		})
		return
	}

	var result struct {
		Title    string `json:"title"`
		Content  string `json:"content"`
		Slug     string `json:"slug"`
		Excerpt  string `json:"excerpt"`
		SEOMeta  string `json:"seoMeta"`
		Model    string `json:"model"`
		Tokens   int    `json:"tokens"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		c.db.Model(job).Updates(map[string]interface{}{
			"status":    "failed",
			"error_msg": "Failed to parse AI response",
		})
		return
	}

	// 更新生成结果
	completedAt := time.Now()
	c.db.Model(job).Updates(map[string]interface{}{
		"status":            "completed",
		"generated_title":   result.Title,
		"generated_content": result.Content,
		"generated_slug":    result.Slug,
		"generated_excerpt": result.Excerpt,
		"seo_metadata":      result.SEOMeta,
		"ai_model":          result.Model,
		"tokens_used":       result.Tokens,
		"completed_at":      &completedAt,
	})

	logger.Info("Content generation completed",
		zap.Int("jobId", job.ID),
		zap.String("title", result.Title),
		zap.Int("tokens", result.Tokens))
}
