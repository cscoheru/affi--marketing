package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"github.com/zenconsult/affi-marketing/internal/config"
	"github.com/zenconsult/affi-marketing/internal/model"
	"github.com/zenconsult/affi-marketing/pkg/response"
)

// Claims JWT Claims
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.MapClaims
}

// AuthMiddleware 认证中间件
type AuthMiddleware struct {
	jwtSecret string
}

// NewAuthMiddleware 创建认证中间件
func NewAuthMiddleware(cfg config.JWTConfig) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: cfg.Secret,
	}
}

// Authenticate JWT 认证中间件
func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// 获取 Authorization header
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(ctx, http.StatusUnauthorized, "Authorization header required", nil)
			ctx.Abort()
			return
		}

		// 检查 Bearer token 格式
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(ctx, http.StatusUnauthorized, "Invalid authorization header format", nil)
			ctx.Abort()
			return
		}

		tokenString := parts[1]

		// 解析 Token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.jwtSecret), nil
		})

		if err != nil {
			response.Error(ctx, http.StatusUnauthorized, "Invalid or expired token", err)
			ctx.Abort()
			return
		}

		if !token.Valid {
			response.Error(ctx, http.StatusUnauthorized, "Invalid token", nil)
			ctx.Abort()
			return
		}

		// 获取 Claims
		claims, ok := token.Claims.(*Claims)
		if !ok {
			response.Error(ctx, http.StatusUnauthorized, "Invalid token claims", nil)
			ctx.Abort()
			return
		}

		// 检查是否为 refresh token
		if claims.MapClaims["type"] == "refresh" {
			response.Error(ctx, http.StatusUnauthorized, "Refresh token cannot be used for authentication", nil)
			ctx.Abort()
			return
		}

		// 将用户信息存入上下文
		ctx.Set("user_id", claims.UserID)
		ctx.Set("user_email", claims.Email)
		ctx.Set("user_role", claims.Role)

		ctx.Next()
	}
}

// RequireAdmin 需要管理员权限的中间件
func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// 先通过认证
		userRole := ctx.GetString("user_role")
		if userRole == "" {
			response.Error(ctx, http.StatusUnauthorized, "Authentication required", nil)
			ctx.Abort()
			return
		}

		// 检查是否为管理员
		if userRole != string(model.UserRoleAdmin) {
			response.Error(ctx, http.StatusForbidden, "Admin permission required", nil)
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// RequireRole 需要特定角色的中间件
func (m *AuthMiddleware) RequireRole(roles ...model.UserRole) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		userRole := ctx.GetString("user_role")
		if userRole == "" {
			response.Error(ctx, http.StatusUnauthorized, "Authentication required", nil)
			ctx.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		hasPermission := false
		for _, role := range roles {
			if userRole == string(role) {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			response.Error(ctx, http.StatusForbidden, "Insufficient permissions", nil)
			ctx.Abort()
			return
		}

		ctx.Next()
	}
}

// OptionalAuth 可选认证中间件（不强制要求认证）
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			// 没有 token，继续处理请求
			ctx.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			// 格式不对，继续处理请求
			ctx.Next()
			return
		}

		tokenString := parts[1]

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return []byte(m.jwtSecret), nil
		})

		if err != nil || !token.Valid {
			// token 无效，继续处理请求
			ctx.Next()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			ctx.Next()
			return
		}

		// 将用户信息存入上下文
		ctx.Set("user_id", claims.UserID)
		ctx.Set("user_email", claims.Email)
		ctx.Set("user_role", claims.Role)

		ctx.Next()
	}
}
