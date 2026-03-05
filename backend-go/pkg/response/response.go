package response

import (
	"net/http"
	"time"
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
