import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

// TODO: 从 API 获取文章数据
async function getPost(slug: string) {
  // 临时 mock 数据
  if (slug === 'affiliate-marketing-guide-2024') {
    return {
      title: '2024年联盟营销完整指南',
      slug: 'affiliate-marketing-guide-2024',
      content: `
# 2024年联盟营销完整指南

## 什么是联盟营销？

联盟营销是一种基于效果的营销方式，商家通过联盟会员推广产品或服务，并按实际效果（销售、引导等）支付佣金。

## 联盟营销的优势

1. **低风险**：按效果付费，无需预先投入大量广告费用
2. **可扩展**：可以同时推广多个产品和服务
3. **被动收入**：建立渠道后可持续获得收入

## 如何开始联盟营销

### 第一步：选择利基市场

选择一个您熟悉且有兴趣的领域，这样可以创作更专业的内容。

### 第二步：选择联盟计划

研究并选择可靠的联盟计划，考虑以下因素：
- 佣金比例
- 产品质量
- 支付条件
- 联盟支持

### 第三步：建立内容平台

创建博客、YouTube 频道或社交媒体账号，定期发布有价值的内容。

### 第四步：优化转化

通过 SEO、内容优化和用户体验改进来提高转化率。

## 常见错误

1. 推广低质量产品
2. 忽视内容质量
3. 不了解目标受众
4. 缺乏耐心

## 总结

联盟营销是一个需要持续学习和优化的过程。保持专业和诚信，为用户提供真正的价值，才能获得长期成功。
      `,
      excerpt: '从零开始学习联盟营销，包括策略、工具和最佳实践',
      category: '营销策略',
      author: 'Affi Team',
      publishedAt: '2024-01-15',
      imageUrl: '/images/blog/affiliate-guide.jpg',
      metaTitle: '2024年联盟营销完整指南 | Affi Marketing',
      metaDescription: '从零开始学习联盟营销，包括策略、工具和最佳实践',
    }
  }

  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: '文章未找到',
    }
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.imageUrl ? [post.imageUrl] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-4xl">
      <article className="bg-card rounded-lg shadow-sm border overflow-hidden">
        {/* 文章头部 */}
        <header className="p-8 border-b">
          <div className="mb-4">
            <a
              href={`/blog/category/${post.category.toLowerCase()}`}
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              {post.category}
            </a>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-card-foreground mb-4">
            {post.title}
          </h1>
          <div className="flex items-center text-sm text-muted-foreground space-x-4">
            <span>作者：{post.author}</span>
            <span>•</span>
            <time dateTime={post.publishedAt}>{post.publishedAt}</time>
          </div>
        </header>

        {/* 特色图片 */}
        {post.imageUrl && (
          <div className="aspect-video bg-muted">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 文章内容 */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </div>

        {/* 文章底部 */}
        <footer className="p-8 bg-muted border-t">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                最后更新于 {post.publishedAt}
              </p>
            </div>
            <div className="flex space-x-4">
              <a
                href="/blog-public"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                ← 返回博客首页
              </a>
            </div>
          </div>
        </footer>
      </article>

      {/* 相关文章推荐 */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-foreground mb-4">相关文章</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/blog-public/top-affiliate-networks" className="block p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-card-foreground mb-1">2024年最佳联盟网络平台评测</h4>
            <p className="text-sm text-muted-foreground">深度对比主流联盟网络平台的优缺点</p>
          </a>
          <a href="/blog-public/content-marketing-tips" className="block p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-card-foreground mb-1">内容营销的10个高效技巧</h4>
            <p className="text-sm text-muted-foreground">如何创作高转化的营销内容</p>
          </a>
        </div>
      </div>
    </div>
  )
}
