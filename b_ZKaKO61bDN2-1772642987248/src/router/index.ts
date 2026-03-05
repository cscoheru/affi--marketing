import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/products',
    children: [
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '产品候选库', icon: 'ShoppingCart' }
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/Materials.vue'),
        meta: { title: '素材库', icon: 'Folder' }
      },
      {
        path: 'content',
        name: 'Content',
        component: () => import('@/views/Content.vue'),
        meta: { title: '内容管理', icon: 'Document' }
      },
      {
        path: 'publish',
        name: 'Publish',
        component: () => import('@/views/Publish.vue'),
        meta: { title: '发布中心', icon: 'Upload' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
