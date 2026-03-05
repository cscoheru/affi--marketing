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
