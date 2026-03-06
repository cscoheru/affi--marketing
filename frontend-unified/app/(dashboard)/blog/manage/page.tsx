'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BlogManagePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/blog/admin')
  }, [router])

  return null
}
