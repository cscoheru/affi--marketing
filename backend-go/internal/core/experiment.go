package core

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/experiment"
)

// ExperimentService 实验服务
type ExperimentService struct {
	db *gorm.DB
}

// NewExperimentService 创建实验服务
func NewExperimentService(db *gorm.DB) *ExperimentService {
	return &ExperimentService{db: db}
}

// List 获取实验列表
func (s *ExperimentService) List(ctx context.Context, filter ExperimentFilter) ([]experiment.Experiment, int64, error) {
	var experiments []experiment.Experiment
	var total int64

	query := s.db.WithContext(ctx).Model(&experiment.Experiment{})

	// 应用筛选条件
	if filter.ExperimentType != "" {
		query = query.Where("experiment_type = ?", filter.ExperimentType)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.Page > 0 && filter.Size > 0 {
		query = query.Offset((filter.Page - 1) * filter.Size).Limit(filter.Size)
	}

	// 排序
	query = query.Order("created_at DESC")

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count experiments: %w", err)
	}

	// 查询列表
	if err := query.Find(&experiments).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list experiments: %w", err)
	}

	return experiments, total, nil
}

// Get 获取实验详情
func (s *ExperimentService) Get(ctx context.Context, id uint) (*experiment.Experiment, error) {
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("experiment not found: %d", id)
		}
		return nil, fmt.Errorf("failed to get experiment: %w", err)
	}
	return &exp, nil
}

// Create 创建实验
func (s *ExperimentService) Create(ctx context.Context, exp *experiment.Experiment) error {
	// 设置初始状态
	if exp.Status == "" {
		exp.Status = experiment.ExperimentStatusDraft
	}

	// 验证实验配置
	if err := s.validateConfig(exp); err != nil {
		return fmt.Errorf("invalid config: %w", err)
	}

	// 创建实验
	if err := s.db.WithContext(ctx).Create(exp).Error; err != nil {
		return fmt.Errorf("failed to create experiment: %w", err)
	}

	return nil
}

// Update 更新实验
func (s *ExperimentService) Update(ctx context.Context, id uint, exp *experiment.Experiment) error {
	// 检查实验是否存在
	var existing experiment.Experiment
	if err := s.db.WithContext(ctx).First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("experiment not found: %d", id)
		}
		return fmt.Errorf("failed to get experiment: %w", err)
	}

	// 运行中的实验不允许修改关键配置
	if existing.Status == experiment.ExperimentStatusActive {
		// 只允许修改部分字段
		updates := map[string]interface{}{
			"name":        exp.Name,
			"description": exp.Description,
		}
		if err := s.db.WithContext(ctx).Model(&existing).Updates(updates).Error; err != nil {
			return fmt.Errorf("failed to update experiment: %w", err)
		}
		return nil
	}

	// 更新实验
	exp.ID = id
	if err := s.db.WithContext(ctx).Save(exp).Error; err != nil {
		return fmt.Errorf("failed to update experiment: %w", err)
	}

	return nil
}

// Delete 删除实验
func (s *ExperimentService) Delete(ctx context.Context, id uint) error {
	// 检查实验是否存在
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("experiment not found: %d", id)
		}
		return fmt.Errorf("failed to get experiment: %w", err)
	}

	// 运行中的实验不允许删除
	if exp.Status == experiment.ExperimentStatusActive {
		return fmt.Errorf("cannot delete running experiment: %d", id)
	}

	// 删除实验
	if err := s.db.WithContext(ctx).Delete(&exp).Error; err != nil {
		return fmt.Errorf("failed to delete experiment: %w", err)
	}

	return nil
}

// Start 启动实验
func (s *ExperimentService) Start(ctx context.Context, id uint) error {
	// 检查实验是否存在
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("experiment not found: %d", id)
		}
		return fmt.Errorf("failed to get experiment: %w", err)
	}

	// 检查状态
	if exp.Status != experiment.ExperimentStatusDraft && exp.Status != experiment.ExperimentStatusPaused {
		return fmt.Errorf("experiment is not in startable status: %s", exp.Status)
	}

	// 更新状态为运行中
	if err := s.db.WithContext(ctx).Model(&exp).Update("status", experiment.ExperimentStatusActive).Error; err != nil {
		return fmt.Errorf("failed to start experiment: %w", err)
	}

	return nil
}

// Stop 停止实验
func (s *ExperimentService) Stop(ctx context.Context, id uint) error {
	// 检查实验是否存在
	var exp experiment.Experiment
	if err := s.db.WithContext(ctx).First(&exp, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("experiment not found: %d", id)
		}
		return fmt.Errorf("failed to get experiment: %w", err)
	}

	// 检查状态
	if exp.Status != experiment.ExperimentStatusActive {
		return fmt.Errorf("experiment is not running: %s", exp.Status)
	}

	// 更新状态为已停止
	if err := s.db.WithContext(ctx).Model(&exp).Update("status", experiment.ExperimentStatusPaused).Error; err != nil {
		return fmt.Errorf("failed to stop experiment: %w", err)
	}

	return nil
}

// GetByTrackingID 根据追踪ID获取实验
func (s *ExperimentService) GetByTrackingID(ctx context.Context, trackingID string) (*experiment.Experiment, error) {
	var track experiment.Track
	if err := s.db.WithContext(ctx).Where("tracking_id = ?", trackingID).First(&track).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("track not found: %s", trackingID)
		}
		return nil, fmt.Errorf("failed to get track: %w", err)
	}

	return s.Get(ctx, track.ExperimentID)
}

// validateConfig 验证实验配置
func (s *ExperimentService) validateConfig(exp *experiment.Experiment) error {
	// 验证实验类型
	switch exp.ExperimentType {
	case experiment.ExperimentTypeSEO:
		return s.validateSEOConfig(exp)
	case experiment.ExperimentTypeGEO:
		return s.validateGEOConfig(exp)
	case experiment.ExperimentTypeAIAgent:
		return s.validateAIAgentConfig(exp)
	case experiment.ExperimentTypeAffiliateSAAS:
		return s.validateAffiliateSAASConfig(exp)
	default:
		return fmt.Errorf("unknown experiment type: %s", exp.ExperimentType)
	}
}

// validateSEOConfig 验证SEO实验配置
func (s *ExperimentService) validateSEOConfig(exp *experiment.Experiment) error {
	if exp.Config.SEOConfig == nil {
		return fmt.Errorf("SEO config is required for SEO experiment")
	}
	return nil
}

// validateGEOConfig 验证GEO优化配置
func (s *ExperimentService) validateGEOConfig(exp *experiment.Experiment) error {
	if exp.Config.GEOConfig == nil {
		return fmt.Errorf("GEO config is required for GEO experiment")
	}
	return nil
}

// validateAIAgentConfig 验证AI Agent配置
func (s *ExperimentService) validateAIAgentConfig(exp *experiment.Experiment) error {
	if exp.Config.AIAgentConfig == nil {
		return fmt.Errorf("AI Agent config is required for AI Agent experiment")
	}
	return nil
}

// validateAffiliateSAASConfig 验证联盟SAAS配置
func (s *ExperimentService) validateAffiliateSAASConfig(exp *experiment.Experiment) error {
	if exp.Config.AffiliateSAASConfig == nil {
		return fmt.Errorf("Affiliate SAAS config is required for Affiliate SAAS experiment")
	}
	return nil
}

// ExperimentFilter 实验查询过滤器
type ExperimentFilter struct {
	ExperimentType string
	Status         string
	Page           int
	Size           int
}
