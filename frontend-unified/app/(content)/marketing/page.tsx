'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Marketing Center Page
 * This page redirects to the publish page which contains the actual marketing center functionality.
 * The navigation uses /marketing but the actual implementation is at /publish.
 */
export default function MarketingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the publish page
    router.replace('/publish')
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">正在前往营销中心...</p>
      </div>
    </div>
  )
}
