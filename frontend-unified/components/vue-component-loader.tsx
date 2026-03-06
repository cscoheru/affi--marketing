'use client'

import { useEffect, useRef, useState } from 'react'

interface VueComponentLoaderProps {
  componentUrl: string
  componentName: string
  props?: Record<string, unknown>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VueAppInstance = any

export function VueComponentLoader({
  componentUrl,
  componentName,
  props = {}
}: VueComponentLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let vueInstance: VueAppInstance | null = null

    async function loadVueComponent() {
      try {
        setLoading(true)
        setError(null)

        // 动态加载 Vue 组件
        const vueComponentModule = await import(/* @vite-ignore */ componentUrl)
        const component = (vueComponentModule as Record<string, unknown>)[componentName]

        if (!component) {
          throw new Error(`Component ${componentName} not found in module`)
        }

        // 挂载 Vue 组件到容器
        if (containerRef.current && mounted) {
          // 动态导入 Vue (仅在客户端)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vueModule = await import('vue') as any
          const createApp = vueModule.createApp

          // 创建 Vue 应用实例
          vueInstance = createApp({
            render() {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return typeof component === 'function'
                ? component(props)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                : (component as any)?.setup
                  ? {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setup: () => (component as any).setup(props),
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      render: (component as any).render || (component as any).template
                    }
                  : component
            }
          })

          // 挂载到容器
          vueInstance.mount(containerRef.current)
        }

        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load Vue component')
          setLoading(false)
        }
      }
    }

    loadVueComponent()

    return () => {
      mounted = false
      // 清理 Vue 实例
      try {
        vueInstance?.unmount()
      } catch {
        // Ignore unmount errors
      }
    }
  }, [componentUrl, componentName])

  return (
    <div ref={containerRef} className="vue-component-container">
      {loading && <div className="text-center py-8 text-muted-foreground">加载中...</div>}
      {error && <div className="text-center py-8 text-destructive">加载失败: {error}</div>}
    </div>
  )
}
