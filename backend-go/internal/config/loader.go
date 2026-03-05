package config

import (
	"fmt"
	"strings"
	"sync"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

// splitString 分割字符串并去除空格
func splitString(s, sep string) []string {
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, sep)
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

var (
	globalConfig *Config
	once         sync.Once
)

// Load 加载配置文件
func Load(configPath string) (*Config, error) {
	var err error
	once.Do(func() {
		// 加载 .env 文件（如果存在）
		_ = godotenv.Load()
		_ = godotenv.Load("../.env")      // 尝试父目录
		_ = godotenv.Load("../../.env")   // 尝试上上级目录

		v := viper.New()

		// 设置配置文件路径
		if configPath != "" {
			v.SetConfigFile(configPath)
		} else {
			v.SetConfigName("config")
			v.SetConfigType("yaml")
			v.AddConfigPath(".")
			v.AddConfigPath("./config")
			v.AddConfigPath("../config")
		}

		// 设置环境变量 key 替换器
		v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
		v.AutomaticEnv()

		// 显式绑定关键环境变量（确保嵌套配置能正确读取）
		bindEnvVars(v)

		// 读取配置文件
		if err := v.ReadInConfig(); err != nil {
			// 如果配置文件不存在，使用环境变量
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				err = fmt.Errorf("failed to read config: %w", err)
				return
			}
		}

		// 设置默认值
		setDefaults(v)

		// 解析配置
		globalConfig = &Config{}
		err = v.Unmarshal(globalConfig)
		if err != nil {
			return
		}

		// 处理 CORS allowed_origins 字符串分割
		if originsStr := v.GetString("cors.allowed_origins"); originsStr != "" {
			// 如果是字符串，按逗号分割
			if len(globalConfig.CORS.AllowedOrigins) == 1 {
				// viper 可能读取为字符串，需要手动分割
				globalConfig.CORS.AllowedOrigins = splitString(originsStr, ",")
			}
		}
	})

	return globalConfig, err
}

// bindEnvVars 显式绑定环境变量到配置键
func bindEnvVars(v *viper.Viper) {
	// Server
	v.BindEnv("server.port", "SERVER_PORT")
	v.BindEnv("server.host", "SERVER_HOST")
	v.BindEnv("server.mode", "GIN_MODE")

	// Database
	v.BindEnv("database.host", "DATABASE_HOST")
	v.BindEnv("database.port", "DATABASE_PORT")
	v.BindEnv("database.user", "DATABASE_USER")
	v.BindEnv("database.password", "DATABASE_PASSWORD")
	v.BindEnv("database.db_name", "DATABASE_DB_NAME")
	v.BindEnv("database.ssl_mode", "DATABASE_SSL_MODE")
	v.BindEnv("database.max_open_conns", "DATABASE_MAX_OPEN_CONNS")
	v.BindEnv("database.max_idle_conns", "DATABASE_MAX_IDLE_CONNS")
	v.BindEnv("database.conn_max_lifetime", "DATABASE_CONN_MAX_LIFETIME")

	// Redis
	v.BindEnv("redis.host", "REDIS_HOST")
	v.BindEnv("redis.port", "REDIS_PORT")
	v.BindEnv("redis.password", "REDIS_PASSWORD")
	v.BindEnv("redis.db", "REDIS_DB")
	v.BindEnv("redis.pool_size", "REDIS_POOL_SIZE")

	// JWT
	v.BindEnv("jwt.secret", "JWT_SECRET")
	v.BindEnv("jwt.expiration", "JWT_EXPIRATION")
	v.BindEnv("jwt.refresh_expiration", "JWT_REFRESH_EXPIRATION")

	// MinIO
	v.BindEnv("minio.endpoint", "MINIO_ENDPOINT")
	v.BindEnv("minio.access_key", "MINIO_ACCESS_KEY")
	v.BindEnv("minio.secret_key", "MINIO_SECRET_KEY")
	v.BindEnv("minio.bucket", "MINIO_BUCKET")
	v.BindEnv("minio.use_ssl", "MINIO_USE_SSL")

	// AI Service
	v.BindEnv("ai_service.url", "AI_SERVICE_URL")
	v.BindEnv("ai_service.timeout", "AI_SERVICE_TIMEOUT")

	// CORS
	v.BindEnv("cors.allowed_origins", "CORS_ALLOWED_ORIGINS")
	v.BindEnv("cors.allowed_methods", "CORS_ALLOWED_METHODS")
	v.BindEnv("cors.allowed_headers", "CORS_ALLOWED_HEADERS")

	// Logging
	v.BindEnv("log.level", "LOG_LEVEL")
	v.BindEnv("log.output", "LOG_OUTPUT")
	v.BindEnv("log.format", "LOG_FORMAT")

	// Plugin
	v.BindEnv("plugin.timeout", "PLUGIN_TIMEOUT")
	v.BindEnv("plugin.max_memory", "PLUGIN_MAX_MEMORY")
}

// setDefaults 设置默认配置值
func setDefaults(v *viper.Viper) {
	// Server defaults
	v.SetDefault("server.port", 8080)
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.mode", "debug")

	// Database defaults
	v.SetDefault("database.ssl_mode", "require")
	v.SetDefault("database.max_open_conns", 100)
	v.SetDefault("database.max_idle_conns", 10)

	// Redis defaults
	v.SetDefault("redis.pool_size", 10)

	// JWT defaults
	v.SetDefault("jwt.expiration", "24h")
	v.SetDefault("jwt.refresh_expiration", "168h")

	// CORS defaults
	v.SetDefault("cors.allowed_methods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	v.SetDefault("cors.allowed_headers", []string{"*"})
	v.SetDefault("cors.allowed_origins", []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:5173", "http://localhost:8080"})

	// Log defaults
	v.SetDefault("log.level", "info")
	v.SetDefault("log.output", "stdout")
	v.SetDefault("log.format", "json")

	// Plugin defaults
	v.SetDefault("plugin.timeout", "30s")
}

// Get 获取全局配置
func Get() *Config {
	if globalConfig == nil {
		// 尝试加载默认配置
		cfg, err := Load("")
		if err != nil {
			// 返回最小可用配置
			return &Config{
				Server: ServerConfig{
					Port: 8080,
					Host: "0.0.0.0",
					Mode: "debug",
				},
			}
		}
		return cfg
	}
	return globalConfig
}

// MustGet 获取配置，如果未初始化则 panic
func MustGet() *Config {
	cfg := Get()
	if cfg == nil {
		panic("config not initialized")
	}
	return cfg
}
