package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler handles health check requests
type Handler struct{}

// NewHandler creates a new health check handler
func NewHandler() *Handler {
	return &Handler{}
}

// Check handles the health check endpoint
func (h *Handler) Check(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "affi-marketing-api",
		"version": "0.1.0",
	})
}
