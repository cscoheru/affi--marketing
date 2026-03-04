# 角色任务卡：SEO 内容创作者

**会话ID**: S12-CONTENT
**角色**: SEO 内容创作者
**工时**: 8 小时
**优先级**: 🔴 最高
**基于需求**: `docs/PHASE2_REQUIREMENTS.md` v3.1.1

---

## 🚨 第一步：入职指南

**启动会话后，请首先阅读**：
1. `docs/PHASE2_REQUIREMENTS.md` - 完整需求文档
2. `docs/SESSION_ONBOARDING.md` - 项目入职指南

---

## 🎯 核心任务

创建 10 篇 Medium 内容，用于"咖啡机评测 + Amazon US 联盟"实验。

### ⚠️ 最高原则

**真实性第一，AI 只润色，不捏造！**

---

## 📋 任务清单

### 任务 1：素材收集 (2小时)

**目标**：为 3 款咖啡机收集真实素材

**产品选择**（从 Amazon US Best Sellers）:
1. **De'Longhi ECAM 22.110** (~$350, 4.5% 佣金)
2. **Breville Barista Express** (~$500, 4% 佣金)
3. **Nespresso Vertuo** (~$150, 5% 佣金)

**收集步骤**：

| 步骤 | 来源 | 收集内容 | 数量 |
|------|------|----------|------|
| 1 | YouTube | 评测视频笔记 | 每款3个视频 |
| 2 | Amazon US 差评区 | 真实痛点 | 每款5个 |
| 3 | Amazon US 好评区 | 真实优点 | 每款3个 |
| 4 | Amazon/品牌官网 | 产品规格 | 完整参数 |
| 5 | 可选 Fiverr | 实拍照片/视频 | 每款3张 |

**输出格式**（保存到 `docs/content_material/{产品名}.md`）：

```markdown
# {产品名} 素材

## 真实优点
- {提取自好评}
- {提取自好评}

## 真实痛点
- {提取自差评}
- {提取自差评}

## 产品规格
- 价格: ${价格}
- 水箱容量: {容量}
- 泵压: {压力}
- 尺寸: {尺寸}
- 重量: {重量}

## YouTube 视频笔记
- 视频1: {链接} - 关键信息
- 视频2: {链接} - 关键信息
- 视频3: {链接} - 关键信息
```

---

### 任务 2：创建 7 篇科普文章 (3小时)

**目的**：充实门面，防御 Amazon 人工审核

**文章列表**（AI 快速生成，10分钟/篇）：

| # | 标题 | 类型 | 联盟链接 |
|---|------|------|----------|
| 1 | "How to Store Coffee Beans: Freezer vs Counter" | 纯科普 | ❌ |
| 2 | "Hard Water vs Soft Water: Does It Affect Your?" | 纯科普 | ❌ |
| 3 | "Arabica vs Robusta: What's the Difference?" | 纯科普 | ❌ |
| 4 | "Why Your Coffee Tastes Bitter" | 纯科普 | ❌ |
| 5 | "Perfect Water Temperature for Coffee" | 纯科普 | ❌ |
| 6 | "Single-Origin vs Blend: Which to Buy?" | 纯科普 | ❌ |
| 7 | "How to Clean Your Coffee Machine" | 纯科普 | ❌ |

**创作提示**：

```python
# AI 提示词（科普文章）
你是一位咖啡专家，请写一篇关于 "{标题}" 的科普文章。

**要求**：
- 英文，600-800字
- 口语化，幽默风格
- 包含实际数据和研究
- 添加小标题提高可读性
- 结尾给出明确建议

**禁止**：
- 禁止捏造数据
- 禁止过度使用形容词
```

**保存位置**：`docs/content/drafts/science_{序号}.md`

---

### 任务 3：创建 3 篇评测文章 (3小时)

**目的**：带联盟链接的核心变现内容

**文章列表**：

| # | 标题 | 类型 | 联盟链接 |
|---|------|------|----------|
| 1 | "Why I Regret Buying the De'Longhi ECAM 22.110 After 3 Months" | 单品评测 | ✅ |
| 2 | "De'Longhi vs Breville vs Nespresso: Which Is Worth It?" | 对比评测 | ✅ |
| 3 | "Coffee Machine Buying Guide for Beginners (2024)" | 购买指南 | ✅ |

**⚠️ 创作原则**：

1. **只使用真实素材**
   - 所有优缺点必须来自 Amazon 评论
   - 所有规格必须来自官网
   - 禁止 AI 捏造任何细节

2. **第一人称叙述**
   - 使用 "I", "my", "me" 人称
   - 口语化表达
   - 分享真实感受

3. **结构清晰**
   - 开篇：具体使用场景
   - 主体：详细使用体验
   - 结论：明确推荐

**AI 辅助提示**：

```python
你是一位资深咖啡爱好者，正在写一篇关于 "{product_name}" 的评测文章。

**最高约束**：
1. 只使用我提供的真实事实，绝对禁止捏造
2. 不知道的信息明确说"无法确认"，不要编造
3. 第一人称，口语化

**真实信息**：
优点：
- {advantage_1}
- {advantage_2}
- {advantage_3}

痛点：
- {pain_point_1}
- {pain_point_2}
- {pain_point_3}

规格：{specs}

请融入一篇幽默、口语化的评测中，结构：
1. 开篇：具体场景（基于优缺点）
2. 主体：使用体验（只用提供的信息）
3. 结论：明确评价（适合谁/不适合谁）

**禁止**：
- 禁止描述声音、气味（除非我提供）
- 禁止捏造"使用3个月"（如果不确定）
```

**每篇必须包含**：
- [ ] 至少 3 张真实图片
- [ ] 1 个对比表格
- [ ] 2-3 个联盟链接（自然融入）
- [ ] 清晰的 CTA（Call to Action）

**保存位置**：`docs/content/drafts/review_{序号}.md`

---

## ✅ 完成标准

**任务完成时**：

- [ ] 3 款产品的素材收集完成（`docs/content_material/`）
- [ ] 7 篇科普文章草稿完成（`docs/content/drafts/science_*.md`）
- [ ] 3 篇评测文章草稿完成（`docs/content/drafts/review_*.md`）
- [ ] 每篇评测至少包含 3 张图片位置标记
- [ ] 所有内容已通过真实素材检查
- [ ] 更新 `docs/SESSION_LOG.md` 记录完成情况

**内容质量检查清单**（每篇文章）：

- [ ] 真实素材：所有事实来自 Amazon/YouTube
- [ ] 无捏造：确认没有 AI 编造的细节
- [ ] 图片标记：至少 3 张图片位置
- [ ] 联盟链接：自然融入，不过度营销
- [ ] SEO 基础：标题包含关键词
- [ ] 可读性：小标题、短段落、清晰结构

---

## 🤝 与其他会话协作

**输出给**: S13-PUBLISHER (Medium发布员)
- 10 篇文章草稿
- 3 款产品的素材文件

**等待**: S13-PUBLISHER 发布后再进行推广协作

---

## 📁 文件结构

```
docs/
├── content_material/          # 素材文件
│   ├── delonghi_ecam22.md
│   ├── breville_barista.md
│   └── nespresso_vertuo.md
└── content/
    └── drafts/                # 文章草稿
        ├── science_01.md ~ science_07.md
        ├── review_01.md
        ├── review_02.md
        └── review_03.md
```

---

## 🔔 重要提醒

1. **真实性是生命线**：一张丑陋但真实的实拍图 > 1000字优美的 AI 废话

2. **AI 只是工具**：它的作用是润色和整理，不是创作

3. **质量 > 数量**：10 篇精品 > 100 篇垃圾

4. **第一周是关键**：必须在 Week 1 完成所有内容，为推广争取时间

---

**版本**: 1.0.0
**基于需求**: PHASE2_REQUIREMENTS.md v3.1.1
**创建日期**: 2026-03-04
