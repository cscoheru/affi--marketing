# 产品生命周期管理系统设计

## 1. 背景

当前产品管理模块缺少清晰的联盟营销生命周期管理，产品状态定义模糊，无法追踪推广效果。

## 2. 目标

建立完整的联盟产品生命周期管理系统：
- 明确的产品状态流转
- 推广数据追踪（API自动同步 + 手动补充）
- 可视化看板展示
- 智能退出决策支持

## 3. 产品生命周期定义

### 3.1 五阶段状态

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│ 待筛选  │───>│ 可行性   │───>│ 推广中  │───>│ 效果评估 │───>│逐步退出 │
│ pending │    │ 测试中   │    │ active  │    │reviewing │    │phased_out│
└─────────┘    └──────────┘    └─────────┘    └──────────┘    └─────────┘
     │              │               │               │               │
     │              │               │               │               v
     │              │               │               │         ┌─────────┐
     │              │               │               └────────>│ 已归档  │
     │              │               │                         │archived │
     v              v               v                         └─────────┘
   直接放弃       测试失败        推广效果不佳
```

### 3.2 状态转换规则

| 当前状态 | 可转换到 | 触发条件 |
|---------|---------|---------|
| pending | testing | 用户确认开始测试 |
| pending | archived | 直接放弃（不符合选品标准）|
| testing | active | 测试期表现良好（CTR > 1%, 有转化）|
| testing | phased_out | 测试期效果不佳 |
| active | reviewing | 定期评估（每周/每月）|
| active | phased_out | 连续7天无转化 |
| reviewing | active | 继续推广 |
| reviewing | phased_out | 效果不达标 |
| phased_out | archived | 完全停止推广 |

### 3.3 各阶段追踪指标

#### 待筛选 (pending)
- 产品基础信息：ASIN、标题、价格、评分、评论数
- AI评分：潜力分数
- 来源：AI推荐 / 手动添加 / ASIN采集

#### 可行性测试 (testing)
- 测试时长：建议3-7天
- 测试渠道：单个平台（如Blogger）
- 追踪指标：
  - 推广次数
  - 曝光量
  - 点击率 CTR
  - 初步转化

#### 推广中 (active)
- 推广平台：多平台（Blogger、Medium、WordPress等）
- 追踪指标：
  - 总曝光量
  - 总点击量
  - 转化次数
  - 收益金额（$）
  - 点击率 CTR
  - 转化率
  - 每次点击收益 EPC

#### 效果评估 (reviewing)
- 评估周期：建议每月一次
- 评估维度：
  - 收益趋势（上升/稳定/下降）
  - ROI分析
  - 竞争态势变化
  - 产品生命周期阶段

#### 逐步退出 (phased_out)
- 退出原因记录
- 退出策略：
  - 立即停止
  - 逐步减少推广频率
  - 替代产品推荐

## 4. 数据模型

### 4.1 Product 表扩展字段

```go
type Product struct {
    // ... 现有字段 ...

    // 生命周期时间戳
    TestingStartedAt  *time.Time
    ActiveStartedAt   *time.Time
    ReviewingAt       *time.Time
    PhasedOutAt       *time.Time

    // 推广数据汇总
    TotalPromotions  int
    TotalImpressions int
    TotalClicks      int
    TotalConversions int
    TotalRevenue     float64

    // 最后同步时间
    LastSyncedAt *time.Time

    // 退出原因
    PhaseOutReason string
}
```

### 4.2 ProductPromotion 表（按平台追踪）

```go
type ProductPromotion struct {
    ID           int
    ProductID    int
    ASIN         string
    Platform     string  // amazon, blogger, medium, wordpress

    // 推广统计
    PromotionCount int
    Impressions    int
    Clicks         int
    Conversions    int
    Revenue        float64

    // 计算指标
    CTR           float64
    ConversionRate float64
    EPC           float64

    // 同步状态
    LastSyncedAt   *time.Time
    LastSyncStatus string

    // 手动数据
    ManualRevenue     float64
    ManualImpressions int
    ManualClicks      int
    ManualUpdatedAt   *time.Time
}
```

## 5. API 设计

### 5.1 状态转换 API

```
POST /api/v1/products/:asin/status
Body: {
  "status": "testing",
  "reason": "开始可行性测试"  // 可选
}

GET /api/v1/products/:asin/transitions
Response: {
  "currentStatus": "testing",
  "availableTransitions": ["active", "phased_out"],
  "suggestedAction": "推广到正式推广"
}
```

### 5.2 推广数据 API

```
GET /api/v1/products/:asin/promotions
Response: {
  "summary": { ... },
  "byPlatform": [
    { "platform": "blogger", "impressions": 100, ... }
  ]
}

POST /api/v1/products/:asin/promotions/manual
Body: {
  "platform": "amazon",
  "revenue": 25.50,
  "impressions": 100,
  "clicks": 5
}

POST /api/v1/products/:asin/promotions/sync
// 触发从Amazon Associates API同步数据
```

### 5.3 看板统计 API

```
GET /api/v1/products/kanban
Response: {
  "pending": { "count": 5, "products": [...] },
  "testing": { "count": 3, "products": [...] },
  "active": { "count": 10, "products": [...] },
  "reviewing": { "count": 2, "products": [...] },
  "phased_out": { "count": 1, "products": [...] }
}
```

## 6. 前端设计

### 6.1 看板视图（Kanban）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  产品管理    [AI推荐选品] [手动添加] [一键采集 ASIN]                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│ │ 待筛选(5) │ │测试中(3) │ │ 推广中(10)│ │效果评估(2)│ │逐步退出(1)│    │
│ │           │ │           │ │           │ │           │ │           │    │
│ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │    │
│ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │ │           │    │
│ │ [产品卡片] │ │ [产品卡片] │ │ [产品卡片] │ │           │ │           │    │
│ │           │ │           │ │ [产品卡片] │ │           │ │           │    │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 产品卡片信息

```
┌────────────────────────────┐
│ 📦 [产品图片]             │
│ 产品标题（可能截断）      │
│ ASIN: B08N5KWB9H          │
│ $349.99  ⭐4.7             │
├────────────────────────────┤
│ 👁 1200  🖱 89  🎯 12  │
│ 💰 $1,250.50             │
├────────────────────────────┤
│ [编辑] [下一阶段] [删除] │
└────────────────────────────┘
```

### 6.3 状态转换确认

点击"下一阶段"时，弹出确认对话框：
- 显示当前阶段统计
- 显示转换条件
- 允许填写备注

## 7. 实施分工

### Phase 1: 后端数据模型与API（预计1小时）
**负责人**: 后端开发

任务：
1. 更新 `internal/model/content/types.go`
   - Product 结构体添加生命周期字段
   - 创建 ProductPromotion 结构体

2. 更新 `internal/controller/content/products.go`
   - 添加状态转换验证逻辑
   - 添加 `/products/:asin/status` 端点
   - 添加 `/products/:asin/promotions` 端点
   - 添加 `/products/kanban` 端点

3. 数据库迁移
   - 添加新字段的迁移脚本

### Phase 2: 前端看板视图（预计1.5小时）
**负责人**: 前端开发

任务：
1. 重构 `app/(content)/products/page.tsx`
   - 实现 Kanban 看板布局
   - 状态列展示
   - 产品卡片组件
   - 拖拽功能（可选）

2. 创建组件
   - `components/product-kanban-card.tsx`
   - `components/product-status-column.tsx`
   - `components/status-transition-dialog.tsx`

### Phase 3: 推广数据追踪（预计1小时）
**负责人**: 全栈开发

任务：
1. 产品详情页添加推广数据展示
2. 手动录入表单
3. Amazon API 同步触发按钮

### Phase 4: 测试与联调（预计0.5小时）
**负责人**: 全栈开发

任务：
1. 本地测试完整流程
2. Railway 部署测试
3. 修复发现的问题

## 8. 注意事项

1. **渐进式实现** - 先跑通基础流程，再完善数据追踪
2. **演示模式** - 后端API未完成时，前端使用演示数据
3. **数据同步** - Amazon Associates API 需要配置凭证，先支持手动录入
4. **状态转换** - 需要记录转换历史，便于后续分析

## 9. 验收标准

- [ ] 产品可以按5个状态分类展示
- [ ] 产品可以在各状态间转换
- [ ] 推广中产品可以查看追踪数据
- [ ] AI推荐选品功能正常
- [ ] 一键采集ASIN功能正常
- [ ] 本地前后端联调通过

---

**创建时间**: 2026-03-06
**状态**: 待审核
