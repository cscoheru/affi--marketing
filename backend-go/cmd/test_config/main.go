package main

import (
	"fmt"
	"log"
	"os"

	"github.com/zenconsult/affi-marketing/internal/config"
)

func main() {
	// 打印所有环境变量（用于调试）
	fmt.Println("=== Environment Variables ===")
	for _, env := range []string{
		"DATABASE_HOST", "DATABASE_PORT", "DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_DB_NAME",
		"REDIS_HOST", "REDIS_PORT", "REDIS_PASSWORD",
		"JWT_SECRET",
	} {
		fmt.Printf("%s=%q\n", env, os.Getenv(env))
	}
	fmt.Println()

	// 加载配置
	cfg, err := config.Load("")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 打印配置值
	fmt.Println("=== Loaded Config ===")
	fmt.Printf("Server: %+v\n", cfg.Server)
	fmt.Printf("Database: Host=%q Port=%d User=%q Password=%q DBName=%q\n",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User, cfg.Database.Password, cfg.Database.DBName)
	fmt.Printf("Redis: Host=%q Port=%d\n", cfg.Redis.Host, cfg.Redis.Port)
	fmt.Printf("JWT: Secret=%q\n", cfg.JWT.Secret)
}
