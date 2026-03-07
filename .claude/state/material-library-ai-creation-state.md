# 素材库 + AI辅助创作系统 - 状态文件

## 项目信息

- **创建时间**: 2026-03-07
- **状态**: ✅ 实现完成
- **完成时间**: 2026-03-07
- **设计文档**: `docs/plans/2026-03-07-material-library-ai-creation-design.md`
- **实现计划**: `docs/plans/2026-03-07-material-library-ai-creation.md`

## 关键决策

| 决策点 | 选择 |
|--------|------|
| 素材库模式 | 独立资源库，可复用 |
| AI SDK | Vercel AI SDK + @ai-sdk/openai-compatible |
| 素材来源-产品介绍 | 手动粘贴或上传文件 |
| 素材来源-用户评论 | 手动粘贴或上传文件 |
| 素材来源-YouTube | youtube-transcript npm 包自动获取 |
| 保存流程 | 分步选择（弹窗勾选） |
| 素材-市场关联 | 一对一，通过 market_id |
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
    FileSize    int64        `json:"fileSize" gorm:"default:0"`
    MarketID    int          `json:"marketId" gorm:"not null;index"`
    WordCount   int          `json:"wordCount" gorm:"default:0"`
    Metadata    string       `json:"metadata" gorm:"type:jsonb;default:'{}'"`
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

## 实现阶段

### Phase 1: 数据库 & 后端 API ✅ (完成)
- [x] Task 1: 创建 materials 表迁移 (`009_materials.sql`)
- [x] Task 2: 创建 Material 模型 (`internal/model/content/material.go`)
- [x] Task 3: 创建 Materials 控制器 (`internal/controller/content/materials.go`)
- [x] Task 4: 注册控制器 (已注册在 `routes.go`)
- [x] Task 5: 更新前端 API 类型 (`lib/api.ts`)

### Phase 2: 前端素材库 UI ✅ (完成)
- [x] Task 6: 创建素材列表页面 (`app/(content)/materials/page.tsx`)
- [x] Task 7: 创建素材表单组件 (`components/materials/material-form.tsx`)
- [x] Task 8: 创建新建素材页面 (`app/(content)/materials/new/page.tsx`)
- [x] Task 9: 添加侧边栏入口 (`components/unified-sidebar.tsx`)

### Phase 3: YouTube 字幕 API ✅ (完成)
- [x] Task 10: 安装 youtube-transcript
- [x] Task 11: 创建字幕获取 API (`app/api/youtube/transcript/route.ts`)

### Phase 4: AI 内容生成 ✅ (完成)
- [x] Task 12: 安装 Vercel AI SDK 和 @ai-sdk/openai-compatible
- [x] Task 13: 更新 AI 生成 API (`app/api/ai/generate/route.ts`)
- [x] Task 14: 创建 AI 创作页面 (`app/(content)/ai-create/page.tsx`)
- [x] Task 15: 添加 AI 创作入口 (`app/(content)/products/page.tsx`)

### Phase 5: 市场战略集成 ✅ (完成)
- [x] Task 16: 创建保存素材弹窗 (`components/materials/save-material-dialog.tsx`)
- [x] Task 17: 集成到策略页面 (`app/(content)/strategy/page.tsx`)

## API 端点

### 后端 Go API
- `GET /api/v1/materials` - 素材列表
- `POST /api/v1/materials` - 创建素材
- `GET /api/v1/materials/:id` - 素材详情
- `PUT /api/v1/materials/:id` - 更新素材
- `DELETE /api/v1/materials/:id` - 删除素材
- `GET /api/v1/materials/by-market/:marketId` - 按市场筛选

### 前端 Next.js API
- `POST /api/youtube/transcript` - YouTube字幕获取
- `POST /api/ai/generate/stream` - AI流式生成

## 环境变量

```env
ZHIPU_API_KEY=your_zhipu_api_key_here
```

## 已实现的功能

1. **素材库管理**
   - 素材列表页面（按类型、市场筛选）
   - 创建素材（支持产品介绍、用户评论、YouTube评测、附件）
   - YouTube字幕自动提取
   - 素材与市场一对一关联

2. **AI内容创作**
   - 选择素材进行AI生成
   - 分段生成（引言、正文、结论、CTA）
   - 流式输出实时预览
   - 生成内容保存为草稿

3. **策略页面集成**
   - AI分析结果保存为素材
   - 产品详情页一键保存功能

## Git Commits

- `e9bcea6` - feat: implement Material Library with market association
- `42d3aca` - feat: add AI content generation and YouTube transcript APIs
- `7576081` - feat: add save material dialog and integrate with strategy page
