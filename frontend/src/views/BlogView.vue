<template>
  <div class="blog-container">
    <!-- Header -->
    <header class="blog-header">
      <h1 class="blog-title">Coffee Enthusiast</h1>
      <p class="blog-subtitle">Honest coffee reviews and brewing tips for regular people</p>
    </header>

    <!-- Categories Filter -->
    <nav class="categories">
      <button
        :class="['category-btn', { active: selectedCategory === '' }]"
        @click="selectedCategory = ''"
      >
        All Articles
      </button>
      <button
        v-for="category in categories"
        :key="category"
        :class="['category-btn', { active: selectedCategory === category }]"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </nav>

    <!-- Articles List -->
    <main class="articles-list">
      <article
        v-for="article in filteredArticles"
        :key="article.slug"
        class="article-card"
      >
        <div class="article-meta">
          <span class="category">{{ article.category }}</span>
          <time class="date">{{ formatDate(article.date) }}</time>
        </div>

        <h2 class="article-title">
          <router-link :to="`/blog/${article.slug}`">
            {{ article.title }}
          </router-link>
        </h2>

        <p class="article-excerpt">{{ article.excerpt }}</p>

        <router-link :to="`/blog/${article.slug}`" class="read-more">
          Read More →
        </router-link>

        <!-- Affiliate Badge -->
        <span v-if="article.hasAffiliateLinks" class="affiliate-badge">
          Contains affiliate links
        </span>
      </article>

      <!-- Empty State -->
      <div v-if="filteredArticles.length === 0" class="empty-state">
        <p>No articles found in this category.</p>
      </div>
    </main>

    <!-- Footer -->
    <footer class="blog-footer">
      <p>© 2026 Coffee Enthusiast. Honest reviews for regular coffee people.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAllArticles } from '@/api/blog'
import type { BlogArticle } from '@/config/blog-articles'
import { categories } from '@/config/blog-articles'

const articles = ref<BlogArticle[]>([])
const selectedCategory = ref('')

const filteredArticles = computed(() => {
  if (!selectedCategory.value) return articles.value
  return articles.value.filter(a => a.category === selectedCategory.value)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(async () => {
  articles.value = await getAllArticles()
})
</script>

<style scoped>
.blog-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 20px;
  min-height: 100vh;
  background: #fafafa;
}

.blog-header {
  text-align: center;
  margin-bottom: 50px;
}

.blog-title {
  font-size: 2.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.blog-subtitle {
  font-size: 1.15rem;
  color: #666;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.5;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid #e5e5e5;
}

.category-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  border-color: #999;
  color: #1a1a1a;
}

.category-btn.active {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.article-card {
  padding: 40px 0;
  border-bottom: 1px solid #e5e5e5;
  position: relative;
}

.article-card:last-child {
  border-bottom: none;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0066cc;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.date {
  font-size: 0.85rem;
  color: #999;
}

.article-title {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.3;
  margin: 0 0 16px;
}

.article-title a {
  color: #1a1a1a;
  text-decoration: none;
  transition: color 0.2s;
}

.article-title a:hover {
  color: #0066cc;
}

.article-excerpt {
  font-size: 1.05rem;
  line-height: 1.6;
  color: #444;
  margin-bottom: 16px;
}

.read-more {
  color: #0066cc;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.2s;
}

.read-more:hover {
  gap: 8px;
}

.affiliate-badge {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 10px;
  background: #f0f7ff;
  color: #0066cc;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
}

.blog-footer {
  margin-top: 80px;
  padding-top: 30px;
  border-top: 1px solid #e5e5e5;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .blog-container {
    padding: 40px 16px;
  }

  .blog-title {
    font-size: 2rem;
  }

  .blog-subtitle {
    font-size: 1rem;
  }

  .article-title {
    font-size: 1.4rem;
  }

  .article-card {
    padding: 30px 0;
  }
}
</style>
