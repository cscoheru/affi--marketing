# Railway 部署问题解决指南

本文档记录在 Railway 平台部署 Affi-Marketing 项目 AI Service 时遇到的实际问题及解决方案，供团队学习和参考。

## 目录

- [问题1: CORS 验证错误](#问题1-cors-验证错误)
- [问题2: 404 Application Not Found](#问题2-404-application-not-found)
- [问题3: 服务无法构建](#问题3-服务无法构建)
- [问题4: 环境变量格式问题](#问题4-环境变量格式问题)
- [Railway 最佳实践](#railway-最佳实践)
- [调试技巧](#调试技巧)

---

## 问题1: CORS 验证错误

### 症状

部署日志显示以下错误：

```
pydantic_settings.PydanticBaseSettingsError: Error parsing env var 'CORS_ORIGINS'
No explicit decoder found for type '<class 'list'>' and environment variable
value '["http://localhost:3000","http://localhost:5173"]' is not a valid JSON
```

### 根本原因

1. **本地开发环境**：`.env` 文件中的 `CORS_ORIGINS=["..."]` 是 JSON 数组格式
2. **Railway 平台**：环境变量作为**纯字符串**传递给容器
3. **Pydantic Settings**：尝试直接解析字符串为 List 类型失败

### 架构分析

```
本地开发                          Railway 生产
┌─────────────┐                  ┌─────────────┐
│ .env 文件    │                  │ Railway UI  │
│             │                  │             │
│ CORS_ORIGINS│                  │ 变量配置    │
│ =["...",".."]│                  │ =["...",".."]│
└─────────────┘                  └──────┬──────┘
        │                                │
        │ 读取为 JSON 数组                │ 作为字符串传递
        ▼                                ▼
┌─────────────┐                  ┌─────────────┐
│ Pydantic    │                  │ Pydantic    │
│ 直接解析成功 │                  │ 解析失败 ❌ │
└─────────────┘                  └─────────────┘
```

### 解决方案

在 `ai-service/app/config.py` 中添加灵活的环境变量解析器：

```python
from typing import List, Union, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # 接受多种类型：List 或 str
    cors_origins: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="CORS allowed origins"
    )

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        """
        解析 CORS origins，支持多种格式：
        1. JSON 数组字符串: '["http://a.com","http://b.com"]'
        2. 逗号分隔: 'http://a.com,http://b.com'
        3. 通配符: '*'
        4. 已经是列表: 直接返回
        """
        if isinstance(v, list):
            return v

        if isinstance(v, str):
            # 通配符处理
            if v.strip() == '*':
                return ['*']

            # JSON 数组格式
            if v.startswith('[') and v.endswith(']'):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass

            # 逗号分隔格式
            return [origin.strip() for origin in v.split(',')]

        # 默认值
        return ["http://localhost:3000", "http://localhost:5173"]

    @property
    def cors_origins_list(self) -> List[str]:
        """确保总是返回 List 类型供中间件使用"""
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [self.cors_origins]
```

### 使用方式

```python
# ai-service/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,  # 使用 property 确保类型正确
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Railway 环境变量配置

支持以下三种格式（任选其一）：

```bash
# 格式 1: JSON 数组字符串
CORS_ORIGINS=["http://localhost:5173","https://hub.zenconsult.top"]

# 格式 2: 逗号分隔
CORS_ORIGINS=http://localhost:5173,https://hub.zenconsult.top

# 格式 3: 通配符
CORS_ORIGINS=*
```

---

## 问题2: 404 Application Not Found

### 症状

服务部署成功，但访问时返回 404 错误：

```
curl https://ai-service-production-9f1b.up.railway.app/
# 返回: 404 page not found
```

### 根本原因

**Dockerfile 硬编码了端口号**，而 Railway 动态分配端口：

```dockerfile
# ❌ 错误的 Dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Railway 工作原理：

```
Railway 平台
├── 动态分配 PORT 环境变量 (如: 31543)
├── 反向代理监听外部 80/443 端口
│   └── 转发到容器内 PORT 端口
└── 期望应用监听 PORT 端口
```

如果应用监听固定端口 8000，而 Railway 分配了 31543，反向代理转发到 31543 时找不到应用。

### 解决方案

**修改 Dockerfile 使用环境变量中的 PORT**：

```dockerfile
# ✅ 正确的 Dockerfile
EXPOSE 8000

# 设置默认端口（Railway 会覆盖）
ENV PORT=8000

# 使用 shell 命令读取 PORT 环境变量
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
```

### 验证方法

```bash
# 在 Railway 日志中查看分配的端口
railway logs

# 应该能看到类似输出：
# INFO:     Uvicorn running on http://0.0.0.0:31543
```

---

## 问题3: 服务无法构建

### 症状

Railway Dashboard 显示 "Deployment does not have an associated build"

### 根本原因

**Root Directory 配置错误**。项目是 monorepo 结构：

```
Affi-Marketing/
├── backend-go/
├── ai-service/          ← AI Service 代码在这里
├── frontend/
└── Railway 项目配置指向了根目录
```

Railway 需要知道在哪个子目录中构建服务。

### 解决方案

#### 方法1: Railway Console 配置（推荐）

1. 打开 Railway Dashboard
2. 选择项目 → 选择 AI Service
3. 点击 Settings 标签
4. 找到 **Root Directory** 配置
5. 设置为 `ai-service`

#### 方法2: railway.toml 配置文件

在项目根目录创建 `railway.toml`：

```toml
# railway.toml
[build]
# 构建 Dockerfile 的目录
dockerfilePath = "ai-service/Dockerfile"
# 或者
dockerContext = "ai-service"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 30000
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**注意**：Railway 优先使用 Console 配置，如果使用 railway.toml，需要在 Console 中删除 Root Directory 设置。

---

## 问题4: 环境变量格式问题

### 症状

```python
ValueError: Invalid CORS origin format
```

### 根本原因

Railway UI 中的环境变量格式不一致：

```
# UI 输入框中
CORS_ORIGINS = http://localhost:5173, https://hub.zenconsult.top
# (有空格)

# 实际传递给容器的值
"http://localhost:5173, https://hub.zenconsult.top"
# (有空格，导致解析后 URL 包含空格)
```

### 解决方案

在 `parse_cors_origins` 中使用 `.strip()` 清理空白：

```python
return [origin.strip() for origin in v.split(',')]
```

### Railway Console 配置建议

```bash
# ✅ 正确：无空格
CORS_ORIGINS=http://localhost:5173,https://hub.zenconsult.top

# ❌ 错误：有空格
CORS_ORIGINS=http://localhost:5173, https://hub.zenconsult.top
```

---

## Railway 最佳实践

### 1. 健康检查配置

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1
```

```python
# ai-service/app/main.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
```

### 2. 环境变量验证

```python
# ai-service/app/config.py
from pydantic import field_validator

class Settings(BaseSettings):
    database_url: str
    redis_url: str

    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith(('postgresql://', 'postgres://')):
            raise ValueError('DATABASE_URL must start with postgresql://')
        return v
```

### 3. 日志配置

```python
# ai-service/app/main.py
import logging

# Railway 喜欢结构化日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 关键事件标记
logger.info("Application starting...", extra={
    "event": "startup",
    "version": "1.0.0"
})
```

### 4. 优雅关闭

```python
import signal
import sys

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down gracefully...")
    # 清理资源
    await database.disconnect()
    await redis.close()
```

### 5. 资源限制

在 railway.toml 中配置：

```toml
[deploy]
# 健康检查
healthcheckPath = "/health"
healthcheckTimeout = 30000

# 重启策略
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

# 资源限制（根据套餐）
# 免费套餐: 512MB RAM, 0.5 vCPU
# 付费套餐: 可配置
```

---

## 调试技巧

### 1. 本地模拟 Railway 环境

```bash
# 使用 Railway 环境变量本地运行
railway run python -m uvicorn app.main:app

# 或手动设置
export PORT=8000
export DATABASE_URL="postgresql://..."
export CORS_ORIGINS='["http://localhost:5173"]'
uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

### 2. 实时查看日志

```bash
# 实时日志
railway logs --tail 50 -f

# 过滤错误
railway logs --tail 100 | grep -i error

# 查看构建日志
railway logs --build
```

### 3. 进入容器调试

```bash
# Railway 不支持直接 SSH，但可以添加调试端点
# ai-service/app/main.py

@app.get("/debug/env")
async def debug_env():
    """仅开发环境使用"""
    if os.getenv("ENVIRONMENT") != "production":
        return {
            "port": os.getenv("PORT"),
            "cors_origins": os.getenv("CORS_ORIGINS"),
            "all_env": dict(os.environ)
        }
    return {"error": "Not allowed in production"}
```

### 4. 健康检查脚本

```bash
#!/bin/bash
# check-railway-health.sh

echo "Checking AI Service health..."
curl -f https://ai-api.zenconsult.top/health || exit 1

echo "Checking Backend health..."
curl -f https://api-hub.zenconsult.top/ || exit 1

echo "✅ All services healthy"
```

### 5. 常见错误代码

| HTTP 状态 | 含义 | 可能原因 |
|----------|------|----------|
| 404 | 应用未找到 | 端口配置错误，应用未启动 |
| 502 | 网关错误 | 应用崩溃，端口未监听 |
| 503 | 服务不可用 | 健康检查失败 |
| 504 | 网关超时 | 应用启动时间过长 |

---

## 总结

### 关键要点

1. **环境变量类型安全**：使用 Pydantic validator 处理多种格式
2. **端口动态分配**：始终使用 `${PORT}` 环境变量
3. **Root Directory**：monorepo 项目必须正确配置
4. **健康检查**：实现可靠的 `/health` 端点
5. **日志管理**：使用结构化日志便于调试

### 学习资源

- [Railway 官方文档](https://docs.railway.app/)
- [Pydantic Settings 文档](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)

### 快速检查清单

部署前检查：

- [ ] Dockerfile 使用 `${PORT}` 而非硬编码端口
- [ ] 实现了 `/health` 健康检查端点
- [ ] 环境变量有默认值和验证
- [ ] Root Directory 配置正确
- [ ] railway.toml 配置正确
- [ ] 本地使用 `railway run` 测试通过

---

**最后更新**: 2026-03-04
**作者**: DevOps Team
**项目**: Affi-Marketing
