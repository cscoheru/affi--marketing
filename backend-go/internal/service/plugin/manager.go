package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"go.uber.org/zap"

	"github.com/zenconsult/affi-marketing/internal/plugin"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// PluginManager 插件管理器
type PluginManager struct {
	plugins   map[string]plugin.Plugin
	configs   map[string]plugin.PluginConfig
	registry  PluginRegistry
	executor  PluginExecutor
	eventBus  plugin.EventBus
	logger    *zap.Logger
	mu        sync.RWMutex
}

// PluginRegistry 插件注册表接口
type PluginRegistry interface {
	Register(p plugin.Plugin) error
	Unregister(id string) error
	Get(id string) (plugin.Plugin, error)
	List() []plugin.Plugin
	ListByType(pluginType plugin.PluginType) []plugin.Plugin
}

// PluginExecutor 插件执行器接口
type PluginExecutor interface {
	Execute(ctx context.Context, pluginID string, input plugin.PluginInput) (plugin.PluginOutput, error)
	ExecuteAsync(ctx context.Context, pluginID string, input plugin.PluginInput) <-chan plugin.PluginOutput
	ExecuteChain(ctx context.Context, chain []string, input plugin.PluginInput) (plugin.PluginOutput, error)
}

// NewPluginManager 创建插件管理器
func NewPluginManager() *PluginManager {
	return &PluginManager{
		plugins:  make(map[string]plugin.Plugin),
		configs:  make(map[string]plugin.PluginConfig),
		eventBus: plugin.NewMemoryEventBus(),
		logger:   logger.L(),
	}
}

// Register 注册插件
func (pm *PluginManager) Register(p plugin.Plugin) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	info := p.Info()

	// 验证插件信息
	if err := pm.validatePlugin(info); err != nil {
		return fmt.Errorf("plugin validation failed: %w", err)
	}

	// 检查依赖
	for _, dep := range info.Dependencies {
		if _, exists := pm.plugins[dep]; !exists {
			return fmt.Errorf("dependency not found: %s", dep)
		}
	}

	// 注册插件
	pm.plugins[info.ID] = p
	pm.logger.Info("plugin registered",
		zap.String("id", info.ID),
		zap.String("name", info.Name),
		zap.String("version", info.Version),
		zap.String("type", string(info.Type)))

	return nil
}

// Unregister 注销插件
func (pm *PluginManager) Unregister(id string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.plugins[id]; !exists {
		return fmt.Errorf("plugin not found: %s", id)
	}

	// 关闭插件
	if err := pm.plugins[id].Shutdown(); err != nil {
		pm.logger.Error("failed to shutdown plugin",
			zap.String("id", id),
			zap.Error(err))
	}

	delete(pm.plugins, id)
	delete(pm.configs, id)

	pm.logger.Info("plugin unregistered", zap.String("id", id))
	return nil
}

// Get 获取插件
func (pm *PluginManager) Get(id string) (plugin.Plugin, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	p, exists := pm.plugins[id]
	if !exists {
		return nil, fmt.Errorf("plugin not found: %s", id)
	}
	return p, nil
}

// List 列出所有插件
func (pm *PluginManager) List() []plugin.Plugin {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	plugins := make([]plugin.Plugin, 0, len(pm.plugins))
	for _, p := range pm.plugins {
		plugins = append(plugins, p)
	}
	return plugins
}

// ListByType 按类型列出插件
func (pm *PluginManager) ListByType(pluginType plugin.PluginType) []plugin.Plugin {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	var plugins []plugin.Plugin
	for _, p := range pm.plugins {
		if p.Info().Type == pluginType {
			plugins = append(plugins, p)
		}
	}
	return plugins
}

// Execute 执行插件
func (pm *PluginManager) Execute(ctx context.Context, pluginID string, input plugin.PluginInput) (plugin.PluginOutput, error) {
	p, err := pm.Get(pluginID)
	if err != nil {
		return plugin.PluginOutput{}, err
	}

	// 检查是否启用
	if base, ok := p.(*plugin.BasePlugin); ok && !base.IsEnabled() {
		return plugin.PluginOutput{
			Success: false,
			Error:   "plugin is disabled",
		}, nil
	}

	startTime := time.Now()

	// 执行插件
	output, err := p.Execute(ctx, input)

	// 记录指标
	output.Metrics.Duration = time.Since(startTime)

	if err != nil {
		pm.logger.Error("plugin execution failed",
			zap.String("plugin_id", pluginID),
			zap.Error(err))
	}

	return output, err
}

// ExecuteAsync 异步执行插件
func (pm *PluginManager) ExecuteAsync(ctx context.Context, pluginID string, input plugin.PluginInput) <-chan plugin.PluginOutput {
	ch := make(chan plugin.PluginOutput, 1)

	go func() {
		defer close(ch)
		output, err := pm.Execute(ctx, pluginID, input)
		if err != nil {
			output.Error = err.Error()
			output.Success = false
		}
		ch <- output
	}()

	return ch
}

// ExecuteChain 执行插件链
func (pm *PluginManager) ExecuteChain(ctx context.Context, chain []string, input plugin.PluginInput) (plugin.PluginOutput, error) {
	var output plugin.PluginOutput
	var err error

	currentInput := input
	for _, pluginID := range chain {
		output, err = pm.Execute(ctx, pluginID, currentInput)
		if err != nil || !output.Success {
			return plugin.PluginOutput{
				Success: false,
				Error:   fmt.Sprintf("plugin %s failed: %s", pluginID, output.Error),
			}, err
		}

		// 将当前输出作为下一个插件的输入
		currentInput = plugin.PluginInput{
			Type:    "chain",
			Data:    output.Data,
			Context: currentInput.Context,
		}
	}

	return output, nil
}

// SetConfig 设置插件配置
func (pm *PluginManager) SetConfig(pluginID string, config plugin.PluginConfig) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if _, exists := pm.plugins[pluginID]; !exists {
		return fmt.Errorf("plugin not found: %s", pluginID)
	}

	pm.configs[pluginID] = config
	return nil
}

// GetConfig 获取插件配置
func (pm *PluginManager) GetConfig(pluginID string) (plugin.PluginConfig, error) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	config, exists := pm.configs[pluginID]
	if !exists {
		return plugin.PluginConfig{}, fmt.Errorf("config not found: %s", pluginID)
	}
	return config, nil
}

// GetEventBus 获取事件总线
func (pm *PluginManager) GetEventBus() plugin.EventBus {
	return pm.eventBus
}

// validatePlugin 验证插件信息
func (pm *PluginManager) validatePlugin(info plugin.PluginInfo) error {
	if info.ID == "" {
		return fmt.Errorf("plugin ID is required")
	}
	if info.Name == "" {
		return fmt.Errorf("plugin name is required")
	}
	if info.Type == "" {
		return fmt.Errorf("plugin type is required")
	}

	// 验证插件类型
	validTypes := map[plugin.PluginType]bool{
		plugin.PluginTypeSEO:         true,
		plugin.PluginTypeAttribution: true,
		plugin.PluginTypeSettlement:   true,
		plugin.PluginTypeTracking:     true,
		plugin.PluginTypeAI:           true,
	}

	if !validTypes[info.Type] {
		return fmt.Errorf("invalid plugin type: %s", info.Type)
	}

	return nil
}

// Shutdown 关闭所有插件
func (pm *PluginManager) Shutdown() error {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	var errs []string
	for id, p := range pm.plugins {
		if err := p.Shutdown(); err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", id, err))
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("shutdown errors: %s", strings.Join(errs, "; "))
	}

	return nil
}
