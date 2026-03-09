# Dify Cloud 选品工作流设计文档

> **创建日期**: 2026-03-07
> **状态**: 设计完成，> **版本**: 1.0

---

## 1. 概述

### 1.1 项目目标
构建一个基于 Dify Cloud 的 AI 选品工作流，实现亚马逊联盟营销的**选品 + 内容生成**一条龙服务。

### 1.2 核心功能
1. **AI 智能选品** - 根据关键词/Best Sellers/竞品分析，智能推荐高潜力产品
2. **内容自动生成** - 为选定的产品生成评测/指南/对比文章
3. **系统自动导入** - 通过 API 自动将结果写入后端数据库

---

## 2. 系统架构

### 2.1 整体架构图

```
┌────────────────────────────────────────────────────────────────┐
│                        Dify Cloud Workflow                              │
│                    (amazon-selection-workflow)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────┐ │
│   │  START   │ → │  AI选品分析  │ → │  内容生成    │ → │  END    │ │
│   └─────────┘   └─────────────┘   └─────────────┘   └─────────┘ │
│        ↓                ↓                ↓                ↓         │
│   ┌─────────────────────────────────────────────────────────────┐ │
│   │                   HTTP Request 节点                                │ │
│   │          调用后端 API 写入 markets + products 表                    │ │
│   └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    后端系统 (Railway)                                     │
│                                                                 │
│   POST /api/v1/markets/batch   → 批量创建市场机会                            │
│   POST /api/v1/products/batch   → 批量创建内容产品                            │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈
| 组件 | 技术 |
|------|------|
| AI 平台 | Dify Cloud |
| LLM 模型 | GPT-4o / Claude 3.5 Sonnet |
| 后端 | Go + Gin + PostgreSQL |
| 前端 | Next.js 14 + TypeScript |
| 部署 | Railway |

---

## 3. 工作流设计

### 3.1 工作流信息
| 属性 | 值 |
|------|------|
| 工作流名称 | amazon-selection-workflow |
| 触发方式 | API 触发 |
| 超时 | 60 秒 |

### 3.2 输入参数
```json
{
  "input_type": "keyword | bestsellers | competitor",
  "input_value": "noise cancelling headphones",
  "content_type": "review | guide | comparison",
  "auto_import": true
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `input_type` | string | 是 | 输入类型：keyword/bestsellers/competitor |
| `input_value` | string | 是 | 关键词/URL/ASIN |
| `content_type` | string | 是 | 内容类型：review/guide/comparison |
| `auto_import` | boolean | 否 | 是否自动导入系统 |

### 3.3 输出格式
```json
{
  "success": true,
  "summary": {
    "input_type": "keyword",
    "input_value": "noise cancelling headphones",
    "content_type": "review",
    "products_analyzed": 20,
    "products_recommended": 5,
    "content_generated": 5
  },
  "markets": [
    {
      "asin": "B08N5KWB9H",
      "title": "Sony WH-1000XM4",
      "category": "Electronics",
      "price": "348.00",
      "rating": "4.7",
      "review_count": 45678,
      "ai_score": 92,
      "market_size": "large",
      "competition_level": "high",
      "content_potential": "high"
    }
  ],
  "products": [
    {
      "slug": "sony-wh1000xm4-review",
      "title": "Sony WH-1000XM4 深度评测：降噪耳机的新标杆",
      "type": "review",
      "content": "# 完整的评测内容...",
      "excerpt": "Sony WH-1000XM4 是市场上最优秀的降噪耳机之一",
      "seo_title": "Sony WH-1000XM4 Review 2024",
      "seo_description": "In-depth review of Sony WH-1000XM4...",
      "word_count": 2345,
      "market_asins": "B08N5KWB9H"
    }
  ]
}
```

---

## 4. 工作流节点详细设计
### 4.1 节点 1: 开始节点
**类型**: 开始节点
**功能**: 接收并验证用户输入参数

### 4.2 节点 2: AI 选品分析节点
**类型**: LLM 节点
**模型**: GPT-4o 或 Claude 3.5 Sonnet
**功能**: 根据输入进行市场分析，推荐产品

**评分维度** (每项 1-10 分):
| 维度 | 说明 | 权重 |
|------|------|------|
| 价格适配 | $20-$100 最佳 | 中等 |
| 评分/评论 | 4.0+ 评分， 100+ 评论 | 高 |
| 佣金比例 | 根据品类 | 中等 |
| 竞争度 | 避免过度饱和市场 | 中等 |
| 内容潜力 | 适合写评测/指南 | 高 |
| 季节性 | 当前季节需求 | 低 |

### 4.3 节点 3: 内容生成节点
**类型**: LLM 节点
**模型**: GPT-4o 或 Claude 3.5 Sonnet
**功能**: 根据选定的产品生成内容

**内容类型**:
| 类型 | 字数 | 说明 |
|------|------|------|
| review | 1500-2000 | 产品评测 |
| guide | 2000-3000 | 购买指南 |
| comparison | 2000-2500 | 对比文章 |

### 4.4 节点 4: HTTP Request 节点
**类型**: HTTP Request 节点
**功能**: 调用后端 API 导入数据
**条件**: `auto_import == true`

**请求配置**:
- 方法: POST
- URL: `https://your-backend.railway.app/api/v1/markets/batch`
- Content-Type: application/json

### 4.5 节点 5: 结束节点
**类型**: 结束节点
**功能**: 输出最终结果

---

## 5. 后端 API 设计
### 5.1 批量创建市场机会
```
POST /api/v1/markets/batch
```

**请求体**:
```json
{
  "markets": [
    {
      "asin": "B08N5KWB9H",
      "title": "Sony WH-1000XM4",
      "category": "Electronics",
      "price": "348.00",
      "rating": "4.7",
      "reviewCount": 45678,
      "marketSize": "large",
      "competitionLevel": "high",
      "contentPotential": "high",
      "aiScore": 92
    }
  ]
}
```

**响应体**:
```json
{
  "success": true,
  "data": {
    "created_count": 5,
    "skipped_count": 0,
    "markets": [...]
  }
}
```

### 5.2 批量创建内容产品
```
POST /api/v1/products/batch
```

**请求体**:
```json
{
  "products": [
    {
      "slug": "sony-wh1000xm4-review",
      "title": "Sony WH-1000XM4 深度评测",
      "type": "review",
      "content": "# 完整内容...",
      "excerpt": "摘要...",
      "seoTitle": "SEO标题",
      "seoDescription": "SEO描述",
      "seoKeywords": "关键词",
      "wordCount": 2345,
      "marketAsins": ["B08N5KWB9H"]
    }
  ]
}
```

**响应体**:
```json
{
  "success": true,
  "data": {
    "created_count": 5,
    "products": [...]
  }
}
```

---

## 6. 前端集成
### 6.1 触发入口
在「市场战略」页面添加「AI 智能选品」按钮

### 6.2 调用示例
```typescript
async function triggerSelection(inputType: string, inputValue: string, contentType: string) {
  const response = await fetch('https://api.dify.ai/v1/workflows/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: {
        input_type: inputType,
        input_value: inputValue,
        content_type: contentType,
        auto_import: true,
      },
      response_mode: 'blocking',
    }),
  });

  return response.json();
}
```

### 6.3 结果处理
- 自动导入：工作流完成后自动刷新页面
- 手动审核：导出 JSON 文件，前端提供导入界面

---

## 7. Dify 配置要求
### 7.1 环境变量
| 变量 | 说明 |
|------|------|
| DIFY_API_KEY | Dify API 密钥 |
| BACKEND_API_URL | 后端 API 地址 |
| BACKEND_API_KEY | 后端 API 密钥（可选） |

### 7.2 模型选择
推荐使用 **Claude 3.5 Sonnet**，原因：
- 更好的内容生成质量
- 更准确的选品分析
- 支持长文本输出

---

## 8. 实施计划
### 8.1 后端任务
- [ ] 创建批量创建市场机会 API
- [ ] 创建批量创建内容产品 API
- [ ] 添加 Dify API 密钥配置

### 8.2 前端任务
- [ ] 添加 AI 智能选品按钮
- [ ] 实现工作流调用逻辑
- [ ] 添加结果展示组件

### 8.3 Dify 任务
- [ ] 创建工作流
- [ ] 配置 LLM 节点
- [ ] 配置 HTTP Request 节点
- [ ] 测试工作流

---

## 9. 验收标准
1. 输入关键词，能生成 5 个推荐产品
2. 每个产品有完整的 6 维度评分
3. 内容质量符合 SEO 要求
4. 数据能正确导入后端数据库
5. 前端能正确展示结果

---

## 10. 附录
### 10.1 相关文档
- `docs/plans/2026-03-06-content-business-master-plan.md` - 总体规划
- `docs/0306_Project_status.md` - 项目状态

### 10.2 相关代码
- `backend-go/internal/controller/content/markets.go` - 市场控制器
- `frontend-unified/app/(content)/strategy/page.tsx` - 市场战略页面
