import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // Iframe mode: Direct view loading for embedding in Next.js
  {
    path: '/view/:viewName',
    name: 'IframeView',
    component: () => import('@/views/IframeView.vue'),
    meta: { requiresAuth: true, iframeMode: true }
  },
  // Public Blog Routes (no authentication - for Medium import)
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/views/BlogView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/blog/:slug',
    name: 'BlogArticle',
    component: () => import('@/views/BlogArticleView.vue'),
    meta: { requiresAuth: false }
  },
  // RSS Feed redirect
  {
    path: '/feed.xml',
    name: 'RSSFeed',
    redirect: () => {
      // Point to public RSS feed
      window.location.href = '/content/feed.xml'
      return { name: 'Blog' }
    },
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'experiments',
        name: 'Experiments',
        component: () => import('@/views/Experiments.vue')
      },
      {
        path: 'experiments/new',
        name: 'ExperimentCreate',
        component: () => import('@/views/ExperimentCreate.vue')
      },
      {
        path: 'experiments/:id',
        name: 'ExperimentDetail',
        component: () => import('@/views/ExperimentDetail.vue')
      },
      {
        path: 'plugins',
        name: 'Plugins',
        component: () => import('@/views/Plugins.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue')
      },
      {
        path: 'settlements',
        name: 'Settlements',
        component: () => import('@/views/Settlements.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard for authentication and page styling
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !token) {
    // Redirect to login if not authenticated
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && token) {
    // Redirect to dashboard if already logged in
    next({ name: 'Dashboard' })
  } else {
    next()
  }

  // Add/remove dashboard class for scroll control
  const app = document.getElementById('app')
  const isDashboardRoute = to.matched.some(route =>
    route.path === '/' && route.meta.requiresAuth !== false
  )

  if (isDashboardRoute) {
    app?.classList.add('is-dashboard')
  } else {
    app?.classList.remove('is-dashboard')
  }
})

export default router
