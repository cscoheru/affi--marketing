# Content Automation Roadmap

> **Status**: Planning Phase
> **Created**: 2026-03-04
> **Target**: Full automation from product selection to publishing

---

## 🎯 Vision: Complete Content Automation Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        完整自动化流程愿景                              │
├─────────────────────────────────────────────────────────────────────┤
│  选产品 → 选题 → 素材搜集 → 创作 → 审核 → 发布 → 推广 → 数据追踪      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Automation Feasibility Analysis

| Stage | Difficulty | AI Capability | Manual Override | Approach |
|-------|-----------|---------------|-----------------|----------|
| **Product Selection** | ⭐⭐⭐⭐ | High | Final approval | AI筛选 + 人工确认 |
| **Topic Generation** | ⭐⭐⭐ | High | Fine-tuning | AI生成 + 人工微调 |
| **Research Collection** | ⭐⭐ | Medium | Verification | AI搜集 + 人工核实 |
| **Content Creation** | ⭐⭐⭐ | High | Polishing | AI初稿 + 人工精修 |
| **Quality Review** | ⭐ | Low |主导 | AI检查 + 人工终审 |
| **Publishing** | ⭐ | Low | Trigger | 自动化 + 人工确认 |
| **Promotion** | ⭐⭐⭐ | High | Supervision | AI生成 + 人工发布 |
| **Data Tracking** | ⭐ | Low | Analysis | 自动采集 + 人工决策 |

---

## 🚀 Three-Phase Plan

### Phase 1: Semi-Automated (Current - Week 1-2)
**Goal**: Validate business model, establish templates

```
┌─────────────────────────────────────────────────────────────┐
│  Product   Topics   Research   Writing   Review   Publish   │
│  Manual  →  Manual →  Manual  →   AI   →  Human  →  Semi-Auto│
│           (templates)          (draft)   (polish)  (blog)   │
└─────────────────────────────────────────────────────────────┘
```

**Completed**:
- ✅ Product: De'Longhi ECAM 22.110 selected
- ✅ Topics: Templates created (`science_XX_template.md`, `review_XX_template.md`)
- ✅ Research: Amazon US reviews + YouTube reviews
- ✅ Writing: 10 articles completed
- ✅ Review: 9.6/10 quality score
- ✅ Semi-auto publish: Hub blog integration

**Remaining Tasks**:
- Complete Medium publishing (RSS import)
- Start Reddit/Quora promotion
- Daily data tracking

---

### Phase 2: Modular Automation (Week 3-6)
**Goal**: Independent automation tools for each stage

```
┌─────────────────────────────────────────────────────────────┐
│  Product   Topics   Research   Writing   Review   Publish   │
│  AI   →   AI   →  AI+    →   AI   →  AI+   →   Auto       │
│  Screen    Generate Manual     Draft  Check   Publish       │
│           (templates) Verify            Manual              │
│                                        Final                │
└─────────────────────────────────────────────────────────────┘
```

**Tools to Develop**:

1. **Product Hunter** (`roles/16-product-hunter.md`)
   - Scan Amazon Best Sellers
   - Criteria: $100-500, 1000+ reviews, 4.0+ rating
   - Output: Candidate product list

2. **Topic Generator** (`scripts/topic_generator.py`)
   - Input: Product ASIN
   - Output: 10 topic suggestions (competitor analysis)
   - Templates: Science / Review / Buying Guide

3. **Research Scraper** (`scripts/research_scraper.py`)
   - Amazon US reviews (scraper or API)
   - YouTube review summaries
   - Reddit discussion hotspots
   - Output: `content_material/{asin}.md`

4. **Content Engine** (extend `ai-service/`)
   - Existing: Claude-based article writing
   - Enhance: SEO keyword optimization
   - Output: Markdown draft

5. **Quality Checker** (`scripts/quality_check.py`)
   - AI trace detection
   - SEO scoring
   - Readability analysis
   - Affiliate link verification

6. **Auto Publisher** (`scripts/publisher.py`)
   - Convert Markdown → Blog format
   - Generate RSS feed
   - Trigger Medium import (API if available)

---

### Phase 3: Full Pipeline Automation (Week 7+)
**Goal**: One-click generation, human review only

```
┌─────────────────────────────────────────────────────────────┐
│                    One-Click Content System                  │
│                                                             │
│  [Input: ASIN or Keyword]                                    │
│         ↓                                                   │
│  ┌───────────────────────────────────────────┐             │
│  │     AI Content Engine (ai-service)         │             │
│  │  - Product analysis                        │             │
│  │  - Topic generation                        │             │
│  │  - Research collection (multi-source)      │             │
│  │  - Article writing (Claude)                │             │
│  │  - Quality check (AI + rules)              │             │
│  └───────────────────────────────────────────┘             │
│         ↓                                                   │
│  [Output: Draft for review]                                 │
│         ↓                                                   │
│  [Human confirmation: 2 min]                               │
│         ↓                                                   │
│  [Auto publish: Blog + Medium + RSS]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Architecture**:

```yaml
# New role definitions
roles:
  - 16-product-hunter.md:     # Product Hunter
      - Scan Amazon Best Sellers
      - Analyze market opportunities

  - 17-content-orchestrator.md:  # Content Orchestrator
      - Coordinate modules
      - Quality gatekeeper

  - Technical support for 16-17:
      - ai-service/: Extend to full content engine
      - scripts/: Automation script collection
      - frontend/: Content management backend
```

---

## 📅 Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Phase 1 | 10 articles, Medium publish, promotion start |
| 3 | **Decision Point** | Analyze initial data |
| 4-5 | Phase 2 Start | Product hunter, Research scraper |
| 6-7 | Phase 2 Continue | Topic generator, Quality checker |
| 8 | **Decision Point** | Go/no-go for Phase 3 |
| 9+ | Phase 3 | Full pipeline automation |

---

## 🎯 Decision Points

### Week 3 Checkpoint
- **Metrics**: 10+ article views, 1+ affiliate click
- **Go**: Continue to Phase 2
- **No-Go**: Adjust strategy or pivot

### Week 8 Checkpoint
- **Metrics**: 100+ article views, 5+ affiliate clicks, 1+ sale
- **Go**: Full investment in Phase 3
- **No-Go**: Optimize current pipeline only

---

## 📁 Planned Files (Phase 2+)

### New Roles
- `roles/16-product-hunter.md`
- `roles/17-content-orchestrator.md`

### Scripts
- `scripts/amazon_scraper.py`
- `scripts/topic_generator.py`
- `scripts/research_scraper.py`
- `scripts/quality_check.py`
- `scripts/publisher.py`

### Documentation
- `docs/AUTOMATION_ROADMAP.md` (this file)
- `docs/PHASE2_AUTOMATION_GUIDE.md`

---

## 💡 Key Principles

1. **Quality Over Speed**: Never sacrifice content quality for automation
2. **Human in the Loop**: Always keep final human approval
3. **Iterative Development**: Build, test, improve each module
4. **Data-Driven Decisions**: Use metrics to guide next phase
5. **Fail Fast**: Stop if business model doesn't validate

---

**Status**: Planning complete, awaiting Phase 1 test results before Phase 2 development.
