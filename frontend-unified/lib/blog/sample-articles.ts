import type { Article, Category, Comment } from './types'

// 示例分类 - 映射到后端类型
export const sampleCategories: Category[] = [
  { id: '1', slug: 'review', name: '评测', description: '深度产品分析和测评', color: 'bg-pink-500', order: 0, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '2', slug: 'blog', name: '文章', description: '营销文章和策略', color: 'bg-green-500', order: 1, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '3', slug: 'guide', name: '指南', description: '实用指南和教程', color: 'bg-indigo-500', order: 2, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '4', slug: 'science', name: '科普', description: '知识科普', color: 'bg-blue-500', order: 3, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
  { id: '5', slug: 'social', name: '社媒', description: '社交媒体策略', color: 'bg-yellow-500', order: 4, createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
]

// 示例作者
const sampleAuthors = [
  { id: '1', name: '张明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', userId: 'user-1', role: 'admin' as const },
  { id: '2', name: '李华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', userId: 'user-2', role: 'editor' as const },
  { id: '3', name: '王芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', userId: 'user-3', role: 'author' as const },
]

// 示例评论
const sampleComments: Comment[] = [
  {
    id: 'c1',
    articleId: '1',
    author: sampleAuthors[1],
    content: '非常棒的文章！对我帮助很大。',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    likes: 5,
    status: 'approved',
    replies: [
      {
        id: 'c1-1',
        articleId: '1',
        author: sampleAuthors[2],
        content: '同意，写得很清晰易懂。',
        createdAt: new Date('2024-01-11'),
        updatedAt: new Date('2024-01-11'),
        likes: 2,
        status: 'approved',
        parentId: 'c1',
      },
    ],
  },
  {
    id: 'c2',
    articleId: '1',
    author: sampleAuthors[2],
    content: '期待更多这样的内容！',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    likes: 3,
    status: 'approved',
  },
]

// 示例文章数据
export const sampleArticles: Article[] = [
  {
    id: 'sample-1',
    slug: 'nextjs-15-new-features',
    title: 'Next.js 15 新特性解析：从缓存到性能优化的全面升级',
    excerpt: '深入探讨 Next.js 15 带来的革命性变化，包括新的缓存策略、Turbopack 稳定版、React 19 支持等重要更新。',
    content: `# Next.js 15 新特性解析

Next.js 15 带来了许多令人兴奋的新特性和改进。让我们深入了解这些变化。

## 1. 新的缓存策略

Next.js 15 引入了全新的缓存组件（Cache Components），使用 \`"use cache"\` 指令来显式控制缓存行为。

\`\`\`typescript
'use cache'

export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
\`\`\`

## 2. Turbopack 稳定版

Turbopack 现在是默认的打包工具，提供更快的开发体验。

## 3. React 19 支持

完整支持 React 19 的新特性，包括：
- \`useEffectEvent\` hook
- \`<Activity>\` 组件
- 改进的并发渲染

## 4. 改进的 API

- \`revalidateTag()\` 现在需要第二个参数
- 新增 \`updateTag()\` API
- 新增 \`refresh()\` API

这些改进使 Next.js 更加强大和灵活，为开发者提供更好的开发体验。`,
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    category: sampleCategories[3], // science/科普
    author: sampleAuthors[0],
    status: 'published',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    tags: ['Next.js', 'React', 'Web开发'],
    likes: 128,
    comments: sampleComments,
    metaDescription: '深入了解 Next.js 15 的新特性，包括缓存组件、Turbopack 和 React 19 支持。',
  },
  {
    id: 'sample-2',
    slug: 'affiliate-marketing-2024',
    title: '2024 年联盟营销完全指南：从入门到精通',
    excerpt: '掌握联盟营销的核心策略，学习如何选择合适的产品、建立信任关系、以及优化转化率。',
    content: `# 2024 年联盟营销完全指南

联盟营销是一种通过推广他人产品来获得佣金的营销方式。本指南将帮助你从零开始。

## 什么是联盟营销？

联盟营销是一种基于绩效的营销模式，你通过推广商家的产品获得佣金。

## 如何开始？

1. **选择你的利基市场**
2. **研究联盟计划**
3. **创建高质量内容**
4. **建立受众群体**
5. **优化转化率**

## 最佳实践

- 保持诚实和透明
- 只推荐你真正相信的产品
- 提供真实的价值
- 持续学习和改进`,
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    category: sampleCategories[1], // blog/文章
    author: sampleAuthors[1],
    status: 'published',
    publishedAt: new Date('2024-01-12'),
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12'),
    tags: ['联盟营销', '数字营销', '赚钱'],
    likes: 256,
    comments: [],
    metaDescription: '学习联盟营销的核心策略和最佳实践。',
  },
  {
    id: 'sample-3',
    slug: 'seo-tips-2024',
    title: 'SEO 优化技巧：让你的网站排名飙升',
    excerpt: '掌握最新的 SEO 技术，包括核心网页指标优化、内容策略和链接建设。',
    content: `# SEO 优化技巧

在竞争激烈的数字世界中，SEO 是获取有机流量的关键。

## 核心网页指标

Google 的核心网页指标包括：
- LCP (最大内容绘制)
- INP (交互到下一帧绘制)
- CLS (累积布局偏移)

## 内容优化

- 关键词研究
- 高质量原创内容
- 结构化数据

## 技术 SEO

- 网站速度优化
- 移动端优先
- 安全性 (HTTPS)`,
    coverImage: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=400&fit=crop',
    category: sampleCategories[0], // review/评测
    author: sampleAuthors[2],
    status: 'published',
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
    tags: ['SEO', '搜索引擎', '网站优化'],
    likes: 189,
    comments: [],
    metaDescription: '学习最新的 SEO 优化技巧，提升网站搜索排名。',
  },
  {
    id: 'sample-4',
    slug: 'ai-tools-review',
    title: '2024 最佳 AI 工具测评：提升工作效率的必备神器',
    excerpt: '深度测评市场上最热门的 AI 工具，帮助你找到最适合的生产力工具。',
    content: `# 2024 最佳 AI 工具测评

AI 工具正在改变我们的工作方式。让我们看看哪些工具值得使用。

## 写作助手

### ChatGPT
- 优点：功能强大，通用性强
- 缺点：需要付费才能使用最新模型

### Claude
- 优点：上下文理解能力强
- 缺点：某些地区访问受限

## 图像生成

### Midjourney
- 优点：图像质量高
- 缺点：学习曲线较陡

## 编程助手

### GitHub Copilot
- 优点：代码补全准确
- 缺点：需要订阅`,
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    category: sampleCategories[3], // science/科普
    author: sampleAuthors[0],
    status: 'published',
    publishedAt: new Date('2024-01-08'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-08'),
    tags: ['AI', '工具', '效率'],
    likes: 342,
    comments: [],
    metaDescription: '深度测评 2024 年最佳 AI 工具。',
  },
  {
    id: 'sample-5',
    slug: 'react-hooks-tutorial',
    title: 'React Hooks 完全教程：从基础到高级用法',
    excerpt: '系统学习 React Hooks，掌握 useState、useEffect、useContext 等核心 hooks 的使用方法。',
    content: `# React Hooks 完全教程

React Hooks 让函数组件拥有了状态和生命周期。

## useState

\`\`\`jsx
const [count, setCount] = useState(0)
\`\`\`

## useEffect

\`\`\`jsx
useEffect(() => {
  document.title = \`Count: \${count}\`
}, [count])
\`\`\`

## useContext

用于跨组件共享状态。

## 自定义 Hooks

创建可复用的逻辑。`,
    coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    category: sampleCategories[2], // guide/指南
    author: sampleAuthors[1],
    status: 'published',
    publishedAt: new Date('2024-01-05'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
    tags: ['React', 'Hooks', '前端'],
    likes: 215,
    comments: [],
    metaDescription: '系统学习 React Hooks 的使用方法。',
  },
]

// 别名导出，用于store
export const mockArticles = sampleArticles
export const categories = sampleCategories
