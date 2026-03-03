package plugin

import (
	"context"
	"time"
)

// PluginContext 插件执行上下文
type PluginContext struct {
	context.Context
	ExperimentID  string
	PluginID      string
	TrackingID    string
	StartTime     time.Time
	Metadata      map[string]interface{}
	RequestID     string
	UserID        string
}

// NewPluginContext 创建插件上下文
func NewPluginContext(ctx context.Context, experimentID, pluginID string) *PluginContext {
	return &PluginContext{
		Context:      ctx,
		ExperimentID: experimentID,
		PluginID:     pluginID,
		StartTime:    time.Now(),
		Metadata:     make(map[string]interface{}),
	}
}

// WithTrackingID 设置追踪 ID
func (c *PluginContext) WithTrackingID(trackingID string) *PluginContext {
	c.TrackingID = trackingID
	return c
}

// WithRequestID 设置请求 ID
func (c *PluginContext) WithRequestID(requestID string) *PluginContext {
	c.RequestID = requestID
	return c
}

// WithUserID 设置用户 ID
func (c *PluginContext) WithUserID(userID string) *PluginContext {
	c.UserID = userID
	return c
}

// WithMetadata 添加元数据
func (c *PluginContext) WithMetadata(key string, value interface{}) *PluginContext {
	if c.Metadata == nil {
		c.Metadata = make(map[string]interface{})
	}
	c.Metadata[key] = value
	return c
}

// GetDuration 获取执行时长
func (c *PluginContext) GetDuration() time.Duration {
	return time.Since(c.StartTime)
}

// Event 事件
type Event struct {
	Type      string                 `json:"type"`
	Source    string                 `json:"source"`
	Data      map[string]interface{} `json:"data"`
	Timestamp int64                  `json:"timestamp"`
}

// EventBus 事件总线接口
type EventBus interface {
	Subscribe(eventType string) chan Event
	Publish(event Event)
	Unsubscribe(eventType string, ch chan Event)
}

// MemoryEventBus 内存事件总线实现
type MemoryEventBus struct {
	subscribers map[string][]chan Event
}

// NewMemoryEventBus 创建内存事件总线
func NewMemoryEventBus() *MemoryEventBus {
	return &MemoryEventBus{
		subscribers: make(map[string][]chan Event),
	}
}

// Subscribe 订阅事件
func (eb *MemoryEventBus) Subscribe(eventType string) chan Event {
	ch := make(chan Event, 100)
	eb.subscribers[eventType] = append(eb.subscribers[eventType], ch)
	return ch
}

// Publish 发布事件
func (eb *MemoryEventBus) Publish(event Event) {
	for _, ch := range eb.subscribers[event.Type] {
		select {
		case ch <- event:
		default:
			// channel full, drop event
		}
	}
}

// Unsubscribe 取消订阅
func (eb *MemoryEventBus) Unsubscribe(eventType string, ch chan Event) {
	channels := eb.subscribers[eventType]
	for i, c := range channels {
		if c == ch {
			eb.subscribers[eventType] = append(channels[:i], channels[i+1:]...)
			close(ch)
			break
		}
	}
}
