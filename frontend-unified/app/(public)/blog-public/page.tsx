import { Metadata } from 'next'
import ArticleCard from '@/components/blog-public/article-card'
import FeaturedPost from '@/components/blog-public/featured-post'
import { getBlogPosts, getFeaturedPosts, getBlogCategories } from '@/lib/blog-public/api'
import { generateBlogMetadata, generateWebsiteSchema } from '@/lib/blog-public/seo'

export const metadata: Metadata = generateBlogMetadata({
  title: '博客首页',
  description: '探索最新的联盟营销策略、产品评测和行业洞察',
  keywords: ['联盟营销', '营销策略', '产品评测', 'SEO优化'],
  url: '/blog',
})

export default async function BlogHomePage() {
  // 从 API 获取数据
  let featuredPosts: any[] = []
  let recentPosts: any[] = []
  let categories: any[] = []

  try {
    const [featuredData, recentData, categoriesData] = await Promise.all([
      getFeaturedPosts(1),
      getBlogPosts({ page: 1, page_size: 6 }),
      getBlogCategories(),
    ])

    featuredPosts = featuredData
    recentPosts = recentData.posts || []
    categories = categoriesData || []
  } catch (error) {
    console.error('Failed to fetch blog data:', error)
    // 使用 fallback 数据
    featuredPosts = [{
      slug: 'affiliate-marketing-guide-2024',
      title: '2024年联盟营销完整指南',
      excerpt: '从零开始学习联盟营销，包括策略、工具和最佳实践',
      image_url: '/images/blog/affiliate-guide.jpg',
      category: { name: '营销策略' },
      published_at: '2024-01-15',
      author: { name: 'Affi Team' },
    }]
  }

  const featuredPost = featuredPosts[0]

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebsiteSchema()) }}
      />

      {/* 页面标题 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          联盟营销知识库
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          探索最新的营销策略、产品评测和行业洞察，助您成为联盟营销专家
        </p>
      </div>

      {/* 精选文章 */}
      {featuredPost && (
        <section className="mb-12">
          <FeaturedPost
            slug={featuredPost.slug}
            title={featuredPost.title}
            excerpt={featuredPost.excerpt}
            imageUrl={featuredPost.image_url}
            category={featuredPost.category?.name || '未分类'}
            publishedAt={featuredPost.published_at}
            author={featuredPost.author?.name || 'Affi Team'}
          />
        </section>
      )}

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 文章列表 */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">最新文章</h2>
          {recentPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentPosts.map((post: any) => (
                <ArticleCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  excerpt={post.excerpt}
                  imageUrl={post.image_url}
                  category={post.category?.name || '未分类'}
                  publishedAt={post.published_at}
                  author={post.author?.name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无文章
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div className="lg:col-span-1">
          {/* 分类导航 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">文章分类</h3>
            {categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((cat: any) => (
                  <li key={cat.slug}>
                    <a
                      href={`/blog-public/category/${cat.slug}`}
                      className="flex justify-between items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <span>{cat.name}</span>
                      <span className="text-sm text-gray-400">{cat.post_count || 0}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">暂无分类</p>
            )}
          </div>

          {/* 订阅表单（可选） */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              订阅更新
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              获取最新的营销策略和行业洞察
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="输入您的邮箱"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                订阅
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
