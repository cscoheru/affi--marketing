/**
 * Blog API
 * Fetches blog articles from the content directory
 */

import { blogArticles, type BlogArticle } from '@/config/blog-articles'

const CONTENT_BASE_URL = '/content'

export interface ArticleContent {
  title: string
  content: string
  article: BlogArticle
}

/**
 * Get all published articles
 */
export async function getAllArticles(): Promise<BlogArticle[]> {
  // Return articles sorted by date (newest first)
  return [...blogArticles].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * Get article by slug
 */
export async function getArticleBySlug(slug: string): Promise<BlogArticle | null> {
  return blogArticles.find(article => article.slug === slug) || null
}

/**
 * Get article content
 * This fetches the medium-ready text file
 */
export async function getArticleContent(slug: string): Promise<ArticleContent | null> {
  const article = await getArticleBySlug(slug)
  if (!article) return null

  try {
    const response = await fetch(`${CONTENT_BASE_URL}/${article.contentFile}`)
    if (!response.ok) throw new Error('Article not found')

    const content = await response.text()

    return {
      title: article.title,
      content,
      article
    }
  } catch (error) {
    console.error('Error fetching article content:', error)
    return null
  }
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(category: string): Promise<BlogArticle[]> {
  const allArticles = await getAllArticles()
  return allArticles.filter(article => article.category === category)
}

/**
 * Get featured articles (first 3)
 */
export async function getFeaturedArticles(): Promise<BlogArticle[]> {
  const allArticles = await getAllArticles()
  return allArticles.slice(0, 3)
}
