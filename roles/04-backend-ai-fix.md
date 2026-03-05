# 修改任务卡: 04-后端与AI工程师 - API修复与重构

**分配日期**: 2026-03-05
**优先级**: 🔴 高 + 🟡 中
**预计时间**: 3-4小时
**来源**: TEST_REPORT.md - 后端API连接测试

---

## 📊 问题概览

| 问题ID | 优先级 | 描述 | 状态 |
|--------|--------|------|------|
| BE-03 | 🔴 高 | 追踪/结算API返回404 | 待修复 |
| BE-02 | 🟡 中 | Redis密码错误 | 待修复 |
| BE-04 | 🟡 中 | content自动化API被临时禁用 | 待重构 |

---

## 🔴 问题1: 追踪/结算API返回404 (BE-03)

### 问题描述
```
GET /api/v1/tracking/events → 404 Not Found
GET /api/v1/settlements → 404 Not Found
```

### 原因分析
路由可能未完全实现或未注册。

### 修复步骤

#### 步骤1: 检查路由定义

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go

# 检查tracking路由
grep -r "RegisterRoutes" internal/controller/tracking/
grep -r "tracking" cmd/server/main.go

# 检查settlement路由
grep -r "RegisterRoutes" internal/controller/settlement/
grep -r "settlement" cmd/server/main.go
```

#### 步骤2: 注册缺失的路由

**文件**: `backend-go/cmd/server/main.go`

```go
// 确保这些路由被注册
import (
    "github.com/yourusername/affi-marketing/backend-go/internal/controller/tracking"
    "github.com/yourusername/affi-marketing/backend-go/internal/controller/settlement"
)

func main() {
    // ... 现有代码 ...

    // 注册追踪服务路由
    tracking.RegisterRoutes(v1, db)

    // 注册结算服务路由
    settlement.RegisterRoutes(v1, db)

    // ... 现有代码 ...
}
```

#### 步骤3: 实现缺失的控制器

**文件**: `backend-go/internal/controller/tracking/controller.go`

```go
package tracking

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
    r.GET("/tracking/events", getEvents)
    r.POST("/tracking/events", createEvent)
}

func getEvents(c *gin.Context) {
    // 实现获取事件列表逻辑
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "code": 200,
        "message": "success",
        "data": []interface{}{},
    })
}

func createEvent(c *gin.Context) {
    // 实现创建事件逻辑
    c.JSON(http.StatusCreated, gin.H{
        "success": true,
        "code": 201,
        "message": "Event created",
        "data": nil,
    })
}
```

**文件**: `backend-go/internal/controller/settlement/controller.go`

```go
package settlement

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
    r.GET("/settlements", getSettlements)
    r.GET("/settlements/:id", getSettlement)
}

func getSettlements(c *gin.Context) {
    // 实现获取结算记录列表逻辑
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "code": 200,
        "message": "success",
        "data": []interface{}{},
    })
}

func getSettlement(c *gin.Context) {
    // 实现获取单个结算记录逻辑
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "code": 200,
        "message": "success",
        "data": nil,
    })
}
```

#### 步骤4: 验证修复

```bash
# 重新编译并运行
cd backend-go
go run cmd/server/main.go

# 测试API
curl http://localhost:8080/api/v1/tracking/events
curl http://localhost:8080/api/v1/settlements
```

---

## 🟡 问题2: Redis密码错误 (BE-02)

### 问题描述
```
Redis连接失败: NOAUTH Authentication required
```

### 修复步骤

#### 步骤1: 检查当前环境变量

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/backend-go

# 检查.env文件
cat .env | grep REDIS
```

#### 步骤2: 更新Redis密码

**文件**: `backend-go/.env`

```bash
# 根据实际Redis配置更新
REDIS_HOST=139.224.42.111
REDIS_PORT=6379
REDIS_PASSWORD=your_actual_redis_password
REDIS_DB=0
```

#### 步骤3: 验证连接

```bash
# 使用redis-cli测试连接
redis-cli -h 139.224.42.111 -p 6379 -a your_actual_redis_password PING

# 应该返回: PONG
```

---

## 🟡 问题3: content自动化API被临时禁用 (BE-04)

### 问题描述
```
content auth 与主 auth 路由冲突
content.RegisterRoutes 被临时注释掉
导致产品、素材、内容、发布、分析API不可用
```

### 修复方案: 重构内容自动化系统

#### 步骤1: 分析冲突原因

**文件**: `backend-go/internal/controller/content/auth.go`

问题: content包有自己的auth控制器，与主auth控制器路由冲突。

#### 步骤2: 重构方案

**方案A: 移除重复的auth控制器**

```bash
# 删除content/auth.go
rm backend-go/internal/controller/content/auth.go

# 更新content/routes.go
```

**方案B: 重命名content的auth端点**

```go
// 文件: backend-go/internal/controller/content/auth.go

// 原路由
POST /api/v1/auth/login → POST /api/v1/content/auth/login

// 修改注册
func RegisterRoutes(r *gin.RouterGroup, db *gorm.DB) {
    auth := r.Group("/content/auth")
    {
        auth.POST("/login", contentLoginHandler)
        auth.POST("/refresh", contentRefreshHandler)
    }
}
```

#### 步骤3: 重新启用content路由

**文件**: `backend-go/cmd/server/main.go`

```go
// 取消注释
content.RegisterRoutes(v1, db)
```

#### 步骤4: 测试所有端点

```bash
# 测试content API
curl http://localhost:8080/api/v1/products
curl http://localhost:8080/api/v1/materials
curl http://localhost:8080/api/v1/content
curl http://localhost:8080/api/v1/publish
curl http://localhost:8080/api/v1/analytics
```

---

## ✅ 完成标准

### 问题1 (追踪/结算API)
- [ ] `/api/v1/tracking/events` 返回200
- [ ] `/api/v1/settlements` 返回200
- [ ] API返回正确的JSON格式

### 问题2 (Redis)
- [ ] Redis连接成功
- [ ] 无NOAUTH错误

### 问题3 (content自动化)
- [ ] content路由已启用
- [ ] 无路由冲突
- [ ] 所有content API可访问

---

## 📝 完成顺序建议

1. **先修复问题1** (追踪/结算API) - 高优先级
2. **再修复问题2** (Redis密码) - 中优先级
3. **最后修复问题3** (content重构) - 中优先级，需要更多时间

---

## 🔍 测试验证

修复完成后，重新运行API连接测试：

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm run test:api
```

---

**分配人**: 项目经理
**审核人**: 05-集成测试与部署
