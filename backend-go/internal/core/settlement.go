package core

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/settlement"
)

// SettlementService 结算服务
type SettlementService struct {
	db                *gorm.DB
	attributionEngine *AttributionEngine
}

// NewSettlementService 创建结算服务
func NewSettlementService(db *gorm.DB, attributionType AttributionType) *SettlementService {
	return &SettlementService{
		db:                db,
		attributionEngine: NewAttributionEngine(attributionType),
	}
}

// CreateRecord 创建结算记录
func (s *SettlementService) CreateRecord(ctx context.Context, record *settlement.SettlementRecord) error {
	// 设置结算时间
	if record.SettlementDate.IsZero() {
		record.SettlementDate = time.Now()
	}

	// 设置初始状态
	if record.Status == "" {
		record.Status = settlement.SettlementStatusPending
	}

	// 创建结算记录
	if err := s.db.WithContext(ctx).Create(record).Error; err != nil {
		return fmt.Errorf("failed to create settlement record: %w", err)
	}

	return nil
}

// GetRecord 获取结算记录详情
func (s *SettlementService) GetRecord(ctx context.Context, id uint) (*settlement.SettlementRecord, error) {
	var record settlement.SettlementRecord
	if err := s.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, fmt.Errorf("failed to get settlement record: %w", err)
	}
	return &record, nil
}

// ListRecords 获取结算记录列表
func (s *SettlementService) ListRecords(ctx context.Context, filter SettlementFilter) ([]settlement.SettlementRecord, int64, error) {
	var records []settlement.SettlementRecord
	var total int64

	query := s.db.WithContext(ctx).Model(&settlement.SettlementRecord{})

	// 应用筛选条件
	if filter.ExperimentID > 0 {
		query = query.Where("experiment_id = ?", filter.ExperimentID)
	}
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if !filter.StartDate.IsZero() {
		query = query.Where("settlement_date >= ?", filter.StartDate)
	}
	if !filter.EndDate.IsZero() {
		query = query.Where("settlement_date <= ?", filter.EndDate)
	}
	if filter.Page > 0 && filter.Size > 0 {
		query = query.Offset((filter.Page - 1) * filter.Size).Limit(filter.Size)
	}

	// 排序
	query = query.Order("settlement_date DESC")

	// 查询总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count settlement records: %w", err)
	}

	// 查询列表
	if err := query.Find(&records).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list settlement records: %w", err)
	}

	return records, total, nil
}

// ProcessRecord 处理结算记录
func (s *SettlementService) ProcessRecord(ctx context.Context, recordID uint) error {
	// 获取结算记录
	record, err := s.GetRecord(ctx, recordID)
	if err != nil {
		return err
	}

	// 检查状态
	if record.Status != settlement.SettlementStatusPending {
		return fmt.Errorf("settlement record is not in pending status: %s", record.Status)
	}

	// 获取实验周期内的所有转化
	conversions, err := s.getConversionsByPeriod(ctx, record.ExperimentID, record.StartDate, record.EndDate)
	if err != nil {
		return fmt.Errorf("failed to get conversions: %w", err)
	}

	// 计算总佣金
	totalCommission := 0.0
	for _, conversion := range conversions {
		totalCommission += conversion.Commission
	}

	// 更新结算记录
	updates := map[string]interface{}{
		"total_conversions": len(conversions),
		"total_commission":  totalCommission,
		"status":            settlement.SettlementStatusCompleted,
	}

	if err := s.db.WithContext(ctx).Model(record).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update settlement record: %w", err)
	}

	return nil
}

// CalculateAttribution 计算归因
func (s *SettlementService) CalculateAttribution(
	ctx context.Context,
	conversionID uint,
) (*AttributionResult, error) {
	// 获取转化
	var conversion settlement.Conversion
	if err := s.db.WithContext(ctx).First(&conversion, conversionID).Error; err != nil {
		return nil, fmt.Errorf("conversion not found: %w", err)
	}

	// 获取触点
	touchpoints, err := s.getTouchpointsForConversion(ctx, conversion)
	if err != nil {
		return nil, fmt.Errorf("failed to get touchpoints: %w", err)
	}

	// 执行归因计算
	result := s.attributionEngine.Calculate(conversion, touchpoints)

	return result, nil
}

// CalculateCommission 计算佣金
func (s *SettlementService) CalculateCommission(
	ctx context.Context,
	attributionResult *AttributionResult,
) (map[uint]float64, error) {
	commissions := make(map[uint]float64)

	for touchpointID, credit := range attributionResult.Credits {
		// 根据触点类型和联盟网络计算佣金
		// 这里简化处理，直接使用信用分作为佣金
		// 实际应用中可能需要根据联盟网络的费率计算
		commissions[touchpointID] = credit
	}

	return commissions, nil
}

// GetRecordsByExperiment 获取实验的所有结算记录
func (s *SettlementService) GetRecordsByExperiment(ctx context.Context, experimentID uint) ([]settlement.SettlementRecord, error) {
	var records []settlement.SettlementRecord

	if err := s.db.WithContext(ctx).
		Where("experiment_id = ?", experimentID).
		Order("settlement_date DESC").
		Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get records by experiment: %w", err)
	}

	return records, nil
}

// GetTotalCommissionByExperiment 获取实验的总佣金
func (s *SettlementService) GetTotalCommissionByExperiment(ctx context.Context, experimentID uint) (float64, error) {
	var total float64

	if err := s.db.WithContext(ctx).
		Model(&settlement.SettlementRecord{}).
		Where("experiment_id = ? AND status = ?", experimentID, settlement.SettlementStatusCompleted).
		Select("COALESCE(SUM(total_commission), 0)").
		Scan(&total).Error; err != nil {
		return 0, fmt.Errorf("failed to calculate total commission: %w", err)
	}

	return total, nil
}

// getConversionsByPeriod 获取指定时间段的转化
func (s *SettlementService) getConversionsByPeriod(
	ctx context.Context,
	experimentID uint,
	startDate, endDate time.Time,
) ([]settlement.Conversion, error) {
	var conversions []settlement.Conversion

	if err := s.db.WithContext(ctx).
		Where("experiment_id = ? AND created_at >= ? AND created_at <= ?", experimentID, startDate, endDate).
		Find(&conversions).Error; err != nil {
		return nil, err
	}

	return conversions, nil
}

// getTouchpointsForConversion 获取转化的触点列表
func (s *SettlementService) getTouchpointsForConversion(
	ctx context.Context,
	conversion settlement.Conversion,
) ([]settlement.Touchpoint, error) {
	var touchpoints []settlement.Touchpoint

	if err := s.db.WithContext(ctx).
		Where("tracking_id = ? AND created_at <= ?", conversion.TrackingID, conversion.CreatedAt).
		Order("created_at ASC").
		Find(&touchpoints).Error; err != nil {
		return nil, err
	}

	return touchpoints, nil
}

// GenerateSettlementReport 生成结算报告
func (s *SettlementService) GenerateSettlementReport(
	ctx context.Context,
	experimentID uint,
	startDate, endDate time.Time,
) (*SettlementReport, error) {
	// 获取转化数据
	conversions, err := s.getConversionsByPeriod(ctx, experimentID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// 计算归因和佣金
	report := &SettlementReport{
		ExperimentID:  experimentID,
		StartDate:     startDate,
		EndDate:       endDate,
		TotalConversions: len(conversions),
	}

	totalCommission := 0.0
	networkCommissions := make(map[string]float64)

	for _, conversion := range conversions {
		// 计算归因
		attributionResult, err := s.CalculateAttribution(ctx, conversion.ID)
		if err != nil {
			continue
		}

		// 计算佣金
		commissions, err := s.CalculateCommission(ctx, attributionResult)
		if err != nil {
			continue
		}

		// 汇总
		for touchpointID, commission := range commissions {
			totalCommission += commission

			// 查找触点的网络
			for _, tp := range attributionResult.Touchpoints {
				if tp.ID == touchpointID {
					networkCommissions[tp.AffiliateNetwork] += commission
					break
				}
			}
		}
	}

	report.TotalCommission = totalCommission
	report.NetworkCommissions = networkCommissions

	return report, nil
}

// SettlementFilter 结算记录查询过滤器
type SettlementFilter struct {
	ExperimentID uint
	Status       string
	StartDate    time.Time
	EndDate      time.Time
	Page         int
	Size         int
}

// SettlementReport 结算报告
type SettlementReport struct {
	ExperimentID       uint
	StartDate          time.Time
	EndDate            time.Time
	TotalConversions   int
	TotalCommission    float64
	NetworkCommissions map[string]float64
}
