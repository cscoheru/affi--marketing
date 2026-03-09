# 素材库 + AI辅助创作系统设计文档

## 概述

将"保存为草稿"改为"保存为素材"，创建独立的素材库系统，并实现基于Vercel AI SDK的AI辅助内容创作功能。

## 核心决策

| 决策点 | 选择 |
|--------|------|
| 素材库模式 | 独立资源库，可复用 |
| AI SDK | Vercel AI SDK + @ai-sdk/openai-compatible |
| 素材来源-产品介绍 | 手动粘贴或上传文件 |
| 素材来源-用户评论 | 手动粘贴或上传文件 |
| 素材来源-YouTube | youtube-transcript npm 包自动获取 |
| 保存流程 | 分步选择（弹窗勾选） |
| 素材-市场关联 | 一对一，简单直接 |
| AI输出方式 | 显示预览，确认后保存草稿 |
| 素材选择方式 | 勾选式 |
| UI位置 | 左侧侧边栏独立入口 |
| AI创作流程 | 分段生成（精细控制） |

## 数据模型

### Material (素材)

```go
type Material struct {
    ID          int          `json:"id" gorm:"primaryKey"`
    Title       string       `json:"title" gorm:"size:200;not null"`
    Type        MaterialType `json:"type" gorm:"size:20;not null;index"`
    Content     string       `json:"content" gorm:"type:text"`
    SourceURL   string       `json:"sourceUrl" gorm:"size:500"`
    FilePath    string       `json:"filePath" gorm:"size:500"`
    FileName    string       `json:"fileName" gorm:"size:200"`
    FileSize    int64        `json:"fileSize"`
    MarketID    int          `json:"marketId" gorm:"index;not null"`
    WordCount   int          `json:"wordCount"`
    Metadata    string       `json:"metadata" gorm:"type:jsonb"`
    CreatedAt   time.Time    `json:"createdAt" gorm:"autoCreateTime"`
    UpdatedAt   time.Time    `json:"updatedAt" gorm:"autoUpdateTime"`
}

type MaterialType string
const (
    MaterialTypeProductIntro  MaterialType = "product_intro"
    MaterialTypeUserReview    MaterialType = "user_review"
    MaterialTypeYouTubeReview MaterialType = "youtube_review"
    MaterialTypeAttachment    MaterialType = "attachment"
)
```

## UI设计

### 素材库列表页

- 左侧侧边栏独立入口
- 按素材类型分组显示
- 支持按市场筛选
- 显示关联的产品名称（通过market_id获取）

### 新建素材弹窗

- 素材类型选择：产品介绍 / 用户评论 / YouTube / 文件
- 市场选择：下拉搜索市场库中的产品（显示产品名，自动关联ASIN）
- 根据类型显示不同表单：
  - 产品介绍/评论：文本输入或文件上传
  - YouTube：链接输入 + 自动获取字幕

### AI辅助创作流程

1. **选择素材** - 勾选要使用的素材
2. **选择内容类型** - 产品评测 / 购买指南 / 对比分析
3. **选择段落** - 开头 / 产品介绍 / 用户评价 / 优缺点 / 购买建议 / 结尾
4. **分段生成** - 流式输出，每段可重新生成
5. **预览确认** - 确认后保存为草稿

## API设计

### 后端 Go API

```
GET    /api/v1/materials              # 素材列表
POST   /api/v1/materials              # 创建素材
GET    /api/v1/materials/:id          # 素材详情
PUT    /api/v1/materials/:id          # 更新素材
DELETE /api/v1/materials/:id          # 删除素材
GET    /api/v1/materials/by-market/:marketId  # 按市场筛选
```

### 前端 Next.js API

```
POST   /api/youtube/transcript        # YouTube字幕获取
POST   /api/ai/generate/stream        # AI流式生成
```

## 技术实现

### Vercel AI SDK + 智谱AI

```typescript
import { streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

const zhipu = createOpenAICompatible({
  name: 'zhipu',
  baseURL: 'https://open.bigmodel.cn/api/paas/v4',
  apiKey: process.env.ZHIPU_API_KEY,
})

const result = streamText({
  model: zhipu('glm-4-flash'),
  system: systemPrompt,
  prompt: userPrompt,
})

return result.toDataStreamResponse()
```

### YouTube字幕获取

```typescript
import { YoutubeTranscript } from 'youtube-transcript'

const transcript = await YoutubeTranscript.fetchTranscript(videoId)
const text = transcript.map(t => t.text).join(' ')
```

## 实现计划

### Phase 1: 素材库基础 (2-3小时)
- 数据库迁移 - 创建 materials 表
- 后端 API - 素材 CRUD 接口
- 前端页面 - 素材库列表和创建页面
- 市场选择器组件

### Phase 2: 素材来源功能 (2小时)
- YouTube 字幕获取 API
- 文件上传功能
- 市场战略保存素材弹窗

### Phase 3: AI 辅助创作 (3-4小时)
- Vercel AI SDK 集成
- 素材选择器组件
- 段落选择器组件
- 流式生成 + 进度显示
- 预览确认 + 保存草稿

### Phase 4: 关联与优化 (1-2小时)
- 素材-市场关联完善
- 产品中心草稿关联市场
- 提交审核功能

## 文件结构

```
backend-go/
├── migrations/
│   └── 008_materials.sql
├── internal/
│   ├── model/content/
│   │   └── material.go
│   └── controller/content/
│       └── materials.go

frontend-unified/
├── app/(content)/materials/
│   ├── page.tsx
│   └── create/page.tsx
├── app/api/
│   ├── youtube/transcript/route.ts
│   └── ai/generate/stream/route.ts
├── components/materials/
│   ├── material-form.tsx
│   ├── youtube-input.tsx
│   └── market-selector.tsx
└── components/ai-create/
    ├── material-selector.tsx
    ├── section-selector.tsx
    ├── generation-progress.tsx
    └── preview-dialog.tsx
```
