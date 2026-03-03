package core

import (
	"math"
	"time"

	"github.com/zenconsult/affi-marketing/internal/model/settlement"
)

// AttributionType 归因类型
type AttributionType string

const (
	// AttributionLastClick 最后点击归因
	AttributionLastClick AttributionType = "last_click"
	// AttributionLinear 线性归因
	AttributionLinear AttributionType = "linear"
	// AttributionTimeDecay 时间衰减归因
	AttributionTimeDecay AttributionType = "time_decay"
)

// AttributionEngine 归因引擎
type AttributionEngine struct {
	attributionType AttributionType
	decayHalfLife   time.Duration // 时间衰减半衰期
}

// NewAttributionEngine 创建归因引擎
func NewAttributionEngine(attributionType AttributionType) *AttributionEngine {
	engine := &AttributionEngine{
		attributionType: attributionType,
	}

	// 设置默认半衰期为7天
	if attributionType == AttributionTimeDecay {
		engine.decayHalfLife = 7 * 24 * time.Hour
	}

	return engine
}

// SetDecayHalfLife 设置时间衰减半衰期
func (e *AttributionEngine) SetDecayHalfLife(halfLife time.Duration) {
	e.decayHalfLife = halfLife
}

// AttributionResult 归因结果
type AttributionResult struct {
	ConversionID    uint                        // 转化ID
	AttributionType AttributionType             // 归因类型
	Touchpoints     []settlement.Touchpoint     // 触�点列表
	Credits         map[uint]float64            // 各触点获得的信用分
	TotalValue      float64                     // 总转化价值
	ConversionTime  time.Time                   // 转化时间
}

// Calculate 执行归因计算
func (e *AttributionEngine) Calculate(
	conversion settlement.Conversion,
	touchpoints []settlement.Touchpoint,
) *AttributionResult {
	result := &AttributionResult{
		ConversionID:    conversion.ID,
		AttributionType: e.attributionType,
		Touchpoints:     touchpoints,
		Credits:         make(map[uint]float64),
		TotalValue:      conversion.Commission,
		ConversionTime:  conversion.CreatedAt,
	}

	// 初始化所有触点的信用分为0
	for _, tp := range touchpoints {
		result.Credits[tp.ID] = 0
	}

	// 根据归因类型计算信用分配
	switch e.attributionType {
	case AttributionLastClick:
		e.calculateLastClick(result)
	case AttributionLinear:
		e.calculateLinear(result)
	case AttributionTimeDecay:
		e.calculateTimeDecay(result)
	}

	return result
}

// calculateLastClick 最后点击归因
// 将100%的信用分配给最后一次点击的触点
func (e *AttributionEngine) calculateLastClick(result *AttributionResult) {
	if len(result.Touchpoints) == 0 {
		return
	}

	// 找到最接近转化时间的触点
	lastTouchpoint := result.Touchpoints[0]
	for _, tp := range result.Touchpoints {
		if tp.CreatedAt.After(lastTouchpoint.CreatedAt) {
			lastTouchpoint = tp
		}
	}

	// 将全部信用分配给最后点击
	result.Credits[lastTouchpoint.ID] = result.TotalValue
}

// calculateLinear 线性归因
// 将信用平均分配给所有触点
func (e *AttributionEngine) calculateLinear(result *AttributionResult) {
	count := len(result.Touchpoints)
	if count == 0 {
		return
	}

	// 每个触点获得相等的信用
	creditPerTouchpoint := result.TotalValue / float64(count)
	for _, tp := range result.Touchpoints {
		result.Credits[tp.ID] = creditPerTouchpoint
	}
}

// calculateTimeDecay 时间衰减归因
// 使用指数衰减函数，越接近转化时间的触点获得更多信用
// 衰减公式: credit = e^(-lambda * time_diff)
// 其中 lambda = ln(2) / half_life
func (e *AttributionEngine) calculateTimeDecay(result *AttributionResult) {
	if len(result.Touchpoints) == 0 {
		return
	}

	// 计算衰减系数 lambda
	lambda := math.Ln2 / float64(e.decayHalfLife.Seconds())

	// 计算每个触点的权重
	weights := make(map[uint]float64)
	totalWeight := 0.0

	for _, tp := range result.Touchpoints {
		// 计算触点到转化时间的时间差（秒）
		timeDiff := result.ConversionTime.Sub(tp.CreatedAt).Seconds()

		// 使用指数衰减计算权重
		weight := math.Exp(-lambda * timeDiff)
		weights[tp.ID] = weight
		totalWeight += weight
	}

	// 根据权重分配信用
	if totalWeight > 0 {
		for _, tp := range result.Touchpoints {
			credit := result.TotalValue * (weights[tp.ID] / totalWeight)
			result.Credits[tp.ID] = credit
		}
	}
}

// GetTopTouchpoints 获取获得信用最多的前N个触点
func (r *AttributionResult) GetTopTouchpoints(n int) []settlement.Touchpoint {
	// 按信用分排序
	type touchpointCredit struct {
		touchpoint settlement.Touchpoint
		credit     float64
	}

	var tcList []touchpointCredit
	for _, tp := range r.Touchpoints {
		tcList = append(tcList, touchpointCredit{
			touchpoint: tp,
			credit:     r.Credits[tp.ID],
		})
	}

	// 冒泡排序（按信用分降序）
	for i := 0; i < len(tcList)-1; i++ {
		for j := 0; j < len(tcList)-1-i; j++ {
			if tcList[j].credit < tcList[j+1].credit {
				tcList[j], tcList[j+1] = tcList[j+1], tcList[j]
			}
		}
	}

	// 取前N个
	result := make([]settlement.Touchpoint, 0, n)
	for i := 0; i < n && i < len(tcList); i++ {
		result = append(result, tcList[i].touchpoint)
	}

	return result
}

// GetCreditByTouchpoint 获取指定触点的信用分
func (r *AttributionResult) GetCreditByTouchpoint(touchpointID uint) float64 {
	return r.Credits[touchpointID]
}

// GetCreditByExperiment 获取指定实验的总信用分
func (r *AttributionResult) GetCreditByExperiment(experimentID uint) float64 {
	total := 0.0
	for _, tp := range r.Touchpoints {
		if tp.ExperimentID == experimentID {
			total += r.Credits[tp.ID]
		}
	}
	return total
}

// GetCreditByAffiliateNetwork 获取指定联盟网络的总信用分
func (r *AttributionResult) GetCreditByAffiliateNetwork(network string) float64 {
	total := 0.0
	for _, tp := range r.Touchpoints {
		if tp.AffiliateNetwork == network {
			total += r.Credits[tp.ID]
		}
	}
	return total
}
