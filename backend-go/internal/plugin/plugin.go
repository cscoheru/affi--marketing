package plugin

import (
	"context"
	"time"
)

// Plugin 插件基础接口
type Plugin interface {
	// Init 初始化插件
	Init(config PluginConfig) error

	// Execute 执行插件逻辑
	Execute(ctx context.Context, input PluginInput) (PluginOutput, error)

	// Shutdown 清理资源
	Shutdown() error

	// Info 获取插件信息
	Info() PluginInfo
}

// PluginInfo 插件元信息
type PluginInfo struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Description  string            `json:"description"`
	Author       string            `json:"author"`
	Type         PluginType        `json:"type"`
	Dependencies []string          `json:"dependencies"`
	Config       PluginConfigSchema `json:"config"`
}

// PluginType 插件类型
type PluginType string

const (
	PluginTypeSEO         PluginType = "seo"           // SEO 插件
	PluginTypeAttribution PluginType = "attribution"  // 归因插件
	PluginTypeSettlement   PluginType = "settlement"   // 结算插件
	PluginTypeTracking     PluginType = "tracking"     // 追踪插件
	PluginTypeAI           PluginType = "ai"           // AI 插件
)

// PluginConfig 插件配置
type PluginConfig struct {
	Enabled    bool                   `json:"enabled"`
	Priority   int                    `json:"priority"`
	Timeout    time.Duration          `json:"timeout"`
	Parameters map[string]interface{} `json:"parameters"`
	Secrets    map[string]string      `json:"secrets"`
}

// PluginConfigSchema 配置 Schema
type PluginConfigSchema struct {
	Properties map[string]PropertySchema `json:"properties"`
	Required   []string                  `json:"required"`
}

// PropertySchema 属性 Schema
type PropertySchema struct {
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Default     interface{} `json:"default,omitempty"`
	Enum        []string    `json:"enum,omitempty"`
}

// PluginInput 插件输入
type PluginInput struct {
	Type      string                 `json:"type"`
	Data      map[string]interface{} `json:"data"`
	Context   map[string]interface{} `json:"context"`
	Timestamp int64                  `json:"timestamp"`
}

// PluginOutput 插件输出
type PluginOutput struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data"`
	Error   string                 `json:"error,omitempty"`
	Metrics ExecutionMetrics       `json:"metrics"`
}

// ExecutionMetrics 执行指标
type ExecutionMetrics struct {
	Duration        time.Duration `json:"duration"`
	MemoryUsed      int64         `json:"memory_used"`
	RecordsProcessed int          `json:"records_processed"`
}

// Lifecycle 生命周期钩子
type Lifecycle interface {
	// BeforeExecute 执行前钩子
	BeforeExecute(ctx context.Context, input PluginInput) error

	// AfterExecute 执行后钩子
	AfterExecute(ctx context.Context, output PluginOutput) error

	// OnError 错误处理
	OnError(ctx context.Context, err error)
}

// BasePlugin 基础插件实现
type BasePlugin struct {
	config PluginConfig
	info   PluginInfo
}

// Init 初始化
func (b *BasePlugin) Init(config PluginConfig) error {
	b.config = config
	return nil
}

// Shutdown 清理
func (b *BasePlugin) Shutdown() error {
	return nil
}

// GetConfig 获取配置
func (b *BasePlugin) GetConfig() PluginConfig {
	return b.config
}

// SetConfig 设置配置
func (b *BasePlugin) SetConfig(config PluginConfig) {
	b.config = config
}

// IsEnabled 检查是否启用
func (b *BasePlugin) IsEnabled() bool {
	return b.config.Enabled
}
