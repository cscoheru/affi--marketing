<template>
  <div class="blog-container">
    <!-- Hero Header -->
    <header class="blog-hero">
      <div class="hero-content">
        <h1 class="blog-title">Coffee Enthusiast</h1>
        <p class="blog-subtitle">Honest coffee reviews and brewing tips for regular people who love coffee but don't want to make it a religion.</p>
      </div>
      <div class="hero-stats">
        <div class="stat">
          <span class="stat-number">{{ articles.length }}</span>
          <span class="stat-label">Articles</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ categories.length }}</span>
          <span class="stat-label">Categories</span>
        </div>
      </div>
    </header>

    <!-- Categories Navigation -->
    <nav class="categories-nav">
      <div class="categories-wrapper">
        <button
          :class="['category-item', { active: selectedCategory === '' }]"
          @click="selectCategory('')"
        >
          All Posts
        </button>
        <button
          v-for="category in categories"
          :key="category"
          :class="['category-item', { active: selectedCategory === category }]"
          @click="selectCategory(category)"
        >
          {{ category }}
          <span class="count">{{ getCategoryCount(category) }}</span>
        </button>
      </div>
    </nav>

    <!-- Featured Article (first article) -->
    <section v-if="currentPage === 1 && !selectedCategory && featuredArticle" class="featured-article">
      <router-link :to="`/blog/${featuredArticle.slug}`" class="featured-link">
        <div class="featured-image-wrapper">
          <img :src="featuredArticle.image" :alt="featuredArticle.title" class="featured-image">
          <div class="featured-overlay">
            <span class="featured-badge">Featured</span>
          </div>
        </div>
        <div class="featured-content">
          <span class="article-category">{{ featuredArticle.category }}</span>
          <h2 class="featured-title">{{ featuredArticle.title }}</h2>
          <p class="featured-excerpt">{{ featuredArticle.excerpt }}</p>
          <div class="article-meta">
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V7h-5V3.5A2.5 2.5 0 0 1 8 1zm3.5 7V3.5a3.5 3.5 0 1 0-7 0V8H1v10h14V8h-3.5z"/>
              </svg>
              {{ featuredArticle.author }}
            </span>
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
              {{ featuredArticle.readTime }}
            </span>
            <span class="meta-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
              </svg>
              {{ formatDate(featuredArticle.date) }}
            </span>
          </div>
        </div>
      </router-link>
    </section>

    <!-- Articles Grid -->
    <main class="articles-main">
      <div class="articles-grid">
        <article
          v-for="article in paginatedArticles"
          :key="article.slug"
          class="article-card"
        >
          <router-link :to="`/blog/${article.slug}`" class="article-link">
            <div class="article-image-wrapper">
              <img :src="article.image" :alt="article.title" class="article-image" loading="lazy">
              <span class="article-category-badge">{{ article.category }}</span>
            </div>

            <div class="article-body">
              <h2 class="article-title">{{ article.title }}</h2>
              <p class="article-excerpt">{{ article.excerpt }}</p>

              <div class="article-footer">
                <div class="article-meta-inline">
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                    </svg>
                    {{ article.readTime }}
                  </span>
                  <span class="meta-item">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                    {{ formatDate(article.date) }}
                  </span>
                </div>
                <span class="read-more">Read Article →</span>
              </div>

              <span v-if="article.hasAffiliateLinks" class="affiliate-badge">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                Affiliate Links
              </span>
            </div>
          </router-link>
        </article>
      </div>

      <!-- Empty State -->
      <div v-if="filteredArticles.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <h3>No articles found</h3>
        <p>Try selecting a different category</p>
        <button @click="selectedCategory = ''" class="btn-secondary">View All Articles</button>
      </div>
    </main>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="pagination">
      <button
        :class="['pagination-btn', { disabled: currentPage === 1 }]"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        Previous
      </button>

      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          :class="['pagination-page', { active: page === currentPage }]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
        :class="['pagination-btn', { disabled: currentPage === totalPages }]"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Next
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </nav>

    <!-- Newsletter Section -->
    <section class="newsletter-section">
      <div class="newsletter-content">
        <h2>Stay Updated</h2>
        <p>Get the latest coffee tips and reviews delivered to your inbox. No spam, just good coffee advice.</p>
        <form class="newsletter-form" @submit.prevent>
          <input type="email" placeholder="Enter your email" class="newsletter-input">
          <button type="submit" class="newsletter-btn">Subscribe</button>
        </form>
      </div>
    </section>

    <!-- Footer -->
    <footer class="blog-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>Coffee Enthusiast</h3>
          <p>Honest coffee reviews and brewing tips for regular people.</p>
        </div>
        <div class="footer-section">
          <h4>Categories</h4>
          <ul>
            <li v-for="category in categories" :key="category">
            <a href="#" @click.prevent="selectCategory(category)">{{ category }}</a>
            </li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 Coffee Enthusiast. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getAllArticles } from '@/api/blog'
import type { BlogArticle } from '@/config/blog-articles'
import { categories } from '@/config/blog-articles'

const articles = ref<BlogArticle[]>([])
const selectedCategory = ref('')
const currentPage = ref(1)
const postsPerPage = 6

const featuredArticle = computed(() => {
  return articles.value[0] || null
})

const filteredArticles = computed(() => {
  let result = articles.value
  if (selectedCategory.value) {
    result = result.filter(a => a.category === selectedCategory.value)
  }
  return result
})

const paginatedArticles = computed(() => {
  let result = filteredArticles.value
  // Skip featured article on first page when no category filter
  if (currentPage.value === 1 && !selectedCategory.value) {
    result = result.slice(1)
  }
  const start = (currentPage.value - 1) * postsPerPage
  const end = start + postsPerPage
  return result.slice(start, end)
})

const totalPages = computed(() => {
  let total = filteredArticles.value.length
  // Adjust for featured article
  if (currentPage.value === 1 && !selectedCategory.value) {
    total = Math.max(0, total - 1)
  }
  return Math.ceil(total / postsPerPage)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getCategoryCount = (category: string) => {
  return articles.value.filter(a => a.category === category).length
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

watch(selectedCategory, () => {
  currentPage.value = 1
})

onMounted(async () => {
  articles.value = await getAllArticles()
})
</script>

<style scoped>
.blog-container {
  min-height: 100vh;
  background: #f8f9fa;
}

/* Hero Header */
.blog-hero {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  color: white;
  padding: 80px 20px 60px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto 40px;
}

.blog-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.03em;
}

.blog-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 40px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Categories Navigation */
.categories-nav {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.categories-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.categories-wrapper::-webkit-scrollbar {
  display: none;
}

.category-item {
  padding: 16px 20px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  position: relative;
}

.category-item:hover {
  color: #1a1a1a;
}

.category-item.active {
  color: #1a1a1a;
}

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 3px;
  background: #1a1a1a;
  border-radius: 3px 3px 0 0;
}

.category-item .count {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 8px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #9ca3af;
}

/* Featured Article */
.featured-article {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
}

.featured-link {
  display: block;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  text-decoration: none;
}

.featured-link:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.featured-image-wrapper {
  position: relative;
  height: 400px;
  overflow: hidden;
}

.featured-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
}

.featured-badge {
  background: #f59e0b;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.featured-content {
  padding: 40px;
}

.article-category {
  display: inline-block;
  color: #6366f1;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.featured-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 16px;
  line-height: 1.3;
}

.featured-excerpt {
  font-size: 1.1rem;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 24px;
}

.article-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.meta-item svg {
  opacity: 0.7;
}

/* Articles Grid */
.articles-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 30px;
}

.article-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.article-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.article-image-wrapper {
  position: relative;
  height: 220px;
  overflow: hidden;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.article-card:hover .article-image {
  transform: scale(1.05);
}

.article-category-badge {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(26, 26, 26, 0.9);
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.article-body {
  padding: 24px;
}

.article-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-excerpt {
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-meta-inline {
  display: flex;
  gap: 16px;
}

.read-more {
  color: #6366f1;
  font-weight: 600;
  font-size: 0.9rem;
  transition: gap 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-card:hover .read-more {
  gap: 8px;
}

.affiliate-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 6px 12px;
  background: #fef3c7;
  color: #d97706;
  font-size: 0.75rem;
  border-radius: 6px;
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 24px;
}

.btn-secondary {
  padding: 12px 24px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #333;
}

/* Pagination */
.pagination {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled) {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: white;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 8px;
}

.pagination-page {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-page:hover {
  border-color: #1a1a1a;
}

.pagination-page.active {
  background: #1a1a1a;
  color: white;
  border-color: #1a1a1a;
}

/* Newsletter */
.newsletter-section {
  background: #1a1a1a;
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.newsletter-content {
  max-width: 600px;
  margin: 0 auto;
}

.newsletter-section h2 {
  font-size: 2rem;
  margin-bottom: 12px;
}

.newsletter-section p {
  opacity: 0.8;
  margin-bottom: 32px;
}

.newsletter-form {
  display: flex;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.newsletter-input {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
}

.newsletter-btn {
  padding: 14px 28px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.newsletter-btn:hover {
  background: #e08e0b;
}

/* Footer */
.blog-footer {
  background: #f3f4f6;
  padding: 60px 20px 30px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h3,
.footer-section h4 {
  margin-bottom: 16px;
  color: #1a1a1a;
}

.footer-section p {
  color: #6b7280;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 8px;
}

.footer-section a {
  color: #6b7280;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-section a:hover {
  color: #1a1a1a;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .blog-title {
    font-size: 2.5rem;
  }

  .blog-subtitle {
    font-size: 1.1rem;
  }

  .hero-stats {
    gap: 30px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .featured-image-wrapper {
    height: 250px;
  }

  .featured-content {
    padding: 24px;
  }

  .featured-title {
    font-size: 1.5rem;
  }

  .articles-grid {
    grid-template-columns: 1fr;
  }

  .footer-content {
    grid-template-columns: 1fr;
  }

  .newsletter-form {
    flex-direction: column;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .blog-hero {
    padding: 60px 20px 40px;
  }

  .blog-title {
    font-size: 2rem;
  }

  .article-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
