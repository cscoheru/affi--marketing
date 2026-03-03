# 角色任务卡: AI工程师 (AI Engineer)

## 角色信息
- **角色ID**: 04-ai-engine
- **角色名称**: AI工程师
- **预计时长**: 20 小时
- **主要职责**: AI服务集成、内容生成、智能推荐

## 核心任务

### 1. AI服务管理器设计 (4h)

设计多模型AI服务管理系统：
- 模型选择策略
- 成本优化逻辑
- 请求路由
- 错误重试
- 使用量统计

**输出**: `ai-service/services/manager.py`

### 2. 模型适配器开发 (6h)

为不同AI模型创建适配器：
- 通义千问 (DashScope)
- OpenAI (GPT-4)
- 智谱AI (ChatGLM)
- 统一输入输出接口

**输出**:
- `ai-service/services/adapters/qwen_adapter.py`
- `ai-service/services/adapters/openai_adapter.py`
- `ai-service/services/adapters/chatglm_adapter.py`

### 3. 程序化SEO内容生成 (5h)

实现SEO内容生成服务：
- 关键词分析
- 意图识别
- 大纲生成
- 内容生成
- SEO优化
- 质量检测

**输出**:
- `ai-service/services/seo/content_generator.py`
- `ai-service/services/seo/keyword_analyzer.py`
- `ai-service/services/seo/optimizer.py`

### 4. 联盟链接智能注入 (2h)

实现联盟链接智能注入服务：
- 内容分析
- 链接匹配
- 自然插入
- 链接伪装

**输出**: `ai-service/services/affiliate/link_injector.py`

### 5. 提示词工程 (3h)

设计和优化各类提示词：
- 内容生成提示词
- 关键词分析提示词
- 产品推荐提示词
- 分类标签提示词

**输出**: `ai-service/prompts/` 目录

### 6. 成本监控 (2h)

实现AI API使用量监控：
- Token统计
- 成本计算
- 预算告警
- 使用报告

**输出**: `ai-service/services/cost_monitor.py`

## 输入依赖

- [x] 架构师提供的AI服务集成规范
- [x] AI API密钥已配置

## 技术栈

- Python 3.10+
- FastAPI
- LangChain (可选)
- HTTPX (异步HTTP)
- Redis (缓存)

## AI API配置

```python
# 环境变量
DASHSCOPE_API_KEY=sk-xxxx
OPENAI_API_KEY=sk-xxxx
CHATGLM_API_KEY=xxxx
```

## 服务接口

```python
# 统一内容生成接口
class ContentGenerator:
    async def generate_seo_content(
        keyword: str,
        intent: str,
        target_audience: str,
        length: int,
        model: str = "auto"
    ) -> GeneratedContent

    async def inject_affiliate_links(
        content: str,
        products: List[Product],
        network: str
    ) -> str

    async def analyze_keyword(
        keyword: str
    ) -> KeywordAnalysis
```

## 输出产物

| 文件 | 描述 |
|------|------|
| `ai-service/services/manager.py` | AI服务管理器 |
| `ai-service/services/adapters/` | 模型适配器 |
| `ai-service/services/seo/` | SEO内容生成 |
| `ai-service/services/affiliate/` | 联盟链接服务 |
| `ai-service/prompts/` | 提示词模板 |
| `ai-service/services/cost_monitor.py` | 成本监控 |
| `ai-service/main.py` | FastAPI入口 |

## API端点

- `POST /api/v1/ai/generate-content` - 生成内容
- `POST /api/v1/ai/analyze-keyword` - 分析关键词
- `POST /api/v1/ai/inject-links` - 注入链接
- `GET /api/v1/ai/cost/usage` - 使用统计

## 部署

使用 Railway 部署 AI 服务：
1. 创建独立的 Railway 项目
2. 配置 Python 环境
3. 设置 API 密钥
4. 部署到 `ai-api.zenconsult.top`

## 成本优化策略

1. **模型选择**
   - 简单内容: 通义千问 Turbo
   - 复杂内容: GPT-4
   - 实时响应: 智谱 GLM-4

2. **缓存策略**
   - 相似关键词复用结果
   - 内容模板缓存
   - Redis 会话缓存

3. **批处理**
   - 批量关键词处理
   - 异步队列

## 验证清单

- [ ] 所有模型适配器可正常调用
- [ ] 内容生成质量达标
- [ ] 成本监控正常工作
- [ ] API 端点可访问
- [ ] 错误处理完善

---

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/04-ai-engine.md"
