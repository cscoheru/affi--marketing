package config

import (
	"fmt"
	"strings"
	"sync"

	"github.com/spf13/viper"
)

var (
	globalConfig *Config
	once         sync.Once
)

// Load 加载配置文件
func Load(configPath string) (*Config, error) {
	var err error
	once.Do(func() {
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

		// 读取环境变量
		v.AutomaticEnv()
		v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

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
	})

	return globalConfig, err
}

// setDefaults 设置默认配置值
func setDefaults(v *viper.Viper) {
	// Server defaults
	v.SetDefault("server.port", 8080)
	v.SetDefault("server.host", "0.0.0.0")
	v.SetDefault("server.mode", "debug")

	// Database defaults
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
