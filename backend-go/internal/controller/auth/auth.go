package auth

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/zenconsult/affi-marketing/internal/config"
	"github.com/zenconsult/affi-marketing/internal/model"
	"github.com/zenconsult/affi-marketing/pkg/response"
)

// Controller 认证控制器
type Controller struct {
	db  *gorm.DB
	cfg config.JWTConfig
}

// NewController 创建认证控制器
func NewController(db *gorm.DB, cfg config.JWTConfig) *Controller {
	return &Controller{
		db:  db,
		cfg: cfg,
	}
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Name     string `json:"name" binding:"required,min=2"`
	Password string `json:"password" binding:"required,min=6"`
}

// TokenResponse Token 响应
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// Claims JWT Claims
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.MapClaims
}

// generateToken 生成 JWT Token
func (c *Controller) generateToken(user model.User) (accessToken, refreshToken string, err error) {
	// Access Token
	now := time.Now()
	accessExpires := now.Add(c.cfg.Expiration)

	accessClaims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		MapClaims: jwt.MapClaims{
			"exp": accessExpires.Unix(),
			"iat": now.Unix(),
		},
	}

	accessTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessTokenObj.SignedString([]byte(c.cfg.Secret))
	if err != nil {
		return "", "", err
	}

	// Refresh Token
	refreshExpires := now.Add(c.cfg.RefreshExpiration)

	refreshClaims := Claims{
		UserID: user.ID,
		MapClaims: jwt.MapClaims{
			"exp": refreshExpires.Unix(),
			"iat": now.Unix(),
			"type": "refresh",
		},
	}

	refreshTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshTokenObj.SignedString([]byte(c.cfg.Secret))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

// Login 用户登录
func (c *Controller) Login(ctx *gin.Context) {
	var req LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, "Invalid request parameters", err)
		return
	}

	// 查找用户
	var user model.User
	if err := c.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			response.Error(ctx, http.StatusUnauthorized, "Invalid email or password", nil)
			return
		}
		response.Error(ctx, http.StatusInternalServerError, "Database error", err)
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		response.Error(ctx, http.StatusUnauthorized, "Invalid email or password", nil)
		return
	}

	// 检查用户状态
	if user.Status != model.UserStatusActive {
		response.Error(ctx, http.StatusForbidden, "User account is not active", nil)
		return
	}

	// 生成 Token
	accessToken, refreshToken, err := c.generateToken(user)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	// 更新最后登录时间
	now := time.Now()
	user.LastLogin = &now
	if err := c.db.Save(&user).Error; err != nil {
		// 不影响登录流程，只记录日志
		// logger.Error("Failed to update last login time", err)
	}

	response.Success(ctx, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(c.cfg.Expiration.Seconds()),
		TokenType:    "Bearer",
	})
}

// RefreshToken 刷新 Token
func (c *Controller) RefreshToken(ctx *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, "Invalid request parameters", err)
		return
	}

	// 验证 Refresh Token
	token, err := jwt.ParseWithClaims(req.RefreshToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(c.cfg.Secret), nil
	})

	if err != nil || !token.Valid {
		response.Error(ctx, http.StatusUnauthorized, "Invalid or expired refresh token", nil)
		return
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || claims.MapClaims["type"] != "refresh" {
		response.Error(ctx, http.StatusUnauthorized, "Invalid token type", nil)
		return
	}

	// 查找用户
	var user model.User
	if err := c.db.Where("id = ?", claims.UserID).First(&user).Error; err != nil {
		response.Error(ctx, http.StatusUnauthorized, "User not found", nil)
		return
	}

	// 检查用户状态
	if user.Status != model.UserStatusActive {
		response.Error(ctx, http.StatusForbidden, "User account is not active", nil)
		return
	}

	// 生成新的 Token
	accessToken, refreshToken, err := c.generateToken(user)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, "Failed to generate token", err)
		return
	}

	response.Success(ctx, TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(c.cfg.Expiration.Seconds()),
		TokenType:    "Bearer",
	})
}

// Logout 用户登出
func (c *Controller) Logout(ctx *gin.Context) {
	// 在无状态 JWT 架构中，登出主要在客户端处理
	// 这里返回成功响应，客户端应该删除存储的 Token
	// 如果需要实现服务器端登出，可以使用 Redis 存储 Token 黑名单

	response.Success(ctx, gin.H{
		"message": "Successfully logged out",
	})
}

// Register 用户注册
func (c *Controller) Register(ctx *gin.Context) {
	var req RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		response.Error(ctx, http.StatusBadRequest, "Invalid request parameters", err)
		return
	}

	// 检查邮箱是否已存在
	var existingUser model.User
	if err := c.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		response.Error(ctx, http.StatusConflict, "Email already registered", nil)
		return
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Error(ctx, http.StatusInternalServerError, "Failed to encrypt password", err)
		return
	}

	// 创建用户
	user := model.User{
		ID:       generateUserID(),
		Email:    req.Email,
		Name:     req.Name,
		Password: string(hashedPassword),
		Role:     model.UserRoleUser,
		Status:   model.UserStatusActive,
	}

	if err := c.db.Create(&user).Error; err != nil {
		response.Error(ctx, http.StatusInternalServerError, "Failed to create user", err)
		return
	}

	response.Success(ctx, gin.H{
		"id":      user.ID,
		"email":   user.Email,
		"name":    user.Name,
		"role":    user.Role,
		"message": "User registered successfully",
	})
}

// GetProfile 获取当前用户信息
func (c *Controller) GetProfile(ctx *gin.Context) {
	userID := ctx.GetString("user_id")

	var user model.User
	if err := c.db.Where("id = ?", userID).First(&user).Error; err != nil {
		response.Error(ctx, http.StatusNotFound, "User not found", nil)
		return
	}

	response.Success(ctx, user)
}

// generateUserID 生成用户ID
func generateUserID() string {
	return "user_" + strings.ReplaceAll(time.Now().Format("20060102150405.000000000"), ".", "")
}
