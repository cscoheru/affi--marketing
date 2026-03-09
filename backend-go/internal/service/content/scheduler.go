package contentservice

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// ScheduleScheduler 定时任务调度器
type ScheduleScheduler struct {
	db       *gorm.DB
	stopChan chan struct{}
	wg       sync.WaitGroup
	mu       sync.Mutex
	running  bool
}

// NewScheduleScheduler 创建定时任务调度器
func NewScheduleScheduler(db *gorm.DB) *ScheduleScheduler {
	return &ScheduleScheduler{
		db:       db,
		stopChan: make(chan struct{}),
	}
}

// Start 启动调度器
func (s *ScheduleScheduler) Start() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	s.wg.Add(1)
	go s.run()
	logger.Info("Schedule scheduler started")
}

// Stop 停止调度器
func (s *ScheduleScheduler) Stop() {
	s.mu.Lock()
	if !s.running {
		s.mu.Unlock()
		return
	}
	s.running = false
	s.mu.Unlock()

	close(s.stopChan)
	s.wg.Wait()
	logger.Info("Schedule scheduler stopped")
}

// run 主循环
func (s *ScheduleScheduler) run() {
	defer s.wg.Done()

	// 每分钟检查一次
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	// 启动时立即执行一次检查
	s.checkAndExecuteTasks()

	for {
		select {
		case <-s.stopChan:
			return
		case <-ticker.C:
			s.checkAndExecuteTasks()
		}
	}
}

// checkAndExecuteTasks 检查并执行到期的任务
func (s *ScheduleScheduler) checkAndExecuteTasks() {
	now := time.Now()

	// 查找需要执行的任务
	// 条件：状态为 active 且 next_run_at <= now
	var tasks []content.ScheduleTask
	if err := s.db.Where("status = ? AND next_run_at <= ?", "active", now).
		Order("next_run_at ASC").
		Find(&tasks).Error; err != nil {
		logger.Error("Failed to fetch due tasks", zap.Error(err))
		return
	}

	if len(tasks) > 0 {
		logger.Info("Found tasks to execute", zap.Int("count", len(tasks)))
	}

	for _, task := range tasks {
		s.executeTask(&task)
	}
}

// executeTask 执行单个任务
func (s *ScheduleScheduler) executeTask(task *content.ScheduleTask) {
	startTime := time.Now()
	logger.Info("Executing scheduled task",
		zap.Int("task_id", task.ID),
		zap.String("name", task.Name),
		zap.String("category", task.Category),
	)

	// 创建执行历史记录
	history := &content.ScheduleTaskHistory{
		TaskID: task.ID,
		RunAt:  startTime,
		Status: "running",
	}

	// 保存初始历史记录
	if err := s.db.Create(history).Error; err != nil {
		logger.Error("Failed to create task history", zap.Error(err))
		return
	}

	// 执行选品任务
	products, err := s.runProductSelection(task)
	executionTime := int(time.Since(startTime).Milliseconds())

	if err != nil {
		// 更新历史记录为失败
		history.Status = "failed"
		history.ErrorMessage = err.Error()
		history.ExecutionTime = executionTime
		s.db.Save(history)

		logger.Error("Task execution failed",
			zap.Int("task_id", task.ID),
			zap.Error(err),
			zap.Int("execution_time_ms", executionTime),
		)
	} else {
		// 更新历史记录为成功
		topProductsJSON, _ := json.Marshal(products[:min(len(products), 5)])
		history.Status = "success"
		history.ProductsFound = len(products)
		history.ProductsAdded = s.countNewProducts(task, products)
		history.TopProducts = string(topProductsJSON)
		history.ExecutionTime = executionTime
		s.db.Save(history)

		logger.Info("Task execution completed",
			zap.Int("task_id", task.ID),
			zap.Int("products_found", len(products)),
			zap.Int("products_added", history.ProductsAdded),
			zap.Int("execution_time_ms", executionTime),
		)

		// 如果设置了自动添加，将产品添加到市场库
		if task.AutoAdd && len(products) > 0 {
			s.addProductsToMarkets(task, products)
		}
	}

	// 更新任务的执行信息
	now := time.Now()
	task.LastRunAt = &now
	task.RunCount++
	task.NextRunAt = calculateNextRun(task.Frequency, task.ExecuteTime)
	s.db.Save(task)
}

// runProductSelection 执行选品逻辑
func (s *ScheduleScheduler) runProductSelection(task *content.ScheduleTask) ([]map[string]interface{}, error) {
	// 构建选品条件
	filters := map[string]interface{}{
		"category":   task.Category,
		"minPrice":   task.MinPrice,
		"maxPrice":   task.MaxPrice,
		"minRating":  task.MinRating,
		"maxResults": task.MaxResults,
	}

	// 如果指定了竞争程度和市场趋势
	if task.CompetitionLevel != "" {
		filters["competitionLevel"] = task.CompetitionLevel
	}
	if task.MarketTrend != "" {
		filters["marketTrend"] = task.MarketTrend
	}

	// 模拟 AI 选品结果
	// TODO: 实现真实的 AI 选品调用
	products := s.getSimulatedProducts(filters, task.MaxResults)

	return products, nil
}

// getSimulatedProducts 获取模拟产品数据
func (s *ScheduleScheduler) getSimulatedProducts(filters map[string]interface{}, limit int) []map[string]interface{} {
	// 这里应该调用实际的 AI 推荐服务
	// 目前返回模拟数据
	products := make([]map[string]interface{}, 0, limit)

	category := "unknown"
	if c, ok := filters["category"].(string); ok && c != "" {
		category = c
	}

	minPrice := 0
	if mp, ok := filters["minPrice"].(int); ok {
		minPrice = mp
	}

	for i := 0; i < limit; i++ {
		products = append(products, map[string]interface{}{
			"asin":        fmt.Sprintf("B0TEST%d%04d", time.Now().Unix()%100, i),
			"title":       fmt.Sprintf("推荐产品 %d - %s 类别", i+1, category),
			"price":       float64(minPrice + i*10 + 20),
			"rating":      4.0 + float64(i%5)*0.1,
			"reviewCount": 1000 + i*100,
			"aiScore":     75 + i,
			"aiReason":    "基于 AI 分析的市场推荐",
		})
	}

	return products
}

// countNewProducts 计算新增产品数量
func (s *ScheduleScheduler) countNewProducts(task *content.ScheduleTask, products []map[string]interface{}) int {
	count := 0
	for _, p := range products {
		asin, ok := p["asin"].(string)
		if !ok {
			continue
		}
		var existing content.MarketOpportunity
		if err := s.db.Where("asin = ?", asin).First(&existing).Error; err == gorm.ErrRecordNotFound {
			count++
		}
	}
	return count
}

// addProductsToMarkets 将产品添加到市场库
func (s *ScheduleScheduler) addProductsToMarkets(task *content.ScheduleTask, products []map[string]interface{}) {
	for _, p := range products {
		asin, ok := p["asin"].(string)
		if !ok {
			continue
		}

		// 检查是否已存在
		var existing content.MarketOpportunity
		if err := s.db.Where("asin = ?", asin).First(&existing).Error; err == nil {
			continue // 已存在，跳过
		}

		title, _ := p["title"].(string)
		price, _ := p["price"].(float64)
		rating, _ := p["rating"].(float64)
		reviewCount, _ := p["reviewCount"].(int)

		// 创建新的市场机会
		market := &content.MarketOpportunity{
			ASIN:        asin,
			Title:       title,
			Price:       fmt.Sprintf("%.2f", price),
			Rating:      fmt.Sprintf("%.1f", rating),
			ReviewCount: reviewCount,
			Status:      "watching",
			Category:    task.Category,
			ImageURL:    "/images/placeholder-product.png",
		}

		if err := s.db.Create(market).Error; err != nil {
			logger.Error("Failed to add product to markets", zap.String("asin", asin), zap.Error(err))
		}
	}
}

// calculateNextRun 计算下次执行时间
func calculateNextRun(frequency, executeTime string) *time.Time {
	now := time.Now()

	// 解析执行时间 (HH:MM format)
	var hour, minute int
	fmt.Sscanf(executeTime, "%d:%d", &hour, &minute)

	// 计算今天的执行时间
	todayRun := time.Date(now.Year(), now.Month(), now.Day(), hour, minute, 0, 0, now.Location())

	var nextRun time.Time

	switch frequency {
	case "daily":
		if now.Before(todayRun) {
			nextRun = todayRun
		} else {
			nextRun = todayRun.Add(24 * time.Hour)
		}
	case "weekly":
		daysUntilNext := 7 - int(now.Weekday())
		if daysUntilNext == 0 && now.Before(todayRun) {
			nextRun = todayRun
		} else if daysUntilNext == 0 {
			nextRun = todayRun.Add(7 * 24 * time.Hour)
		} else {
			nextRun = todayRun.Add(time.Duration(daysUntilNext) * 24 * time.Hour)
		}
	case "monthly":
		daysInMonth := time.Date(now.Year(), now.Month()+1, 0, 0, 0, 0, 0, now.Location()).Day()
		if now.Day() < daysInMonth && now.Before(todayRun) {
			nextRun = todayRun
		} else {
			// 下个月的同一天
			nextMonth := now.Month() + 1
			nextYear := now.Year()
			if nextMonth > 12 {
				nextMonth = 1
				nextYear++
			}
			nextRun = time.Date(nextYear, nextMonth, now.Day(), hour, minute, 0, 0, now.Location())
		}
	default:
		nextRun = todayRun.Add(24 * time.Hour)
	}

	return &nextRun
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
