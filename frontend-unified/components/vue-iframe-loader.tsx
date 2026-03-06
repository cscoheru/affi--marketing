'use client'

import { useEffect, useRef, useState } from 'react'

interface VueIframeLoaderProps {
  src: string
  viewName: string
  className?: string
}

declare global {
  interface Window {
    __vueIframeListeners?: Map<string, (data: unknown) => void>
  }
}

export function VueIframeLoader({ src, viewName, className = '' }: VueIframeLoaderProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 验证来源
      if (event.origin !== window.location.origin) {
        return
      }

      const { type, payload } = event.data

      switch (type) {
        case 'vue:mounted':
          setLoading(false)
          break
        case 'vue:error':
          setError(payload.message || 'Unknown error')
          setLoading(false)
          break
        case 'vue:ready':
          setLoading(false)
          break
      }
    }

    window.addEventListener('message', handleMessage)

    // 初始化监听器映射
    if (!window.__vueIframeListeners) {
      window.__vueIframeListeners = new Map()
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 构建完整的 iframe URL
  const iframeSrc = `${src}#/view/${viewName}`

  return (
    <div className={`vue-iframe-wrapper ${className}`}>
      {loading && (
        <div className="flex items-center justify-center p-8 text-gray-600">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <div className="text-sm">Loading Vue component...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="font-bold text-red-700">Error loading Vue component</div>
          <div className="text-sm text-red-600 mt-2">{error}</div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className={`w-full h-full border-0 ${loading ? 'hidden' : ''}`}
        onLoad={() => {
          // Iframe loaded, wait for Vue app to send ready message
        }}
        onError={() => {
          setError('Failed to load iframe')
          setLoading(false)
        }}
      />
    </div>
  )
}
