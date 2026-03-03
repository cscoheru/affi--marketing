package programmatic_seo

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"go.uber.org/zap"

	"github.com/zenconsult/affi-marketing/internal/config"
	"github.com/zenconsult/affi-marketing/internal/model/programmatic_seo"
	"github.com/zenconsult/affi-marketing/internal/plugin"
	"github.com/zenconsult/affi-marketing/pkg/cache"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

const (
	PluginID   = "programmatic-seo"
	PluginName = "Programmatic SEO"
	PluginType = plugin.PluginTypeSEO
)

// SEOPlugin SEO 插件
type SEOPlugin struct {
	plugin.BasePlugin
	config      config.Config
	aiService   string
	cache       *cache.Cache
	httpClient  *http.Client
	eventBus    plugin.EventBus
}

// NewSEOPlugin 创建 SEO 插件
func NewSEOPlugin(cfg config.Config) *SEOPlugin {
	return &SEOPlugin{
		config:     cfg,
		aiService:  cfg.AIService.URL,
		cache:      cache.NewCache(),
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// Init 初始化插件
func (p *SEOPlugin) Init(config plugin.PluginConfig) error {
	if err := p.BasePlugin.Init(config); err != nil {
		return err
	}

	logger.L().Info("SEO Plugin initialized",
		zap.String("plugin_id", PluginID),
		zap.Bool("enabled", config.Enabled))

	return nil
}

// Execute 执行插件
func (p *SEOPlugin) Execute(ctx context.Context, input plugin.PluginInput) (plugin.PluginOutput, error) {
	startTime := time.Now()

	switch input.Type {
	case "generate_content":
		return p.generateContent(ctx, input)
	case "optimize_keywords":
		return p.optimizeKeywords(ctx, input)
	case "inject_affiliate_links":
		return p.injectAffiliateLinks(ctx, input)
	default:
		return plugin.PluginOutput{
			Success: false,
			Error:   fmt.Sprintf("unknown input type: %s", input.Type),
		}, nil
	}
}

// generateContent 生成内容
func (p *SEOPlugin) generateContent(ctx context.Context, input plugin.PluginInput) (plugin.PluginOutput, error) {
	keywords, ok := input.Data["keywords"].([]string)
	if !ok || len(keywords) == 0 {
		return plugin.PluginOutput{
			Success: false,
			Error:   "keywords are required",
		}, nil
	}

	style := "professional"
	if s, ok := input.Data["style"].(string); ok {
		style = s
	}

	// 调用 AI 服务生成内容
	content, err := p.callAIService(ctx, keywords, style)
	if err != nil {
		logger.L().Error("Failed to call AI service",
			zap.Error(err),
			zap.Strings("keywords", keywords))
		return plugin.PluginOutput{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	// 发布事件
	p.eventBus.Publish(plugin.Event{
		Type:   "content.generated",
		Source: PluginID,
		Data: map[string]interface{}{
			"keywords": keywords,
			"style":    style,
			"content":  content,
		},
		Timestamp: time.Now().Unix(),
	})

	return plugin.PluginOutput{
		Success: true,
		Data: map[string]interface{}{
			"content":    content,
			"word_count": len(content),
			"keywords":   keywords,
		},
		Metrics: plugin.ExecutionMetrics{
			Duration: time.Since(startTime),
		},
	}, nil
}

// optimizeKeywords 优化关键词
func (p *SEOPlugin) optimizeKeywords(ctx context.Context, input plugin.PluginInput) (plugin.PluginOutput, error) {
	keywords, ok := input.Data["keywords"].([]string)
	if !ok {
		return plugin.PluginOutput{
			Success: false,
			Error:   "keywords are required",
		}, nil
	}

	// TODO: 实现关键词优化逻辑
	results := make(map[string]interface{})
	for _, keyword := range keywords {
		results[keyword] = map[string]interface{}{
			"search_volume": 1000,
			"competition":   "medium",
			"cpc":          1.5,
		}
	}

	return plugin.PluginOutput{
		Success: true,
		Data: map[string]interface{}{
			"keywords": results,
		},
		Metrics: plugin.ExecutionMetrics{
			Duration: time.Since(startTime),
		},
	}, nil
}

// injectAffiliateLinks 注入联盟链接
func (p *SEOPlugin) injectAffiliateLinks(ctx context.Context, input plugin.PluginInput) (plugin.PluginOutput, error) {
	content, ok := input.Data["content"].(string)
	if !ok {
		return plugin.PluginOutput{
			Success: false,
			Error:   "content is required",
		}, nil
	}

	networks, ok := input.Data["networks"].([]string)
	if !ok {
		networks = []string{"amazon", "shareasale"}
	}

	// TODO: 实现联盟链接注入逻辑
	logger.L().Info("Injecting affiliate links",
		zap.Int("content_length", len(content)),
		zap.Strings("networks", networks))

	return plugin.PluginOutput{
		Success: true,
		Data: map[string]interface{}{
			"injected_count": 0,
		},
		Metrics: plugin.ExecutionMetrics{
			Duration: time.Since(startTime),
		},
	}, nil
}

// callAIService 调用 AI 服务
func (p *SEOPlugin) callAIService(ctx context.Context, keywords []string, style string) (string, error) {
	// 构建请求
	reqBody := map[string]interface{}{
		"keywords": keywords,
		"style":    style,
		"length":   2000,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	// 发送请求
	req, err := http.NewRequestWithContext(ctx, "POST", p.aiService+"/generate", jsonBytes.NewReader(jsonBody))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("AI service returned status %d", resp.StatusCode)
	}

	// 解析响应
	var result struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.Content, nil
}

// Info 获取插件信息
func (p *SEOPlugin) Info() plugin.PluginInfo {
	return plugin.PluginInfo{
		ID:          PluginID,
		Name:        PluginName,
		Version:     "1.0.0",
		Description: "Programmatic SEO plugin for content generation and affiliate link injection",
		Author:      "Zen Consulting",
		Type:        PluginType,
		Dependencies: []string{},
		Config: plugin.PluginConfigSchema{
			Properties: map[string]plugin.PropertySchema{
				"model": {
					Type:        "string",
					Description: "AI model to use for content generation",
					Default:     "gpt-4",
				},
				"max_tokens": {
					Type:        "integer",
					Description: "Maximum tokens to generate",
					Default:     2000,
				},
				"temperature": {
					Type:        "number",
					Description: "Temperature for generation",
					Default:     0.7,
				},
			},
			Required: []string{},
		},
	}
}

// Shutdown 清理资源
func (p *SEOPlugin) Shutdown() error {
	logger.L().Info("SEO Plugin shutting down", zap.String("plugin_id", PluginID))
	return p.BasePlugin.Shutdown()
}
