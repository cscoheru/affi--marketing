package content

import "time"

// ScheduleTask 定时选品任务
type ScheduleTask struct {
	ID          int        `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string     `json:"name" gorm:"column:name;size:200;not null"`
	Frequency   string     `json:"frequency" gorm:"column:frequency;size:20;not null"` // daily/weekly/monthly
	ExecuteTime string     `json:"executeTime" gorm:"column:execute_time;size:10;not null"` // HH:MM format
	// 选品配置
	Category         string `json:"category" gorm:"column:category;size:50"`
	MinPrice         int    `json:"minPrice" gorm:"column:min_price;default:0"`
	MaxPrice         int    `json:"maxPrice" gorm:"column:max_price;default:500"`
	MinRating        string `json:"minRating" gorm:"column:min_rating;size:10"`
	AutoAdd          bool   `json:"autoAdd" gorm:"column:auto_add;default:false"` // 是否自动添加到市场库
	MaxResults       int    `json:"maxResults" gorm:"column:max_results;default:10"`
	CompetitionLevel string `json:"competitionLevel" gorm:"column:competition_level;size:20"`
	MarketTrend      string `json:"marketTrend" gorm:"column:market_trend;size:20"`
	// 状态
	Status     string     `json:"status" gorm:"column:status;size:20;default:active"` // active/paused/deleted
	LastRunAt  *time.Time `json:"lastRunAt" gorm:"column:last_run_at"`
	NextRunAt  *time.Time `json:"nextRunAt" gorm:"column:next_run_at"`
	RunCount   int        `json:"runCount" gorm:"column:run_count;default:0"`
	CreatedAt  time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName 指定表名
func (ScheduleTask) TableName() string {
	return "schedule_tasks"
}

// ScheduleTaskHistory 定时任务执行历史
type ScheduleTaskHistory struct {
	ID             int        `json:"id" gorm:"primaryKey;autoIncrement"`
	TaskID         int        `json:"taskId" gorm:"column:task_id;index;not null"`
	RunAt          time.Time  `json:"runAt" gorm:"column:run_at"`
	Status         string     `json:"status" gorm:"column:status;size:20"` // success/failed/partial
	ProductsFound  int        `json:"productsFound" gorm:"column:products_found;default:0"`
	ProductsAdded  int        `json:"productsAdded" gorm:"column:products_added;default:0"`
	TopProducts    string     `json:"topProducts" gorm:"column:top_products;type:jsonb"` // JSON array of top products
	ErrorMessage   string     `json:"errorMessage" gorm:"column:error_message;type:text"`
	ExecutionTime  int        `json:"executionTime" gorm:"column:execution_time;default:0"` // 执行时间(毫秒)
	CreatedAt      time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
}

// TableName 指定表名
func (ScheduleTaskHistory) TableName() string {
	return "schedule_task_history"
}
