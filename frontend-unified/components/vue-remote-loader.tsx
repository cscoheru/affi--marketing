'use client'

import { useEffect, useRef, useState } from 'react'

interface VueRemoteLoaderProps {
  remoteUrl: string
  exposedModule: string
  props?: Record<string, any>
}

declare global {
  interface Window {
    __federation_shared__?: any
  }
}

export function VueRemoteLoader({
  remoteUrl,
  exposedModule,
  props = {}
}: VueRemoteLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let vueInstance: any = null

    async function loadRemoteComponent() {
      try {
        setLoading(true)
        setError(null)

        // Initialize shared scope
        if (!window.__federation_shared__) {
          window.__federation_shared__ = {}
        }

        const defaultScope = window.__federation_shared__['default'] = window.__federation_shared__['default'] || {}

        // Load Vue as shared dependency
        if (!defaultScope.vue) {
          const vueModule = await import('vue') as any
          const vue = vueModule.default || vueModule
          defaultScope.vue = {
            version: '3.5.13',
            get: () => vue
          }
        }

        // Determine full URL
        const fullUrl = remoteUrl.startsWith('http')
          ? remoteUrl
          : `${window.location.origin}${remoteUrl}`

        // Dynamically import the remote entry
        // Use Function constructor to avoid bundler trying to resolve the path
        const dynamicImport = new Function('url', 'return import(url)')
        const remoteModule = await dynamicImport(fullUrl)

        if (!remoteModule || !remoteModule.get) {
          throw new Error('Remote entry does not export a get function')
        }

        // Initialize shared dependencies
        if (remoteModule.init) {
          await remoteModule.init({
            vue: defaultScope.vue
          })
        }

        // Load the exposed module
        const moduleFactory = await remoteModule.get(`./${exposedModule}`)
        const component = moduleFactory.default || moduleFactory

        if (!component) {
          throw new Error(`Module ${exposedModule} not found or has no default export`)
        }

        // Load styles if available
        if (remoteModule.dynamicLoadingCss) {
          remoteModule.dynamicLoadingCss([], false, `./${exposedModule}`)
        }

        // Create and mount Vue app
        if (containerRef.current && mounted) {
          const vueModule = await import('vue') as any
          const createApp = vueModule.createApp

          vueInstance = createApp({
            render() {
              return typeof component === 'function'
                ? component(props)
                : component
            }
          })

          vueInstance.mount(containerRef.current)
        }

        setLoading(false)
      } catch (err) {
        if (mounted) {
          console.error('Failed to load remote Vue component:', err)
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      }
    }

    loadRemoteComponent()

    return () => {
      mounted = false
      if (vueInstance) {
        vueInstance.unmount()
      }
    }
  }, [remoteUrl, exposedModule])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-600">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          <div className="text-sm">Loading Vue component...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="font-bold text-red-700">Error loading Vue component</div>
        <div className="text-sm text-red-600 mt-2">{error}</div>
        <div className="text-xs text-gray-500 mt-4 font-mono bg-gray-100 p-2 rounded">
          <div>Remote URL: {remoteUrl}</div>
          <div>Module: {exposedModule}</div>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="vue-remote-container w-full h-full" />
}
