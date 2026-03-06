'use client'

import { UnifiedSidebar } from '@/components/unified-sidebar'
import { ProtectedRoute } from '@/components/protected-route'

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <UnifiedSidebar />
        {/* 移动端添加顶部间距，避免被固定顶部栏遮挡 */}
        <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
