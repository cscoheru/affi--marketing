'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

/**
 * 根页面 - 根据认证状态重定向
 * - 已登录: 重定向到 /dashboard
 * - 未登录: 重定向到 /login
 */
export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, initializeAuth } = useAuthStore()

  useEffect(() => {
    // 初始化认证状态
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // 根据认证状态重定向
    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  // 加载中显示
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  )
}
