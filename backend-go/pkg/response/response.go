package response

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// Response 统一响应格式
type Response struct {
	Success   bool        `json:"success"`
	Code      int         `json:"code"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Errors    []ErrorItem `json:"errors,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// ErrorItem 错误详情
type ErrorItem struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
}

// NewSuccessResponse 创建成功响应
func NewSuccessResponse(data interface{}) Response {
	return Response{
		Success:   true,
		Code:      200,
		Message:   "success",
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
}

// NewErrorResponse 创建错误响应
func NewErrorResponse(code int, message string, errors []ErrorItem) Response {
	return Response{
		Success:   false,
		Code:      code,
		Message:   message,
		Errors:    errors,
		Timestamp: time.Now().Unix(),
	}
}

// NewValidationErrorResponse 创建验证错误响应
func NewValidationErrorResponse(errors []ErrorItem) Response {
	return NewErrorResponse(422, "validation_error", errors)
}

// HTTP status code mapping
var StatusCodeMap = map[int]int{
	200: http.StatusOK,
	201: http.StatusCreated,
	202: http.StatusAccepted,
	400: http.StatusBadRequest,
	401: http.StatusUnauthorized,
	403: http.StatusForbidden,
	404: http.StatusNotFound,
	422: http.StatusUnprocessableEntity,
	429: http.StatusTooManyRequests,
	500: http.StatusInternalServerError,
	503: http.StatusServiceUnavailable,
}

// GetHTTPStatus 获取 HTTP 状态码
func GetHTTPStatus(code int) int {
	if status, ok := StatusCodeMap[code]; ok {
		return status
	}
	return http.StatusInternalServerError
}

// Success 发送成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, NewSuccessResponse(data))
}

// Error 发送错误响应
func Error(c *gin.Context, statusCode int, message string, err error) {
	resp := NewErrorResponse(statusCode, message, []ErrorItem{})
	if err != nil {
		// 可以在这里添加日志记录
		resp.Errors = []ErrorItem{
			{
				Message: err.Error(),
			},
		}
	}
	c.JSON(statusCode, resp)
}

// ValidationError 发送验证错误响应
func ValidationError(c *gin.Context, errors []ErrorItem) {
	c.JSON(http.StatusUnprocessableEntity, NewValidationErrorResponse(errors))
}
