import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  imageUrl?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
}

const SITE_NAME = 'Affi Marketing Blog'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'

/**
 * 生成博客页面的元数据
 */
export function generateBlogMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    imageUrl,
    url,
    type = 'website',
    publishedTime,
    author,
  } = config

  const fullTitle = `${title} | ${SITE_NAME}`
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL
  const fullImageUrl = imageUrl ? `${SITE_URL}${imageUrl}` : undefined

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName: SITE_NAME,
      type: type === 'article' ? 'article' : 'website',
      publishedTime: publishedTime,
      authors: author ? [author] : undefined,
      images: fullImageUrl ? [fullImageUrl] : undefined,
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: fullImageUrl ? [fullImageUrl] : undefined,
    },
    alternates: {
      canonical: fullUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

/**
 * 生成结构化数据（JSON-LD）
 */
export function generateBlogPostSchema(post: {
  title: string
  excerpt: string
  imageUrl?: string
  publishedAt: string
  author: string
  slug: string
}) {
  const postUrl = `${SITE_URL}/blog/${post.slug}`
  const imageUrl = post.imageUrl ? `${SITE_URL}${post.imageUrl}` : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    datePublished: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  }
}

/**
 * 生成网站结构化数据
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: '专业的联盟营销知识库，提供营销策略、产品评测和行业洞察',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/blog?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

/**
 * 生成分类结构化数据
 */
export function generateCategorySchema(category: {
  name: string
  slug: string
  description?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.name,
    description: category.description,
    url: `${SITE_URL}/blog/category/${category.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}
