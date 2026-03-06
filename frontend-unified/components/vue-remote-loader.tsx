'use client'

import { useEffect, useRef, useState } from 'react'

interface VueRemoteLoaderProps {
  remoteUrl: string
  exposedModule: string
  props?: Record<string, unknown>
}

interface FederationSharedScope {
  [key: string]: {
    version: string
    get: () => unknown
    loaded?: boolean
  }
}

interface FederationModule {
  get: (module: string) => Promise<unknown>
  init?: (sharedScope: FederationSharedScope) => Promise<void>
  dynamicLoadingCss?: (options: unknown[], isFn: boolean, moduleId: string) => void
}

declare global {
  interface Window {
    __federation_shared__?: {
      default?: FederationSharedScope
    } & FederationSharedScope
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
    let vueInstance: unknown = null

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const remoteModule = await dynamicImport(fullUrl) as FederationModule

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
        const moduleFactory = await remoteModule.get(`./${exposedModule}`) as FederationSharedScope & { default: unknown; template?: unknown }
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vueModule = await import('vue') as any
          const createApp = vueModule.createApp

          vueInstance = createApp({
            render() {
              return typeof component === 'function'
                ? (component as (props: unknown) => unknown)(props)
                : component
            }
          })

          ;(vueInstance as { mount: (el: HTMLElement) => void }).mount(containerRef.current)
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load remote Vue component')
          setLoading(false)
        }
      }
    }

    loadRemoteComponent()

    return () => {
      mounted = false
      // Clean up Vue instance
      if (vueInstance && typeof vueInstance === 'object' && vueInstance !== null) {
        ;(vueInstance as { unmount: () => void }).unmount?.()
      }
    }
  }, [remoteUrl, exposedModule])

  return (
    <div className="vue-remote-wrapper h-full w-full">
      {loading && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-sm">加载远程组件...</div>
          </div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <div className="font-bold text-destructive">加载失败</div>
          <div className="text-sm text-destructive/80 mt-2">{error}</div>
        </div>
      )}
      <div ref={containerRef} className="vue-remote-container h-full w-full" />
    </div>
  )
}
