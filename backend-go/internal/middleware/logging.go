package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// Logging 日志中间件
func Logging(logger *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		clientIP := c.ClientIP()
		method := c.Request.Method
		userAgent := c.Request.UserAgent()

		entry := logger.With(
			zap.String("client_ip", clientIP),
			zap.String("method", method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", status),
			zap.Duration("latency", latency),
			zap.String("user_agent", userAgent),
		)

		if len(c.Errors) > 0 {
			entry.Error("Request completed with errors",
				zap.String("errors", c.Errors.String()))
		} else if status >= 400 {
			entry.Warn("Request completed with client/server error")
		} else {
			entry.Info("Request completed")
		}
	}
}
