package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/experiment"
)

// TrackingService 追踪服务
type TrackingService struct {
	db *gorm.DB
}

// NewTrackingService 创建追踪服务
func NewTrackingService(db *gorm.DB) *TrackingService {
	return &TrackingService{db: db}
}

// RecordEvent 记录追踪事件
func (s *TrackingService) RecordEvent(ctx context.Context, track *experiment.Track) error {
	// 生成追踪ID（如果未提供）
	if track.TrackingID == "" {
		track.TrackingID = s.generateTrackingID()
	}

	// 设置事件时间
	if track.CreatedAt.IsZero() {
		track.CreatedAt = time.Now()
	}

	// 验证实验是否存在
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, track.ExperimentID).Error; err != nil {
		return fmt.Errorf("experiment not found: %w", err)
	}

	// 检查实验状态
	if exp.Status != experiment.ExperimentStatusActive {
		return fmt.Errorf("experiment is not running: %s", exp.Status)
	}

	// 记录事件
	if err := s.db.WithContext(ctx).Create(track).Error; err != nil {
		return fmt.Errorf("failed to record track: %w", err)
	}

	return nil
}

// GetEvent 获取追踪事件详情
func (s *TrackingService) GetEvent(ctx context.Context, id uint) (*experiment.Track, error) {
	var track experiment.Track
	if err := s.db.WithContext(ctx).First(&track, id).Error; err != nil {
		return nil, fmt.Errorf("failed to get track: %w", err)
	}
	return &track, nil
}

// GetEventByTrackingID 根据追踪ID获取事件
func (s *TrackingService) GetEventByTrackingID(ctx context.Context, trackingID string) (*experiment.Track, error) {
	var track experiment.Track
	if err := s.db.WithContext(ctx).Where("tracking_id = ?", trackingID).First(&track).Error; err != nil {
		return nil, fmt.Errorf("failed to get track by tracking_id: %w", err)
	}
	return &track, nil
}

// ListEvents 获取追踪事件列表
func (s *TrackingService) ListEvents(ctx context.Context, filter TrackFilter) ([]experiment.Track, int64, error) {
	var tracks []experiment.Track
	var total int64

	query := s.db.WithContext(ctx).Model(&experiment.Track{})

	// 应用筛选条件
	if filter.ExperimentID > 0 {
		query = query.Where("experiment_id = ?", filter.ExperimentID)
	}
	if filter.TrackingID != "" {
		query = query.Where("tracking_id = ?", filter.TrackingID)
	}
	if filter.EventType != "" {
		query = query.Where("event_type = ?", filter.EventType)
	}
	if !filter.StartTime.IsZero() {
		query = query.Where("timestamp >= ?", filter.StartTime)
	}
	if !filter.EndTime.IsZero() {
		query = query.Where("timestamp <= ?", filter.EndTime)
	}
	if filter.Page > 0 && filter.Size > 0 {
		query = query.Offset((filter.Page - 1) * filter.Size).Limit(filter.Size)
	}

	// 排序
	query = query.Order("timestamp DESC")

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count tracks: %w", err)
	}

	// 查询列表
	if err := query.Find(&tracks).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list tracks: %w", err)
	}

	return tracks, total, nil
}

// GetEventsByExperiment 获取实验的所有追踪事件
func (s *TrackingService) GetEventsByExperiment(ctx context.Context, experimentID uint, limit int) ([]experiment.Track, error) {
	var tracks []experiment.Track

	query := s.db.WithContext(ctx).
		Where("experiment_id = ?", experimentID).
		Order("timestamp DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&tracks).Error; err != nil {
		return nil, fmt.Errorf("failed to get events by experiment: %w", err)
	}

	return tracks, nil
}

// GetEventsByUser 获取用户的所有追踪事件
func (s *TrackingService) GetEventsByUser(ctx context.Context, userID string, limit int) ([]experiment.Track, error) {
	var tracks []experiment.Track

	query := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("timestamp DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&tracks).Error; err != nil {
		return nil, fmt.Errorf("failed to get events by user: %w", err)
	}

	return tracks, nil
}

// GetConversionEvents 获取转化事件
func (s *TrackingService) GetConversionEvents(ctx context.Context, experimentID uint) ([]experiment.Track, error) {
	var tracks []experiment.Track

	if err := s.db.WithContext(ctx).
		Where("experiment_id = ? AND event_type IN (?)", experimentID, []string{"conversion", "purchase", "signup"}).
		Order("timestamp DESC").
		Find(&tracks).Error; err != nil {
		return nil, fmt.Errorf("failed to get conversion events: %w", err)
	}

	return tracks, nil
}

// GetTouchpoints 获取转化的触点列表（用于归因）
func (s *TrackingService) GetTouchpoints(ctx context.Context, conversionID uint) ([]experiment.Track, error) {
	// 先获取转化事件
	var conversion experiment.Conversion
	if err := s.db.WithContext(ctx).First(&conversion, conversionID).Error; err != nil {
		return nil, fmt.Errorf("conversion not found: %w", err)
	}

	// 获取该转化前的所有追踪事件
	var tracks []experiment.Track
	if err := s.db.WithContext(ctx).
		Where("tracking_id = ? AND timestamp <= ?", conversion.TrackID, conversion.CreatedAt).
		Order("timestamp ASC").
		Find(&tracks).Error; err != nil {
		return nil, fmt.Errorf("failed to get touchpoints: %w", err)
	}

	return tracks, nil
}

// RecordConversion 记录转化
func (s *TrackingService) RecordConversion(ctx context.Context, conversion *experiment.Conversion) error {
	// 生成追踪ID（如果未提供）
	if conversion.TrackID == "" {
		return fmt.Errorf("tracking_id is required")
	}

	// 验证实验是否存在
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, conversion.ExperimentID).Error; err != nil {
		return fmt.Errorf("experiment not found: %w", err)
	}

	// 设置转化时间
	if conversion.CreatedAt.IsZero() {
		conversion.CreatedAt = time.Now()
	}

	// 记录转化
	if err := s.db.WithContext(ctx).Create(conversion).Error; err != nil {
		return fmt.Errorf("failed to record conversion: %w", err)
	}

	return nil
}

// GetStats 获取追踪统计
func (s *TrackingService) GetStats(ctx context.Context, experimentID uint) (*TrackStats, error) {
	stats := &TrackStats{}

	// 总事件数
	if err := s.db.WithContext(ctx).
		Model(&experiment.Track{}).
		Where("experiment_id = ?", experimentID).
		Count(&stats.TotalEvents).Error; err != nil {
		return nil, fmt.Errorf("failed to count total events: %w", err)
	}

	// 按事件类型统计
	type EventTypeCount struct {
		EventType string
		Count     int64
	}

	var eventTypeCounts []EventTypeCount
	if err := s.db.WithContext(ctx).
		Model(&experiment.Track{}).
		Select("event_type, count(*) as count").
		Where("experiment_id = ?", experimentID).
		Group("event_type").
		Scan(&eventTypeCounts).Error; err != nil {
		return nil, fmt.Errorf("failed to count by event type: %w", err)
	}

	stats.EventTypeCounts = make(map[string]int64)
	for _, tc := range eventTypeCounts {
		stats.EventTypeCounts[tc.EventType] = tc.Count
	}

	// 唯一访客数
	if err := s.db.WithContext(ctx).
		Model(&experiment.Track{}).
		Where("experiment_id = ?", experimentID).
		Distinct("user_id").
		Count(&stats.UniqueVisitors).Error; err != nil {
		return nil, fmt.Errorf("failed to count unique visitors: %w", err)
	}

	return stats, nil
}

// generateTrackingID 生成追踪ID
func (s *TrackingService) generateTrackingID() string {
	// 使用UUID生成唯一追踪ID
	return uuid.New().String()
}

// TrackFilter 追踪事件查询过滤器
type TrackFilter struct {
	ExperimentID uint
	TrackingID   string
	EventType    string
	StartTime    time.Time
	EndTime      time.Time
	Page         int
	Size         int
}

// TrackStats 追踪统计
type TrackStats struct {
	TotalEvents      int64
	UniqueVisitors   int64
	EventTypeCounts  map[string]int64
}
