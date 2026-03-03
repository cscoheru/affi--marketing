package cache

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/zenconsult/affi-marketing/internal/config"
)

var (
	client *redis.Client
)

// Init 初始化 Redis 客户端
func Init(cfg *config.RedisConfig) error {
	client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: cfg.PoolSize,
	})

	// 测试连接
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to redis: %w", err)
	}

	return nil
}

// Get 获取 Redis 客户端
func Get() *redis.Client {
	return client
}

// Close 关闭 Redis 连接
func Close() error {
	if client != nil {
		return client.Close()
	}
	return nil
}

// Cache 缓存操作封装
type Cache struct {
	client *redis.Client
}

// NewCache 创建缓存实例
func NewCache() *Cache {
	return &Cache{client: client}
}

// Get 获取缓存
func (c *Cache) Get(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, key).Result()
}

// Set 设置缓存
func (c *Cache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.client.Set(ctx, key, value, expiration).Err()
}

// Del 删除缓存
func (c *Cache) Del(ctx context.Context, keys ...string) error {
	return c.client.Del(ctx, keys...).Err()
}

// Exists 检查键是否存在
func (c *Cache) Exists(ctx context.Context, key string) (bool, error) {
	n, err := c.client.Exists(ctx, key).Result()
	return n > 0, err
}

// Incr 递增
func (c *Cache) Incr(ctx context.Context, key string) (int64, error) {
	return c.client.Incr(ctx, key).Result()
}

// GetInt 获取整数值
func (c *Cache) GetInt(ctx context.Context, key string) (int, error) {
	val, err := c.Get(ctx, key)
	if err != nil {
		return 0, err
	}
	return strconv.Atoi(val)
}

// SetInt 设置整数值
func (c *Cache) SetInt(ctx context.Context, key string, value int, expiration time.Duration) error {
	return c.Set(ctx, key, strconv.Itoa(value), expiration)
}

// HGet 获取哈希字段
func (c *Cache) HGet(ctx context.Context, key, field string) (string, error) {
	return c.client.HGet(ctx, key, field).Result()
}

// HSet 设置哈希字段
func (c *Cache) HSet(ctx context.Context, key, field, value string) error {
	return c.client.HSet(ctx, key, field, value).Err()
}

// HGetAll 获取所有哈希字段
func (c *Cache) HGetAll(ctx context.Context, key string) (map[string]string, error) {
	return c.client.HGetAll(ctx, key).Result()
}

// ZAdd 添加到有序集合
func (c *Cache) ZAdd(ctx context.Context, key string, score float64, member string) error {
	return c.client.ZAdd(ctx, key, redis.Z{Score: score, Member: member}).Err()
}

// ZRange 获取有序集合范围
func (c *Cache) ZRange(ctx context.Context, key string, start, stop int64) ([]string, error) {
	return c.client.ZRange(ctx, key, start, stop).Result()
}

// ZRevRangeWithScores 获取倒序范围（带分数）
func (c *Cache) ZRevRangeWithScores(ctx context.Context, key string, start, stop int64) ([]redis.Z, error) {
	return c.client.ZRevRangeWithScores(ctx, key, start, stop).Result()
}
