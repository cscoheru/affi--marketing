package database

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/zenconsult/affi-marketing/internal/config"
	"github.com/zenconsult/affi-marketing/internal/model"
	contentModel "github.com/zenconsult/affi-marketing/internal/model/content"
)

var (
	db *gorm.DB
)

// Init 初始化数据库连接
func Init(cfg *config.DatabaseConfig) error {
	var err error

	// 配置 GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)

	// 构建 DSN
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.SSLMode,
	)

	// Debug: 打印 DSN (不包含密码)
	fmt.Printf("Connecting to database: host=%s port=%d user=%s dbname=%s password_len=%d\n",
		cfg.Host, cfg.Port, cfg.User, cfg.DBName, len(cfg.Password))

	// 连接数据库
	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// 配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(time.Second * cfg.ConnMaxLifetime)

	// 测试连接
	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	return nil
}

// Get 获取数据库实例
func Get() *gorm.DB {
	return db
}

// Close 关闭数据库连接
func Close() error {
	if db != nil {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// NewPostgres 创建 PostgreSQL 连接
func NewPostgres(cfg config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	}

	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	return db, nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&model.Experiment{},
		&model.User{},
		&model.APIKey{},
		// Content automation models
		&contentModel.Product{},
		&contentModel.Material{},
		&contentModel.Content{},
		&contentModel.PublishTask{},
		&contentModel.MaterialCollectTask{},
		&contentModel.ContentGenerateTask{},
		&contentModel.ProductAIInfo{},
		&contentModel.MaterialAIReview{},
		&contentModel.ContentGenerationJob{},
		&contentModel.ContentWorkflow{},
	)
}
