package middleware

import (
	"log"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/zenconsult/affi-marketing/internal/config"
)

// CORS 跨域中间件
func CORS(cfg config.CORSConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 调试日志
		log.Printf("[CORS] Request from: %s, Method: %s, Origin: %s", c.Request.RemoteAddr, c.Request.Method, origin)
		log.Printf("[CORS] AllowedOrigins: %v", cfg.AllowedOrigins)

		// 允许所有 localhost 开头的源（开发环境）
		allowed := false
		if origin != "" {
			// 检查是否在配置的允许列表中
			for _, allowedOrigin := range cfg.AllowedOrigins {
				if allowedOrigin == "*" || allowedOrigin == origin {
					allowed = true
					c.Header("Access-Control-Allow-Origin", origin)
					log.Printf("[CORS] Origin matched in allowed list: %s", allowedOrigin)
					break
				}
			}

			// 如果不在列表中，检查是否是 localhost（开发环境）
			if !allowed && strings.HasPrefix(origin, "http://localhost") {
				allowed = true
				c.Header("Access-Control-Allow-Origin", origin)
				log.Printf("[CORS] Origin allowed as localhost: %s", origin)
			}
		} else {
			// 没有 Origin 头部，允许通过
			allowed = true
			log.Printf("[CORS] No Origin header, allowing")
		}

		// 处理 OPTIONS 预检请求
		if c.Request.Method == "OPTIONS" {
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "*")
			c.Header("Access-Control-Allow-Methods", "*")
			c.Header("Access-Control-Max-Age", "86400")
			log.Printf("[CORS] OPTIONS request, returning 204")
			c.AbortWithStatus(204)
			return
		}

		// 对于有 Origin 的请求，检查是否允许
		if origin != "" && !allowed {
			log.Printf("[CORS] Origin NOT allowed: %s", origin)
			c.AbortWithStatusJSON(403, gin.H{"error": "origin not allowed", "origin": origin})
			return
		}

		// 添加其他 CORS 头部
		if origin != "" {
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		}

		log.Printf("[CORS] Request allowed, proceeding")
		c.Next()
	}
}
