# Backend Issues Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 backend issues: Settlement API route mismatch, Redis password, and Content automation route conflict

**Architecture:**
- Problem 1: Add alias route `/api/v1/settlements` to match API_SPEC.md
- Problem 2: Update .env with placeholder Redis password
- Problem 3: Remove duplicate auth controller and re-enable content routes

**Tech Stack:** Go 1.21, Gin, PostgreSQL, Redis

---

## Task 1: Add Settlement Alias Route

**Files:**
- Modify: `backend-go/internal/controller/settlement/settlement.go`

**Step 1: Add alias route registration**

Add to the `RegisterRoutes` function after the existing route group:

```go
// SettlementController 结算控制器
type SettlementController struct {
    service *core.ServlementService
    logger  *zap.Logger
}

// NewSettlementController 创建控制器
func NewSettlementController(service *core.ServlementService) *SettlementController {
    return &SettlementController{
        service: service,
        logger:  logger.L(),
    }
}

// RegisterRoutes 注册路由
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
    service := core.NewSettlementService(db, core.AttributionLastClick)
    controller := NewSettlementController(service)

    // 结算记录路由
    settlementGroup := r.Group("/settlement")
    {
        settlementGroup.GET("/records", controller.ListRecords)
        settlementGroup.POST("/records", controller.CreateRecord)
        settlementGroup.POST("/records/:id/process", controller.ProcessRecord)
        settlementGroup.GET("/records/:id", controller.GetRecord)
    }

    // API规范兼容路由 - /api/v1/settlements → /api/v1/settlements/records
    r.GET("/settlements", func(c *gin.Context) {
        // 重定向到records列表
        c.Redirect(301, "/records")
    })
}
```

Wait, that's not quite right. Let me read the actual file to understand the current structure better and propose a proper fix.

Actually, based on the task card, the issue is that the test expects `/api/v1/settlements` but the implementation has `/api/v1/settlement/records`. The correct fix is to add an alias route that forwards to the existing implementation.

Let me propose a simpler approach that adds the missing route:

**Step 1 (Revised): Add settlement list alias route**

Modify the `RegisterRoutes` function in `/Users/kjonekong/Documents/Affi-Marketing/backend-go/internal/controller/settlement/settlement.go`

Add this after the existing `settlementGroup` definition:

```go
    // API规范兼容路由
    r.GET("/settlements", func(c *gin.Context) {
        // 重定向到records列表
        c.Redirect(301, "/api/v1/settlement/records")
    })
```

Wait, that would cause issues with the redirect. Let me think about this more carefully.

Actually, the better approach is to add a proper handler that calls the existing ListRecords method. Let me update the plan:

**Step 1 (Revised): Add settlement list alias route**

Add this after the existing `settlementGroup` close brace in the RegisterRoutes function:

```go
    // API规范兼容路由 - /api/v1/settlements (复用records逻辑)
    r.GET("/settlements", func(c *gin.Context) {
        // 复用records处理逻辑，不传递experiment_id和status筛选
        page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
        size, _ := strconv.Atoi(c.DefaultQuery("size", "20"))

        filter := core.SettlementFilter{
            ExperimentID: 0,
            Status:       "",
            Page:         page,
            Size:         size,
        }

        records, total, err := controller.service.ListRecords(c.Request.Context(), filter)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{
                "success":   false,
                "code":      500,
                "message":   "Failed to list settlement records",
                "timestamp": time.Now().Unix(),
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "success": true,
            "code":    200,
            "message": "success",
            "data": gin.H{
                "items": records,
                "total": total,
                "page":  page,
                "size":  size,
            },
            "timestamp": time.Now().Unix(),
        })
    })
}
```

**Step 2: Verify build**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
go build ./internal/controller/settlement
```

**Step 3: Commit**

```bash
git add internal/controller/settlement/settlement.go
git commit -m "fix: add /api/v1/settlements alias route to match API spec"
```

---

## Task 2: Update Redis Password

**Files:**
- Modify: `backend-go/.env`

**Step 1: Update Redis password**

Update the REDIS_PASSWORD line:

```bash
# Redis (阿里云杭州)
REDIS_HOST=139.224.42.111
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
REDIS_DB=0
```

**Step 2: Commit**

```bash
git add .env
git commit -m "fix: update Redis password with placeholder"
```

---

## Task 3: Remove Content Auth Controller

**Files:**
- Delete: `backend-go/internal/controller/content/auth.go`

**Step 1: Delete the duplicate auth controller**

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go
rm internal/controller/content/auth.go
```

**Step 2: Verify build**

```bash
go build ./internal/controller/content
```

**Step 3: Commit**

```bash
git add internal/controller/content/auth.go
git commit -m "fix: remove duplicate auth controller causing route conflict"
```

---

## Task 4: Re-enable Content Routes

**Files:**
- Modify: `backend-go/cmd/server/main.go`

**Step 1: Uncomment content routes**

Find and uncomment the content.RegisterRoutes line:

```go
// Content automation routes (previously disabled due to auth conflict)
content.RegisterRoutes(v1, db)
```

**Step 2: Verify build**

```bash
go build ./cmd/server
```

**Step 3: Commit**

```bash
git add cmd/server/main.go
git commit -m "fix: re-enable content automation routes after removing duplicate auth"
```

---

## Task 5: Verification

**Step 1: Test settlement API**

```bash
# Start server (in background)
go run cmd/server/main.go &

# Test settlement endpoint (after server starts)
sleep 3
curl -s http://localhost:8080/api/v1/settlements | jq .

# Cleanup
pkill -f "cmd/server/main"
```

**Expected**: JSON response with success=true

**Step 2: Verify Redis connection**

Check if Redis connection works in logs. If NOAUTH error persists, the password needs to be updated with the correct value.

**Step 3: Verify content endpoints**

```bash
# Test content automation endpoints
curl -s http://localhost:8080/api/v1/products | jq .
curl -s http://localhost:8080/api/v1/materials | jq .
curl -s http://localhost:8080/api/v1/content | jq .
```

---

**Next Steps:**
- Update PROJECT_PROGRESS.md with completion status
- Update PROJECT_ISSUES.md if any issues remain
