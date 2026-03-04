<template>
  <div class="article-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading article...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4m0 4h.01"/>
      </svg>
      <h2>{{ error }}</h2>
      <router-link to="/blog" class="btn-back">← Back to Blog</router-link>
    </div>

    <!-- Article Content -->
    <article v-else-if="content" class="article-wrapper">
      <!-- Article Header -->
      <header class="article-header">
        <div class="header-content">
          <nav class="breadcrumb">
            <router-link to="/blog">Blog</router-link>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            <span class="current">{{ content.article.category }}</span>
          </nav>

          <span class="article-category">{{ content.article.category }}</span>
          <h1 class="article-title">{{ content.title }}</h1>

          <div class="article-meta">
            <div class="meta-author">
              <div class="author-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div>
                <span class="author-name">{{ content.article.author || 'Coffee Enthusiast' }}</span>
                <span class="post-date">{{ formatDate(content.article.date) }}</span>
              </div>
            </div>
            <div class="meta-reading">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5z"/>
                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
              </svg>
              <span>{{ content.article.readTime || '5 min read' }}</span>
            </div>
          </div>

          <div v-if="content.article.hasAffiliateLinks" class="affiliate-notice">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div>
              <strong>Affiliate Disclosure:</strong> This article contains affiliate links. If you make a purchase, we may earn a small commission at no extra cost to you.
            </div>
          </div>
        </div>
      </header>

      <!-- Featured Image -->
      <div v-if="content.article.image" class="featured-image-wrapper">
        <img :src="content.article.image" :alt="content.title" class="featured-image">
      </div>

      <!-- Article Body -->
      <div class="article-body-wrapper">
        <div class="article-content">
          <div class="content-text" v-html="formattedContent"></div>
        </div>

        <!-- Article Tags -->
        <div class="article-tags">
          <span class="tag">{{ content.article.category }}</span>
          <span class="tag">Coffee Tips</span>
          <span class="tag">Brewing Guide</span>
        </div>

        <!-- Share Section -->
        <div class="share-section">
          <h3>Share this article</h3>
          <div class="share-buttons">
            <button class="share-btn twitter" @click="shareTwitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Twitter
            </button>
            <button class="share-btn reddit" @click="shareReddit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              Reddit
            </button>
            <button class="share-btn copy" @click="copyLink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              {{ copied ? 'Copied!' : 'Copy Link' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Author Box -->
      <div class="author-box">
        <div class="author-avatar-large">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div class="author-info">
          <h4>{{ content.article.author || 'Coffee Enthusiast' }}</h4>
          <p>Honest coffee reviews and brewing tips for regular people who love coffee but don't want to make it a religion.</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="article-navigation">
        <router-link v-if="prevArticle" :to="`/blog/${prevArticle.slug}`" class="nav-link prev">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
          </svg>
          <div>
            <span class="nav-label">Previous</span>
            <span class="nav-title">{{ prevArticle.title }}</span>
          </div>
        </router-link>
        <router-link v-if="nextArticle" :to="`/blog/${nextArticle.slug}`" class="nav-link next">
          <div>
            <span class="nav-label">Next</span>
            <span class="nav-title">{{ nextArticle.title }}</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </router-link>
      </nav>

      <!-- Related Articles -->
      <section v-if="relatedArticles.length > 0" class="related-articles">
        <h3>You might also like</h3>
        <div class="related-grid">
          <router-link
            v-for="related in relatedArticles"
            :key="related.slug"
            :to="`/blog/${related.slug}`"
            class="related-card"
          >
            <img :src="related.image" :alt="related.title" class="related-image">
            <div class="related-content">
              <span class="related-category">{{ related.category }}</span>
              <h4>{{ related.title }}</h4>
              <span class="related-meta">{{ related.readTime }}</span>
            </div>
          </router-link>
        </div>
      </section>
    </article>

    <!-- Not Found -->
    <div v-else class="not-found">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <h2>Article Not Found</h2>
      <p>The article you're looking for doesn't exist.</p>
      <router-link to="/blog" class="btn-back">← Back to Blog</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getArticleContent, getAllArticles } from '@/api/blog'
import type { BlogArticle } from '@/config/blog-articles'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const content = ref<Awaited<ReturnType<typeof getArticleContent>> | null>(null)
const allArticles = ref<BlogArticle[]>([])
const copied = ref(false)

const slug = computed(() => route.params.slug as string)

const currentIndex = computed(() => {
  if (!content.value) return -1
  return allArticles.value.findIndex(a => a.slug === content.value?.article.slug)
})

const prevArticle = computed(() => {
  if (currentIndex.value <= 0) return null
  return allArticles.value[currentIndex.value - 1]
})

const nextArticle = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= allArticles.value.length - 1) return null
  return allArticles.value[currentIndex.value + 1]
})

const relatedArticles = computed(() => {
  if (!content.value) return []
  return allArticles.value
    .filter(a => a.slug !== slug.value && a.category === content.value?.article.category)
    .slice(0, 3)
})

const formattedContent = computed(() => {
  if (!content.value) return ''

  let html = content.value.content

  // Convert visual separators to HR
  html = html.replace(/[—]{20,}/g, '<hr>')

  // Convert title underlines to headings
  html = html.replace(/([^\n]+)\n[=]{10,}/g, '<h2>$1</h2>')
  html = html.replace(/([^\n]+)\n[—]{10,}/g, '<h3>$1</h3>')

  // Convert paragraphs
  html = html.split('\n\n').map(para => {
    para = para.trim().replace(/\n/g, ' ')
    if (!para) return ''
    if (para.startsWith('<h')) return para
    if (para.startsWith('<hr')) return para

    // Convert bullet lists
    if (para.startsWith('•')) {
      const items = para.split('\n').map(item => `<li>${item.replace('•', '').trim()}</li>`).join('')
      return `<ul>${items}</ul>`
    }

    return `<p>${para}</p>`
  }).join('\n')

  return html
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const shareTwitter = () => {
  const url = window.location.href
  const text = content.value?.title || ''
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
}

const shareReddit = () => {
  const url = window.location.href
  const text = content.value?.title || ''
  window.open(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank')
}

const copyLink = async () => {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

onMounted(async () => {
  try {
    loading.value = true
    allArticles.value = await getAllArticles()
    content.value = await getArticleContent(slug.value)

    if (!content.value) {
      error.value = 'Article not found'
    }
  } catch (err) {
    error.value = 'Failed to load article'
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.article-page {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1a1a1a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error & Not Found */
.error-state,
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 40px 20px;
  text-align: center;
}

.error-state svg,
.not-found svg {
  color: #d1d5db;
  margin-bottom: 20px;
}

.error-state h2,
.not-found h2 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.error-state p,
.not-found p {
  color: #6b7280;
  margin-bottom: 24px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: #1a1a1a;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #333;
}

/* Article Wrapper */
.article-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

/* Article Header */
.article-header {
  background: white;
  padding: 60px 20px 40px;
}

.header-content {
  max-width: 700px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: #1a1a1a;
}

.breadcrumb svg {
  color: #d1d5db;
}

.breadcrumb .current {
  color: #9ca3af;
}

.article-category {
  display: inline-block;
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: #1a1a1a;
  margin: 0 0 24px;
  letter-spacing: -0.02em;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.meta-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 44px;
  height: 44px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.author-name {
  display: block;
  font-weight: 600;
  color: #1a1a1a;
}

.post-date {
  display: block;
  font-size: 0.85rem;
  color: #9ca3af;
}

.meta-reading {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 0.9rem;
}

.affiliate-notice {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #92400e;
}

.affiliate-notice svg {
  flex-shrink: 0;
  color: #f59e0b;
}

/* Featured Image */
.featured-image-wrapper {
  background: white;
  padding: 0 20px;
}

.featured-image {
  width: 100%;
  height: auto;
  max-height: 500px;
  object-fit: cover;
  border-radius: 12px;
}

/* Article Body */
.article-body-wrapper {
  background: white;
  padding: 60px 20px;
}

.article-content {
  max-width: 700px;
  margin: 0 auto;
}

.content-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #374151;
}

.content-text :deep(h2) {
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 50px;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.content-text :deep(h3) {
  font-size: 1.4rem;
  font-weight: 600;
  margin-top: 40px;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.content-text :deep(p) {
  margin-bottom: 24px;
}

.content-text :deep(ul) {
  margin: 24px 0;
  padding-left: 24px;
}

.content-text :deep(li) {
  margin-bottom: 12px;
}

.content-text :deep(hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 50px 0;
}

.article-tags {
  display: flex;
  gap: 12px;
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
}

.tag {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Share Section */
.share-section {
  max-width: 700px;
  margin: 50px auto 0;
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
}

.share-section h3 {
  font-size: 1.1rem;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.share-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn.twitter {
  background: #000;
  color: white;
}

.share-btn.reddit {
  background: #ff4500;
  color: white;
}

.share-btn.copy {
  background: #f3f4f6;
  color: #1a1a1a;
}

.share-btn:hover {
  transform: translateY(-2px);
}

/* Author Box */
.author-box {
  display: flex;
  gap: 20px;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 40px 20px;
}

.author-avatar-large {
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  flex-shrink: 0;
}

.author-info h4 {
  margin: 0 0 8px;
  color: #1a1a1a;
}

.author-info p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

/* Article Navigation */
.article-navigation {
  display: flex;
  gap: 20px;
  padding: 40px 20px;
  background: white;
}

.nav-link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
}

.nav-link.prev {
  flex-direction: row;
}

.nav-link.next {
  flex-direction: row-reverse;
  text-align: right;
}

.nav-label {
  display: block;
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Related Articles */
.related-articles {
  padding: 60px 20px;
  background: white;
}

.related-articles h3 {
  font-size: 1.5rem;
  margin-bottom: 30px;
  color: #1a1a1a;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.related-card {
  display: block;
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.related-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.related-image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.related-content {
  padding: 20px;
}

.related-category {
  display: block;
  font-size: 0.75rem;
  color: #6366f1;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.related-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-meta {
  font-size: 0.85rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .article-title {
    font-size: 1.8rem;
  }

  .article-meta {
    flex-direction: column;
    gap: 16px;
  }

  .article-navigation {
    flex-direction: column;
  }

  .nav-link.next {
    text-align: left;
    flex-direction: row;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }

  .share-buttons {
    flex-direction: column;
  }

  .share-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
