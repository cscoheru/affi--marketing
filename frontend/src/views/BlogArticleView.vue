<template>
  <div class="article-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading article...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <router-link to="/blog" class="back-link">← Back to Blog</router-link>
    </div>

    <!-- Article Content -->
    <article v-else-if="content" class="article">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <router-link to="/blog">Blog</router-link>
        <span class="separator">/</span>
        <span class="current">{{ content.article.category }}</span>
      </nav>

      <!-- Article Header -->
      <header class="article-header">
        <span class="category">{{ content.article.category }}</span>
        <h1 class="article-title">{{ content.title }}</h1>
        <time class="article-date">{{ formatDate(content.article.date) }}</time>
        <p class="article-excerpt">{{ content.article.excerpt }}</p>

        <!-- Affiliate Disclosure -->
        <div v-if="content.article.hasAffiliateLinks" class="affiliate-disclosure">
          <strong>Affiliate Disclosure:</strong> This article contains affiliate links to Amazon.
          If you make a purchase through these links, we may earn a small commission at no extra cost to you.
          This helps support our work and allows us to continue providing honest reviews.
        </div>
      </header>

      <!-- Article Body -->
      <div class="article-body" v-html="formattedContent"></div>

      <!-- Article Footer -->
      <footer class="article-footer">
        <router-link to="/blog" class="back-link">← Back to All Articles</router-link>

        <!-- Share Section -->
        <div class="share-section">
          <h3>Found this helpful?</h3>
          <p>Follow Coffee Enthusiast for more practical coffee tips that actually make sense for regular people.</p>
        </div>
      </footer>

      <!-- Related Articles -->
      <section v-if="relatedArticles.length > 0" class="related-articles">
        <h3>Related Articles</h3>
        <div class="related-list">
          <router-link
            v-for="related in relatedArticles"
            :key="related.slug"
            :to="`/blog/${related.slug}`"
            class="related-link"
          >
            <h4>{{ related.title }}</h4>
            <p>{{ related.excerpt }}</p>
          </router-link>
        </div>
      </section>
    </article>

    <!-- Not Found -->
    <div v-else class="not-found">
      <h2>Article Not Found</h2>
      <p>The article you're looking for doesn't exist.</p>
      <router-link to="/blog" class="back-link">← Back to Blog</router-link>
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

const slug = computed(() => route.params.slug as string)

const formattedContent = computed(() => {
  if (!content.value) return ''

  // Convert the medium-ready text format to HTML
  // The text files use visual separators (—, =, etc.)
  let html = content.value.content

  // Convert visual separator lines to HR
  html = html.replace(/[—]{20,}/g, '<hr>')

  // Convert title underlines to h2 (if not already h1)
  html = html.replace(/([^\n]+)\n[=]{10,}/g, '<h2>$1</h2>')
  html = html.replace(/([^\n]+)\n[—]{10,}/g, '<h3>$1</h3>')

  // Convert double newlines to paragraphs
  html = html.split('\n\n').map(para => {
    para = para.trim()
    if (!para) return ''
    if (para.startsWith('<h')) return para
    if (para.startsWith('<hr')) return para

    // Convert bullet lists
    if (para.startsWith('•')) {
      const items = para.split('\n').map(item => `<li>${item.replace('•', '').trim()}</li>`).join('')
      return `<ul>${items}</ul>`
    }

    return `<p>${para.replace(/\n/g, ' ')}</p>`
  }).join('\n')

  return html
})

const relatedArticles = computed(() => {
  if (!content.value) return []
  return allArticles.value
    .filter(a => a.slug !== slug.value && a.category === content.value?.article.category)
    .slice(0, 3)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
.article-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 20px;
  min-height: 100vh;
  background: white;
}

.loading,
.error,
.not-found {
  text-align: center;
  padding: 100px 20px;
  color: #666;
}

.error h2,
.not-found h2 {
  font-size: 1.8rem;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
  font-size: 0.9rem;
}

.breadcrumb a {
  color: #666;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: #0066cc;
}

.breadcrumb .separator {
  color: #ccc;
}

.breadcrumb .current {
  color: #999;
}

.article-header {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e5e5e5;
}

.category {
  display: inline-block;
  padding: 6px 12px;
  background: #f0f7ff;
  color: #0066cc;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 4px;
  margin-bottom: 20px;
}

.article-title {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a1a1a;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.article-date {
  display: block;
  color: #999;
  font-size: 0.95rem;
  margin-bottom: 20px;
}

.article-excerpt {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #444;
  font-weight: 400;
}

.affiliate-disclosure {
  margin-top: 24px;
  padding: 16px;
  background: #fff9e6;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #664d00;
}

.article-body {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}

.article-body :deep(h2) {
  font-size: 1.6rem;
  font-weight: 700;
  margin-top: 50px;
  margin-bottom: 20px;
  color: #1a1a1a;
}

.article-body :deep(h3) {
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 35px;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.article-body :deep(p) {
  margin-bottom: 20px;
}

.article-body :deep(ul) {
  margin: 20px 0 20px 20px;
}

.article-body :deep(li) {
  margin-bottom: 10px;
}

.article-body :deep(hr) {
  border: none;
  border-top: 1px solid #e5e5e5;
  margin: 40px 0;
}

.article-footer {
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid #e5e5e5;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
  transition: gap 0.2s;
}

.back-link:hover {
  gap: 10px;
}

.share-section {
  margin-top: 40px;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}

.share-section h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #1a1a1a;
}

.share-section p {
  color: #666;
  line-height: 1.5;
}

.related-articles {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 2px solid #e5e5e5;
}

.related-articles h3 {
  font-size: 1.3rem;
  margin-bottom: 24px;
  color: #1a1a1a;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.related-link {
  display: block;
  padding: 20px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.related-link:hover {
  border-color: #0066cc;
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.1);
}

.related-link h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.related-link p {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .article-container {
    padding: 40px 16px;
  }

  .article-title {
    font-size: 1.8rem;
  }

  .article-body {
    font-size: 1rem;
  }

  .article-body :deep(h2) {
    font-size: 1.4rem;
  }
}
</style>
