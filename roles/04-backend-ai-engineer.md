# 角色任务卡: 后端与AI工程师 (Backend & AI Engineer)

> **角色**: 后端与AI工程师
> **项目**: Affi-Marketing 后端服务与AI集成
> **工期**: 10-14天
> **优先级**: 🔴 高
> **依赖**: 01-系统架构师完成架构设计

---

## 🎯 任务目标

实现Go后端API服务和Python AI服务的集成，为前端提供完整的业务逻辑和AI内容生成能力。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/COLLABORATION.md` | 协作机制 |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/docs/ARCHITECTURE.md` | 系统架构 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/docs/API_SPEC.md` | API接口规范 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/docs/DATA_MODELS.md` | 数据模型 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/docs/PLUGIN_SYSTEM.md` | 插件系统设计 |
| 6 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 了解其他角色进度 |

**重要**: 确认01-架构师的文档已完成，再开始工作。

---

## 📁 你的工作目录

```
Affi-Marketing/
│
├── backend-go/               ← 你需要创建 (Go后端)
│   ├── cmd/server/main.go    ← 应用入口
│   ├── go.mod
│   ├── internal/
│   │   ├── config/           ← 配置管理
│   │   ├── model/            ← 数据模型
│   │   ├── controller/       ← HTTP控制器
│   │   ├── service/          ← 业务服务
│   │   │   ├── core/         ← 核心业务
│   │   │   ├── plugin/       ← 插件系统
│   │   │   └── plugins/      ← 插件实现
│   │   └── middleware/       ← 中间件
│   ├── pkg/
│   │   ├── database/         ← 数据库层
│   │   ├── cache/            ← Redis缓存
│   │   └── logger/           ← 日志系统
│   ├── Dockerfile
│   └── railway.toml
│
└── ai-service/               ← 你需要创建 (Python AI服务)
    ├── app/
    │   ├── main.py           ← FastAPI入口
    │   ├── services/
    │   │   ├── manager.py    ← AI服务管理器
    │   │   ├── adapters/     ← 模型适配器
    │   │   ├── seo/          ← SEO内容生成
    │   │   └── affiliate/    ← 联盟链接服务
    │   └── prompts/          ← 提示词模板
    ├── requirements.txt
    └── Dockerfile
```

---

## 🔧 后端开发任务 (Go)

### 任务1: 项目初始化 (Day 1)

```bash
cd /Users/kjonekong/Documents/Affi-Marketing
mkdir -p backend-go
cd backend-go
go mod init github.com/cscoheru/affi-marketing
```

### 任务2: 核心框架搭建 (Day 1-2)

#### 2.1 配置管理
**文件**: `backend-go/internal/config/config.go`

```go
package config

import (
    "os"
    "time"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    AI       AIConfig
}

type ServerConfig struct {
    Port         int           `env:"SERVER_PORT" envDefault:"8080"`
    ReadTimeout  time.Duration `env:"READ_TIMEOUT" envDefault:"10s"`
    WriteTimeout time.Duration `env:"WRITE_TIMEOUT" envDefault:"10s"`
}

type DatabaseConfig struct {
    Host     string `env:"DB_HOST,required"`
    Port     int    `env:"DB_PORT" envDefault:"5432"`
    User     string `env:"DB_USER,required"`
    Password string `env:"DB_PASSWORD,required"`
    DBName   string `env:"DB_NAME,required"`
}

type AIConfig struct {
    ServiceURL    string        `env:"AI_SERVICE_URL"`
    Timeout       time.Duration `env:"AI_TIMEOUT" envDefault:"30s"`
    MaxRetries    int           `env:"AI_MAX_RETRIES" envDefault:"3"`
}
```

#### 2.2 数据库层
**文件**: `backend-go/pkg/database/postgres.go`

```go
package database

import (
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
)

func NewPostgres(dsn string) (*gorm.DB, error) {
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

#### 2.3 路由配置
**文件**: `backend-go/cmd/server/main.go`

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/cscoheru/affi-marketing/internal/controller"
)

func main() {
    r := gin.Default()

    // API路由
    v1 := r.Group("/api/v1")
    {
        // 实验管理
        experiments := v1.Group("/experiments")
        {
            experiments.GET("", controller.ListExperiments)
            experiments.POST("", controller.CreateExperiment)
            experiments.GET("/:id", controller.GetExperiment)
        }

        // AI内容生成
        ai := v1.Group("/ai")
        {
            ai.POST("/generate", controller.GenerateContent)
        }
    }

    r.Run(":8080")
}
```

### 任务3: 核心业务逻辑 (Day 3-6)

#### 3.1 实验管理服务
**文件**: `backend-go/internal/service/core/experiment.go`

```go
package core

type ExperimentService struct {
    db *gorm.DB
}

func (s *ExperimentService) Create(req CreateExperimentRequest) (*Experiment, error) {
    // 创建实验逻辑
}

func (s *ExperimentService) UpdateStatus(id int64, status string) error {
    // 更新状态逻辑
}
```

#### 3.2 AI服务集成
**文件**: `backend-go/internal/service/ai/client.go`

```go
package ai

import (
    "bytes"
    "encoding/json"
    "net/http"
)

type AIClient struct {
    baseURL    string
    httpClient *http.Client
}

func (c *AIClient) GenerateContent(req ContentRequest) (*ContentResponse, error) {
    // 调用AI服务
}
```

---

## 🤖 AI服务开发任务 (Python)

### 任务4: AI服务框架搭建 (Day 2-3)

#### 4.1 FastAPI应用
**文件**: `ai-service/app/main.py`

```python
from fastapi import FastAPI
from app.services.manager import AIManager

app = FastAPI(title="Affi-Marketing AI Service")
ai_manager = AIManager()

@app.post("/api/v1/generate-content")
async def generate_content(request: ContentRequest):
    return await ai_manager.generate_content(request)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### 任务5: 多模型适配器 (Day 4-5)

**文件**: `ai-service/app/services/adapters/qwen_adapter.py`

```python
import dashscope
from app.services.adapters.base import BaseAdapter

class QwenAdapter(BaseAdapter):
    def __init__(self, api_key: str):
        dashscope.api_key = api_key

    async def generate(self, prompt: str, **kwargs) -> str:
        response = dashscope.Generation.call(
            model='qwen-turbo',
            prompt=prompt
        )
        return response.output.text
```

### 任务6: SEO内容生成 (Day 6-7)

**文件**: `ai-service/app/services/seo/content_generator.py`

```python
class ContentGenerator:
    async def generate_seo_article(
        self,
        keyword: str,
        target_length: int = 1000
    ) -> dict:
        # 1. 关键词分析
        # 2. 大纲生成
        # 3. 内容生成
        # 4. SEO优化
        pass
```

---

## 🔌 后端与AI集成 (Day 8-9)

### 任务7: 服务间通信

**后端调用AI服务**:
```go
// backend-go/internal/service/ai/client.go
func (c *AIClient) GenerateContent(ctx context.Context, keyword string) (string, error) {
    req := map[string]interface{}{
        "keyword": keyword,
        "type": "seo_article",
    }

    resp, err := c.httpClient.Post(
        c.baseURL+"/api/v1/generate-content",
        "application/json",
        bytes.NewReader(marshal(req)),
    )

    // 处理响应...
}
```

---

## ✅ 完成标准

### 后端部分
- [ ] Go项目可编译运行
- [ ] 所有API端点可访问
- [ ] 数据库连接正常
- [ ] Redis缓存正常工作
- [ ] AI服务调用成功

### AI部分
- [ ] FastAPI服务可运行
- [ ] 至少支持2个AI模型
- [ ] 内容生成功能正常
- [ ] 成本监控正常
- [ ] API响应时间 < 5秒

### 集成部分
- [ ] 后端可成功调用AI服务
- [ ] 错误处理完善
- [ ] 日志记录完整
- [ ] 超时重试机制正常

---

## 📤 交付物

完成后，更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 04-后端与AI工程师
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- backend-go/cmd/server/main.go: Go后端入口
- backend-go/internal/controller/: API控制器
- backend-go/internal/service/: 业务服务
- backend-go/pkg/database/: 数据库层
- ai-service/app/main.py: AI服务入口
- ai-service/app/services/: AI服务实现

**API端点**:
- GET /api/v1/experiments - 实验列表
- POST /api/v1/experiments - 创建实验
- POST /api/v1/ai/generate - AI内容生成

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [04-后端与AI] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要01-架构师确认: (具体问题)
- [ ] 需要02-React前端配合: (具体问题)

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 📞 协作提示

1. **02-React前端** 需要你的API文档才能对接
2. **03-Vue迁移** 可能需要了解用户认证接口
3. 完成后通知项目经理，更新项目进度

---

## 🚀 快速启动

```bash
# 后端
cd backend-go
go run cmd/server/main.go

# AI服务
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

**任务卡版本**: v1.0
**创建时间**: 2026-03-05

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/04-backend-ai-engineer.md"
