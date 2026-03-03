# Affi-Marketing Backend API

Go 后端服务，支持插件化的商业模式测试与管理平台。

## 技术栈

- Go 1.21+
- Gin - Web 框架
- GORM - ORM
- PostgreSQL - 数据库
- Redis - 缓存
- Zap - 日志
- Viper - 配置管理

## 功能特性

- ✅ 插件系统架构
- ✅ 实验管理
- ✅ 追踪服务
- ✅ 归因引擎
- ✅ 结算服务
- ✅ 程序化 SEO 插件

## 项目结构

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
├── internal/
│   ├── config/                    # 配置
│   ├── plugin/                    # 插件接口
│   ├── model/                     # 数据模型
│   │   ├── experiment/
│   │   ├── tracking/
│   │   ├── attribution/
│   │   ├── settlement/
│   │   └── programmatic_seo/
│   ├── service/                   # 业务服务
│   │   ├── core/                 # 核心服务
│   │   └── plugins/              # 插件实现
│   ├── controller/                # HTTP 控制器
│   └── middleware/                # 中间件
├── pkg/                           # 公共包
│   ├── database/                  # 数据库
│   ├── cache/                     # 缓存
│   └── logger/                    # 日志
├── config/                        # 配置文件
├── go.mod                         # Go 模块
├── go.sum                         # 依赖锁
├── Dockerfile.railway             # Docker 配置
└── railway.toml                   # Railway 配置
```

## 快速开始

### 本地开发

```bash
# 安装依赖
go mod tidy

# 复制环境变量
cp .env.example .env

# 运行服务
go run cmd/server/main.go

# 服务将在 http://localhost:8080 启动
```

### 编译

```bash
# 构建
go build -o bin/server cmd/server/main.go

# 运行
./bin/server
```

## API 端点

### 健康检查

```
GET /health
```

### 实验管理

```
GET    /api/v1/experiments          # 列表
POST   /api/v1/experiments          # 创建
GET    /api/v1/experiments/:id      # 详情
PUT    /api/v1/experiments/:id      # 更新
DELETE /api/v1/experiments/:id      # 删除
POST   /api/v1/experiments/:id/start  # 启动
POST   /api/v1/experiments/:id/stop   # 停止
```

### 追踪服务

```
POST /api/v1/tracking/events      # 记录事件
GET  /api/v1/tracking/events/:id  # 查询事件
GET  /api/v1/tracking/events      # 事件列表
```

### 结算服务

```
GET  /api/v1/settlement/records        # 结算记录列表
POST /api/v1/settlement/records/:id/process  # 处理结算
GET  /api/v1/settlement/records/:id  # 结算详情
```

### 插件管理

```
GET    /api/v1/plugins             # 插件列表
GET    /api/v1/plugins/:id         # 插件详情
POST   /api/v1/plugins/:id/execute  # 执行插件
PUT    /api/v1/plugins/:id/config   # 更新配置
```

## 配置

### 环境变量

```bash
# 服务器
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
GIN_MODE=debug

# 数据库
DB_HOST=139.224.42.111
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=business_hub

# Redis
REDIS_HOST=139.224.42.111
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# AI 服务
AI_SERVICE_URL=http://ai-api.zenconsult.top
```

## 部署

### Railway

```bash
# 构建 Docker 镜像并推送到 Railway
railway up
```

### Docker

```bash
# 构建镜像
docker build -f Dockerfile.railway -t affi-marketing-backend .

# 运行容器
docker run -p 8080:8080 --env-file .env affi-marketing-backend
```

## 开发指南

### 添加新插件

1. 在 `internal/service/plugins/` 创建新目录
2. 实现 `Plugin` 接口
3. 在 `main.go` 中注册插件

```go
import "github.com/zenconsult/affi-marketing/internal/service/plugins/myplugin"

func main() {
    // ...
    pluginManager.Register(myplugin.NewMyPlugin(cfg))
}
```

### 添加新控制器

1. 在 `internal/controller/` 创建新目录
2. 实现 Controller 结构体
3. 注册路由

```go
import "github.com/zenconsult/affi-marketing/internal/controller/mycontroller"

func setupRouter(cfg *config.Config) *gin.Engine {
    router := gin.Default()

    v1 := router.Group("/api/v1")
    mycontroller.RegisterRoutes(v1)

    return router
}
```

## 许可证

MIT
