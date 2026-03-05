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
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
