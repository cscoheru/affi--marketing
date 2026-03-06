import Link from 'next/link'

interface FeaturedPostProps {
  slug: string
  title: string
  excerpt: string
  imageUrl: string
  category: string
  publishedAt: string
  author: string
}

export default function FeaturedPost({
  slug,
  title,
  excerpt,
  imageUrl,
  category,
  publishedAt,
  author,
}: FeaturedPostProps) {
  return (
    <article className="relative bg-white rounded-lg shadow-lg overflow-hidden">
      <Link href={`/blog-public/${slug}`} className="block">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* 图片区域 */}
          <div className="aspect-video lg:aspect-auto lg:h-80 bg-gray-100 relative overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-20 h-20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {/* 分类标签 */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-sm font-medium bg-white/90 rounded-full text-gray-700">
                {category}
              </span>
            </div>
            {/* 精选标记 */}
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 text-sm font-medium bg-blue-600 rounded-full text-white">
                精选
              </span>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6 lg:p-8 flex flex-col justify-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-gray-600 mb-6 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>作者：{author}</span>
                <span>•</span>
                <time dateTime={publishedAt}>{publishedAt}</time>
              </div>
              <div className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                阅读更多 →
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
