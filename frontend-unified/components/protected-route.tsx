'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, initializeAuth } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    initializeAuth()
    // Small delay to ensure state is updated before redirect check
    const timer = setTimeout(() => {
      setIsInitialized(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [initializeAuth])

  // Handle redirect after initialization
  useEffect(() => {
    if (!isInitialized) return

    if (!isAuthenticated) {
      // Save the current URL for redirect after login
      sessionStorage.setItem('redirect_after_login', pathname)
      router.push('/login')
    }
  }, [isAuthenticated, isInitialized, router, pathname])

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">请先登录</div>
      </div>
    )
  }

  return <>{children}</>
}
