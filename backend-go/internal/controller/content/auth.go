package content

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/model/content"
	"github.com/zenconsult/affi-marketing/pkg/logger"
)

// AuthController 认证控制器
type AuthController struct {
	db *gorm.DB
}

// NewAuthController 创建认证控制器
func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{db: db}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	AccessToken string      `json:"access_token"`
	User        content.User `json:"user"`
}

// RegisterRoutes 注册路由
func (c *AuthController) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/login", c.Login)
		auth.POST("/logout", c.Logout)
		auth.POST("/refresh", c.Refresh)
		auth.GET("/me", c.GetMe)
	}
}

// Login 用户登录
func (c *AuthController) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 查找用户
	var user content.User
	if err := c.db.Where("email = ? AND status = ?", req.Email, "active").First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		logger.Error("Failed to get user", zap.Error(err))
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
		return
	}

	// 验证密码（实际实现中应该使用 bcrypt）
	// TODO: 实现正确的密码验证
	if req.Password == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
		return
	}

	// 生成访问令牌（简化版，实际应该使用 JWT）
	accessToken := fmt.Sprintf("token_%d_%d", user.ID, time.Now().Unix())

	logger.Info("User logged in", zap.Int("userId", user.ID), zap.String("email", user.Email))

	ctx.JSON(http.StatusOK, LoginResponse{
		AccessToken: accessToken,
		User:        user,
	})
}

// Logout 用户登出
func (c *AuthController) Logout(ctx *gin.Context) {
	// 在实际实现中，应该将令牌加入黑名单或删除
	ctx.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// Refresh 刷新令牌
func (c *AuthController) Refresh(ctx *gin.Context) {
	// 在实际实现中，应该验证旧令牌并生成新令牌
	ctx.JSON(http.StatusOK, gin.H{"message": "Token refreshed"})
}

// GetMe 获取当前用户信息
func (c *AuthController) GetMe(ctx *gin.Context) {
	// 从 Authorization header 获取用户信息
	// 在实际实现中，应该解析 JWT 令牌
	authorization := ctx.GetHeader("Authorization")
	if authorization == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
		return
	}

	// 简化版：返回演示用户
	// 实际实现中应该从令牌中解析用户 ID
	demoUser := content.User{
		ID:        1,
		Email:     "demo@example.com",
		Name:      "Demo User",
		Role:      "admin",
		Status:    "active",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	ctx.JSON(http.StatusOK, demoUser)
}
