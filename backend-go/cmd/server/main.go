package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/zenconsult/affi-marketing/internal/config"
	"github.com/zenconsult/affi-marketing/internal/core"
	"github.com/zenconsult/affi-marketing/internal/middleware"
	"github.com/zenconsult/affi-marketing/internal/controller/auth"
	"github.com/zenconsult/affi-marketing/internal/controller/experiment"
	"github.com/zenconsult/affi-marketing/internal/controller/tracking"
	"github.com/zenconsult/affi-marketing/internal/controller/settlement"
	"github.com/zenconsult/affi-marketing/internal/controller/plugin"
	"github.com/zenconsult/affi-marketing/internal/controller/content"
	"github.com/zenconsult/affi-marketing/internal/controller/ai"
	"github.com/zenconsult/affi-marketing/internal/controller/health"
	"github.com/zenconsult/affi-marketing/pkg/cache"
	"github.com/zenconsult/affi-marketing/pkg/database"
	"github.com/zenconsult/affi-marketing/pkg/logger"
	aiservice "github.com/zenconsult/affi-marketing/internal/service/ai"
)

func main() {
	// 加载配置
	cfg, err := config.Load("")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化日志
	if err := logger.Init(&cfg.Log); err != nil {
		log.Fatalf("Failed to init logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting Affi-Marketing API Server",
		zap.String("version", "0.1.0"),
		zap.String("mode", cfg.Server.Mode))

	// Debug: 打印配置信息
	logger.Info("Config loaded",
		zap.String("db_host", cfg.Database.Host),
		zap.Int("db_port", cfg.Database.Port),
		zap.String("db_user", cfg.Database.User),
		zap.String("db_name", cfg.Database.DBName),
		zap.String("redis_host", cfg.Redis.Host),
		zap.Int("redis_port", cfg.Redis.Port))

	// 初始化数据库
	if err := database.Init(&cfg.Database); err != nil {
		logger.Fatal("Failed to init database", zap.Error(err))
	}
	defer database.Close()
	logger.Info("Database connected")

	// 初始化 Redis
	if err := cache.Init(&cfg.Redis); err != nil {
		logger.Warn("Failed to init Redis", zap.Error(err))
	} else {
		logger.Info("Redis connected")
	}
	defer cache.Close()

	// 设置 Gin 模式
	gin.SetMode(cfg.Server.Mode)

	// 创建路由
	router := setupRouter(cfg)

	// Railway compatibility: use PORT environment variable if provided
	port := cfg.Server.Port
	if envPort := os.Getenv("PORT"); envPort != "" {
		var portInt int
		if _, err := fmt.Sscanf(envPort, "%d", &portInt); err == nil {
			port = portInt
			logger.Info("Using Railway PORT environment variable",
				zap.String("raw_value", envPort),
				zap.Int("parsed_port", port))
		} else {
			logger.Warn("Failed to parse PORT env var",
				zap.String("value", envPort),
				zap.Error(err))
		}
	} else {
		logger.Info("No PORT environment variable, using config",
			zap.Int("port", port))
	}

	// 创建服务器
	srv := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, port),
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 启动服务器
	go func() {
		logger.Info("Server starting...",
			zap.String("address", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	// Wait for server to be ready
	logger.Info("Waiting for server to be ready...")
	time.Sleep(500 * time.Millisecond)
	logger.Info("Server started successfully",
		zap.String("address", srv.Addr),
		zap.String("healthcheck", "/health"))

	// 优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exited")
}

// setupRouter 设置路由
func setupRouter(cfg *config.Config) *gin.Engine {
	router := gin.New()

	// CORS 中间件需要在全局级别应用，以便处理 OPTIONS 预检请求
	router.Use(middleware.CORS(cfg.CORS))
	router.Use(middleware.Recovery(logger.L()))
	router.Use(middleware.RequestID())

	// 健康检查和根路径 (public routes, no middleware)
	healthHandler := health.NewHandler()
	router.GET("/health", func(c *gin.Context) {
		logger.Info("Healthcheck called", zap.String("path", c.Request.URL.Path))
		healthHandler.Check(c)
	})

	// 根端点（用于测试）
	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Affi-Marketing API",
			"version": "0.1.0",
			"status":  "running",
		})
	})

	// 获取数据库实例
	db := database.Get()

	// API v1 路由组 - 应用日志中间件
	v1 := router.Group("/api/v1")
	v1.Use(middleware.Logging(logger.L()))
	{
		// Auth controller
		authController := auth.NewController(db, cfg.JWT)
		authMiddleware := middleware.NewAuthMiddleware(cfg.JWT)

		// Auth routes (public)
		authGroup := v1.Group("/auth")
		{
			authGroup.POST("/login", authController.Login)
			authGroup.POST("/refresh", authController.RefreshToken)
			authGroup.POST("/logout", authController.Logout)
		}

		// Experiment controller
		experimentService := core.NewExperimentService(db)
		experimentController := experiment.NewExperimentController(experimentService)

		// Experiments routes (protected)
		experiments := v1.Group("/experiments")
		experiments.Use(authMiddleware.Authenticate())
		{
			experiments.GET("", experimentController.List)
			experiments.POST("", experimentController.Create)
			experiments.GET("/:id", experimentController.Get)
			experiments.PUT("/:id", experimentController.Update)
			experiments.DELETE("/:id", experimentController.Delete)
			experiments.POST("/:id/start", experimentController.Start)
			experiments.POST("/:id/stop", experimentController.Stop)
			experiments.POST("/:id/pause", experimentController.Pause)
		}

		// 追踪服务
		tracking.RegisterRoutes(v1, db)

		// 结算服务
		settlement.RegisterRoutes(v1, db)

		// 插件管理
		plugin.RegisterRoutes(v1)

		// 内容自动化系统
		content.RegisterRoutes(v1, db)

		// AI 内容生成服务
		aiClient := aiservice.NewClient(aiservice.Config{
			URL:     cfg.AIService.URL,
			Timeout: cfg.AIService.Timeout,
		})
		aiController := ai.NewController(aiClient)

		// AI routes (protected)
		aiRoutes := v1.Group("/ai")
		aiRoutes.Use(authMiddleware.Authenticate())
		{
			aiRoutes.POST("/generate-content", aiController.GenerateContent)
		}
	}

	return router
}
