# 角色任务卡: 后端工程师 (Backend Engineer)

## 角色信息
- **角色ID**: 05-backend
- **角色名称**: 后端工程师
- **预计时长**: 32 小时
- **主要职责**: Go后端开发、API实现、业务逻辑

## 核心任务

### 1. 项目初始化 (4h)
- Go模块初始化
- 目录结构创建
- 依赖安装
- 配置管理

**输出**: `backend-go/` 项目框架

### 2. 核心框架 (6h)

#### 2.1 配置管理
- 配置文件解析
- 环境变量管理
- 配置热加载

**输出**: `internal/config/config.go`

#### 2.2 数据库层
- GORM 初始化
- 连接池管理
- 数据库迁移集成

**输出**: `pkg/database/postgres.go`

#### 2.3 Redis客户端
- Redis 初始化
- 缓存封装

**输出**: `pkg/cache/redis.go`

#### 2.4 日志系统
- Zap logger 配置
- 日志轮转

**输出**: `pkg/logger/logger.go`

### 3. 插件系统 (6h)

根据架构师的插件系统设计实现：

- 插件接口定义
- 插件上下文
- 插件管理器
- 插件注册表
- 插件执行器

**输出**:
- `internal/plugin/plugin.go`
- `internal/plugin/context.go`
- `internal/service/plugin/manager.go`

### 4. 核心业务逻辑 (8h)

#### 4.1 实验管理
- 实验CRUD
- 实验状态机
- 实验生命周期管理

**输出**:
- `internal/model/experiment/experiment.go`
- `internal/service/core/experiment.go`
- `internal/controller/experiment/experiment.go`

#### 4.2 追踪服务
- 追踪事件记录
- 追踪ID生成
- 事件查询

**输出**:
- `internal/service/core/tracking.go`
- `internal/controller/tracking/tracking.go`

#### 4.3 归因引擎
- 最后点击归因
- 线性归因
- 时间衰减归因

**输出**: `internal/service/core/attribution.go`

#### 4.4 结算服务
- 佣金计算
- 结算记录生成
- 结算状态管理

**输出**:
- `internal/service/core/settlement.go`
- `internal/controller/settlement/settlement.go`

### 5. 第一个插件实现 (6h)

实现程序化SEO + 联盟营销插件：

- 关键词管理
- 内容任务管理
- 链接管理

**输出**:
- `internal/service/plugins/programmatic_seo/plugin.go`
- `internal/service/plugins/programmatic_seo/keyword.go`
- `internal/service/plugins/programmatic_seo/content.go`

### 6. API路由 (2h)

配置Gin路由：
- 中间件配置
- 路由分组
- 错误处理

**输出**: `cmd/server/main.go`

## 输入依赖

- [x] 架构师提供的接口规范
- [x] 数据库工程师提供的表结构
- [x] AI工程师提供的AI服务接口

## 交付产物

| 文件 | 描述 |
|------|------|
| `backend-go/go.mod` | Go模块 |
| `backend-go/cmd/server/main.go` | 应用入口 |
| `backend-go/internal/plugin/` | 插件系统 |
| `backend-go/internal/model/` | 数据模型 |
| `backend-go/internal/service/` | 业务服务 |
| `backend-go/internal/controller/` | HTTP控制器 |
| `backend-go/pkg/` | 公共包 |
| `backend-go/Dockerfile.railway` | 部署文件 |
| `backend-go/railway.toml` | Railway配置 |

## 技术栈

- Go 1.21+
- Gin (Web框架)
- GORM (ORM)
- Zap (日志)
- Viper (配置)
- Redis (缓存)

## API端点

### 实验
- `GET /api/v1/experiments` - 列表
- `GET /api/v1/experiments/:id` - 详情
- `POST /api/v1/experiments` - 创建
- `PUT /api/v1/experiments/:id` - 更新
- `DELETE /api/v1/experiments/:id` - 删除
- `POST /api/v1/experiments/:id/start` - 启动
- `POST /api/v1/experiments/:id/stop` - 停止

### 插件
- `GET /api/v1/plugins` - 列表
- `GET /api/v1/plugins/:id` - 详情
- `POST /api/v1/plugins/:id/execute` - 执行

### 追踪
- `POST /api/v1/tracking/events` - 记录事件
- `GET /api/v1/tracking/events/:id` - 查询事件

## 开发环境

```bash
# 运行
cd backend-go
go run cmd/server/main.go

# 构建
go build -o bin/server cmd/server/main.go

# 测试
go test ./...
```

## 部署

使用 Railway 部署，详见部署工程师任务卡。

## 验证清单

- [ ] 代码编译通过
- [ ] 所有API可访问
- [ ] 插件系统正常工作
- [ ] 数据库操作正常
- [ ] 日志正常输出

---

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/05-backend.md"
