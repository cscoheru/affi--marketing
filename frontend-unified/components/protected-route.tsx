'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      // Save the current URL for redirect after login
      sessionStorage.setItem('redirect_after_login', pathname)
      router.push('/login')
    }
  }, [isAuthenticated, router, pathname])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">请先登录</div>
      </div>
    )
  }

  return <>{children}</>
}
