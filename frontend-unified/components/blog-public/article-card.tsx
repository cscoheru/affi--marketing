import Link from 'next/link'

interface ArticleCardProps {
  slug: string
  title: string
  excerpt: string
  imageUrl: string
  category: string
  publishedAt: string
  author?: string
}

export default function ArticleCard({
  slug,
  title,
  excerpt,
  imageUrl,
  category,
  publishedAt,
  author,
}: ArticleCardProps) {
  return (
    <article className="bg-card rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/blog-public/${slug}`}>
        {/* 文章图片 */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg
                className="w-12 h-12"
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
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 text-xs font-medium bg-background/90 rounded-full text-foreground">
              {category}
            </span>
          </div>
        </div>

        {/* 文章内容 */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {author && <span>作者：{author}</span>}
            <time dateTime={publishedAt}>{publishedAt}</time>
          </div>
        </div>
      </Link>
    </article>
  )
}
