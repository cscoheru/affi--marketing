# 插件系统设计文档

## 文档信息

| 字段 | 值 |
|------|-----|
| **文档版本** | v1.0 |
| **创建日期** | 2026-03-03 |
| **创建角色** | 01-架构师 |
| **项目阶段** | 架构设计 |

---

## 1. 插件系统概述

### 1.1 设计目标

| 目标 | 描述 |
|------|------|
| **可扩展性** | 轻松添加新功能模块，无需修改核心代码 |
| **隔离性** | 插件间相互独立，互不影响 |
| **热插拔** | 支持运行时启用/禁用插件 |
| **标准化** | 统一的接口和通信协议 |
| **可测试** | 插件可独立测试和验证 |

### 1.2 插件类型

| 类型 | 标识 | 描述 |
|------|------|------|
| **SEO 插件** | `seo` | 内容生成、关键词优化 |
| **归因插件** | `attribution` | 转化归因、路径分析 |
| **结算插件** | `settlement` | 收益计算、账单生成 |
| **追踪插件** | `tracking` | 事件追踪、数据收集 |
| **AI 插件** | `ai` | AI 模型集成、智能推荐 |

---

## 2. 插件接口定义

### 2.1 核心接口

```go
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
    ID          string            `json:"id"`
    Name        string            `json:"name"`
    Version     string            `json:"version"`
    Description string            `json:"description"`
    Author      string            `json:"author"`
    Type        PluginType        `json:"type"`
    Dependencies []string         `json:"dependencies"`
    Config      PluginConfigSchema `json:"config"`
}

// PluginConfig 插件配置
type PluginConfig struct {
    Enabled    bool                   `json:"enabled"`
    Parameters map[string]interface{} `json:"parameters"`
    Secrets    map[string]string      `json:"secrets"`
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
    Duration      time.Duration `json:"duration"`
    MemoryUsed    int64        `json:"memory_used"`
    RecordsProcessed int       `json:"records_processed"`
}
```

### 2.2 插件生命周期

```go
// Lifecycle 生命周期管理
type Lifecycle interface {
    // BeforeExecute 执行前钩子
    BeforeExecute(ctx context.Context, input PluginInput) error

    // AfterExecute 执行后钩子
    AfterExecute(ctx context.Context, output PluginOutput) error

    // OnError 错误处理
    OnError(ctx context.Context, err error)
}
```

---

## 3. 插件管理器

### 3.1 管理器接口

```go
// PluginManager 插件管理器
type PluginManager struct {
    plugins     map[string]Plugin
    configs     map[string]PluginConfig
    registry   PluginRegistry
    executor   PluginExecutor
    logger     *zap.Logger
}

// PluginRegistry 插件注册表
type PluginRegistry interface {
    Register(plugin Plugin) error
    Unregister(id string) error
    Get(id string) (Plugin, error)
    List() []Plugin
    ListByType(pluginType PluginType) []Plugin
}

// PluginExecutor 插件执行器
type PluginExecutor interface {
    Execute(ctx context.Context, pluginID string, input PluginInput) (PluginOutput, error)
    ExecuteAsync(ctx context.Context, pluginID string, input PluginInput) <-chan PluginOutput
    ExecuteChain(ctx context.Context, chain []string, input PluginInput) (PluginOutput, error)
}
```

### 3.2 插件注册

```go
// RegisterPlugin 注册插件
func (pm *PluginManager) RegisterPlugin(plugin Plugin) error {
    info := plugin.Info()

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
    pm.plugins[info.ID] = plugin
    pm.logger.Info("plugin registered",
        zap.String("id", info.ID),
        zap.String("name", info.Name),
        zap.String("version", info.Version))

    return nil
}
```

---

## 4. 插件配置 Schema

### 4.1 配置结构

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "enabled": {
      "type": "boolean",
      "description": "是否启用插件"
    },
    "priority": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "description": "执行优先级"
    },
    "timeout": {
      "type": "integer",
      "minimum": 1,
      "description": "超时时间（秒）"
    },
    "retry": {
      "type": "object",
      "properties": {
        "max_attempts": {"type": "integer"},
        "backoff_ms": {"type": "integer"}
      }
    },
    "parameters": {
      "type": "object",
      "description": "插件特定参数"
    }
  },
  "required": ["enabled"]
}
```

### 4.2 插件配置示例

```json
{
  "id": "seo-content-generator",
  "type": "seo",
  "enabled": true,
  "priority": 10,
  "timeout": 30,
  "parameters": {
    "model": "gpt-4",
    "max_tokens": 2000,
    "temperature": 0.7,
    "target_keywords": ["电商", "联盟营销"],
    "content_style": "professional"
  },
  "secrets": {
    "openai_api_key": "${OPENAI_API_KEY}"
  }
}
```

---

## 5. 内置插件

### 5.1 SEO 插件

```go
type SEOPlugin struct {
    config PluginConfig
    aiClient *AIClient
}

func (p *SEOPlugin) Execute(ctx context.Context, input PluginInput) (PluginOutput, error) {
    switch input.Type {
    case "generate_content":
        return p.generateContent(ctx, input)
    case "optimize_keywords":
        return p.optimizeKeywords(ctx, input)
    case "generate_meta":
        return p.generateMeta(ctx, input)
    default:
        return PluginOutput{Success: false, Error: "unknown input type"}, nil
    }
}

func (p *SEOPlugin) generateContent(ctx context.Context, input PluginInput) (PluginOutput, error) {
    // 从输入获取参数
    keywords := input.Data["keywords"].([]string)
    style := input.Data["style"].(string)

    // 调用 AI 服务生成内容
    content, err := p.aiClient.GenerateContent(ctx, ContentRequest{
        Keywords: keywords,
        Style:    style,
        Length:   2000,
    })
    if err != nil {
        return PluginOutput{Success: false, Error: err.Error()}, nil
    }

    return PluginOutput{
        Success: true,
        Data: map[string]interface{}{
            "content":   content,
            "word_count": len(strings.Split(content, " ")),
        },
    }, nil
}
```

### 5.2 归因插件

```go
type AttributionPlugin struct {
    config PluginConfig
    store  EventStore
}

func (p *AttributionPlugin) Execute(ctx context.Context, input PluginInput) (PluginOutput, error) {
    // 获取转化事件
    conversionID := input.Data["conversion_id"].(string)

    // 获取用户路径
    events, err := p.store.GetUserPath(ctx, conversionID)
    if err != nil {
        return PluginOutput{Success: false, Error: err.Error()}, nil
    }

    // 计算归因
    attribution := p.calculateAttribution(events)

    return PluginOutput{
        Success: true,
        Data: map[string]interface{}{
            "attribution": attribution,
            "path_length": len(events),
        },
    }, nil
}

func (p *AttributionPlugin) calculateAttribution(events []Event) AttributionResult {
    // 使用最后点击归因模型
    lastClick := events[len(events)-1]
    return AttributionResult{
        Model:       "last_click",
        Winner:      lastClick.Source,
        Contribution: 1.0,
        Path:        events,
    }
}
```

### 5.3 结算插件

```go
type SettlementPlugin struct {
    config PluginConfig
    db     *gorm.DB
}

func (p *SettlementPlugin) Execute(ctx context.Context, input PluginInput) (PluginOutput, error) {
    period := input.Data["period"].(string)

    // 获取期间内的转化数据
    conversions, err := p.getConversions(ctx, period)
    if err != nil {
        return PluginOutput{Success: false, Error: err.Error()}, nil
    }

    // 计算结算
    settlement := p.calculateSettlement(conversions)

    // 生成账单
    invoice, err := p.generateInvoice(settlement)
    if err != nil {
        return PluginOutput{Success: false, Error: err.Error()}, nil
    }

    return PluginOutput{
        Success: true,
        Data: map[string]interface{}{
            "settlement": settlement,
            "invoice":    invoice,
        },
    }, nil
}
```

---

## 6. 插件通信

### 6.1 事件总线

```go
// EventBus 事件总线
type EventBus struct {
    subscribers map[string][]chan PluginEvent
    mutex       sync.RWMutex
}

type PluginEvent struct {
    Type      string                 `json:"type"`
    Source    string                 `json:"source"`
    Data      map[string]interface{} `json:"data"`
    Timestamp int64                  `json:"timestamp"`
}

// Subscribe 订阅事件
func (eb *EventBus) Subscribe(eventType string) chan PluginEvent {
    eb.mutex.Lock()
    defer eb.mutex.Unlock()

    ch := make(chan PluginEvent, 100)
    eb.subscribers[eventType] = append(eb.subscribers[eventType], ch)
    return ch
}

// Publish 发布事件
func (eb *EventBus) Publish(event PluginEvent) {
    eb.mutex.RLock()
    defer eb.mutex.RUnlock()

    for _, ch := range eb.subscribers[event.Type] {
        select {
        case ch <- event:
        default:
            // channel full, drop event
        }
    }
}
```

### 6.2 插件间通信示例

```go
// SEO 插件生成内容后发布事件
func (p *SEOPlugin) generateContent(ctx context.Context, input PluginInput) (PluginOutput, error) {
    content := "生成的文章内容..."

    // 发布内容生成事件
    p.eventBus.Publish(PluginEvent{
        Type:   "content.generated",
        Source: "seo-plugin",
        Data: map[string]interface{}{
            "content_id": "123",
            "content":    content,
            "keywords":   input.Data["keywords"],
        },
        Timestamp: time.Now().Unix(),
    })

    return PluginOutput{Success: true, Data: map[string]interface{}{
        "content": content,
    }}, nil
}

// 归因插件监听转化事件
func (p *AttributionPlugin) Start(ctx context.Context) {
    ch := p.eventBus.Subscribe("conversion.completed")

    for {
        select {
        case event := <-ch:
            p.processConversion(event)
        case <-ctx.Done():
            return
        }
    }
}
```

---

## 7. 插件开发指南

### 7.1 创建新插件

```go
// 1. 实现 Plugin 接口
type MyPlugin struct {
    config PluginConfig
    logger *zap.Logger
}

func (p *MyPlugin) Init(config PluginConfig) error {
    p.config = config
    p.logger = zap.L()
    return nil
}

func (p *MyPlugin) Execute(ctx context.Context, input PluginInput) (PluginOutput, error) {
    // 实现插件逻辑
    return PluginOutput{Success: true}, nil
}

func (p *MyPlugin) Shutdown() error {
    // 清理资源
    return nil
}

func (p *MyPlugin) Info() PluginInfo {
    return PluginInfo{
        ID:          "my-plugin",
        Name:        "My Plugin",
        Version:     "1.0.0",
        Type:        PluginType("custom"),
        Description: "My custom plugin",
    }
}

// 2. 注册插件
func init() {
    pluginManager.RegisterPlugin(&MyPlugin{})
}
```

### 7.2 插件配置文件

```yaml
# config/plugins/my-plugin.yaml
id: my-plugin
type: custom
enabled: true
priority: 50
timeout: 10
parameters:
  option1: value1
  option2: value2
```

---

## 8. 插件安全

### 8.1 沙箱隔离

```go
// SandboxedPlugin 沙箱插件包装器
type SandboxedPlugin struct {
    plugin Plugin
    limits ResourceLimits
}

type ResourceLimits struct {
    MaxMemory    int64         // 最大内存
    MaxDuration  time.Duration // 最大执行时间
    MaxCPU       float64       // 最大 CPU 使用率
    AllowedAPIs  []string      // 允许调用的 API
}

func (sp *SandboxedPlugin) Execute(ctx context.Context, input PluginInput) (PluginOutput, error) {
    // 设置资源限制
    ctx, cancel := context.WithTimeout(ctx, sp.limits.MaxDuration)
    defer cancel()

    // 在受限环境中执行
    result := make(chan PluginOutput, 1)
    errCh := make(chan error, 1)

    go func() {
        // 监控资源使用
        if err := sp.monitorResources(); err != nil {
            errCh <- err
            return
        }
        output, err := sp.plugin.Execute(ctx, input)
        result <- output
        errCh <- err
    }()

    select {
    case output := <-result:
        return output, <-errCh
    case err := <-errCh:
        return PluginOutput{Success: false, Error: err.Error()}, err
    case <-ctx.Done():
        return PluginOutput{Success: false, Error: "timeout"}, ctx.Err()
    }
}
```

---

*文档创建者: 01-架构师*
*最后更新: 2026-03-03*
