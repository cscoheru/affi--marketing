import { Metadata } from 'next'
import ArticleCard from '@/components/blog-public/article-card'

interface Props {
  params: Promise<{ slug: string }>
}

// 分类名称映射
const categoryNames: Record<string, string> = {
  marketing: '营销策略',
  reviews: '产品评测',
  seo: 'SEO优化',
  tools: '工具推荐',
  all: '所有文章',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const categoryName = categoryNames[slug] || slug

  return {
    title: `${categoryName}文章`,
    description: `浏览${categoryName}相关的所有文章`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const categoryName = categoryNames[slug] || slug

  // TODO: 从 API 获取该分类的文章
  const posts = [
    {
      slug: 'affiliate-marketing-guide-2024',
      title: '2024年联盟营销完整指南',
      excerpt: '从零开始学习联盟营销，包括策略、工具和最佳实践',
      imageUrl: '/images/blog/affiliate-guide.jpg',
      category: '营销策略',
      publishedAt: '2024-01-15',
    },
    {
      slug: 'top-affiliate-networks',
      title: '2024年最佳联盟网络平台评测',
      excerpt: '深度对比主流联盟网络平台的优缺点',
      imageUrl: '/images/blog/networks.jpg',
      category: '产品评测',
      publishedAt: '2024-01-10',
    },
    {
      slug: 'content-marketing-tips',
      title: '内容营销的10个高效技巧',
      excerpt: '如何创作高转化的营销内容',
      imageUrl: '/images/blog/content-tips.jpg',
      category: '营销策略',
      publishedAt: '2024-01-08',
    },
  ]

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <nav className="text-sm text-muted-foreground mb-2">
          <a href="/blog" className="hover:text-foreground">博客首页</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{categoryName}</span>
        </nav>
        <h1 className="text-3xl font-bold text-foreground">
          {categoryName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          共 {posts.length} 篇文章
        </p>
      </div>

      {/* 文章列表 */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <ArticleCard key={post.slug} {...post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无文章</p>
          <a href="/blog" className="text-primary hover:text-primary/80 mt-2 inline-block">
            返回博客首页
          </a>
        </div>
      )}
    </div>
  )
}
