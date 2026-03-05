'use client'

import { useEffect, useRef, useState } from 'react'

interface VueComponentLoaderProps {
  componentUrl: string
  componentName: string
  props?: Record<string, any>
}

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
    let vueInstance: any = null

    async function loadVueComponent() {
      try {
        setLoading(true)
        setError(null)

        // 动态加载 Vue 组件
        const module = await import(/* @vite-ignore */ componentUrl)
        const component = (module as any)[componentName]

        if (!component) {
          throw new Error(`Component ${componentName} not found in module`)
        }

        // 挂载 Vue 组件到容器
        if (containerRef.current && mounted) {
          // 动态导入 Vue (仅在客户端)
          const vueModule = await import('vue')
          const createApp = (vueModule as any).createApp

          // 创建 Vue 应用实例
          vueInstance = createApp({
            render() {
              // @ts-ignore - Vue 组件类型
              return typeof component === 'function'
                ? component(props)
                // @ts-ignore
                : component.setup
                  ? // @ts-ignore - Composition API
                    { setup: () => component.setup(props), render: component.render || component.template }
                  // @ts-ignore - Options API
                  : component
            }
          })

          // 挂载到容器
          vueInstance.mount(containerRef.current)
        }

        setLoading(false)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load component')
          setLoading(false)
        }
      }
    }

    loadVueComponent()

    return () => {
      mounted = false
      // 清理 Vue 实例
      if (vueInstance) {
        vueInstance.unmount()
      }
    }
  }, [componentUrl, componentName])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>
  }

  return <div ref={containerRef} className="vue-component-container" />
}
