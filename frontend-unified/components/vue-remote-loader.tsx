'use client'

import { useEffect, useRef, useState } from 'react'

interface VueRemoteLoaderProps {
  remoteEntry: string
  remoteName: string
  exposedModule: string
  componentName: string
  props?: Record<string, any>
}

export function VueRemoteLoader({
  remoteEntry,
  remoteName,
  exposedModule,
  componentName,
  props = {}
}: VueRemoteLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    let vueInstance: any = null

    async function loadRemoteVueComponent() {
      try {
        setLoading(true)
        setError(null)

        // Load the remote entry
        const remoteEntryScript = document.createElement('script')
        remoteEntryScript.src = remoteEntry
        remoteEntryScript.type = 'module'

        await new Promise((resolve, reject) => {
          remoteEntryScript.onload = resolve
          remoteEntryScript.onerror = reject
          document.head.appendChild(remoteEntryScript)
        })

        // Wait a bit for the module to initialize
        await new Promise(resolve => setTimeout(resolve, 100))

        // Access the remote module from window
        // In dev mode, Vite serves the module at /dist/assets/remoteEntry.js
        // We need to import it and call get() to load the exposed module
        const moduleUrl = remoteEntry.replace('remoteEntry.js', '') + `__federation_expose_${componentName}`

        // For Module Federation with @originjs/vite-plugin-federation
        // The remote entry exports a `get` function
        const response = await fetch(remoteEntry)
        const moduleText = await response.text()

        // Create a blob URL for the module
        const blob = new Blob([moduleText], { type: 'application/javascript' })
        const moduleUrl2 = URL.createObjectURL(blob)

        const remoteModule = await import(moduleUrl2)
        const get = remoteModule.get

        if (!get) {
          throw new Error('Remote entry does not export a get function')
        }

        // Initialize shared dependencies (Vue, etc.)
        await remoteModule.init?.({
          vue: { version: '3.5.13', requiredVersion: '^3.5.0' },
          pinia: { version: '2.2.4', requiredVersion: '^2.1.0' },
          'element-plus': { version: '2.9.2', requiredVersion: '^2.8.0' }
        })

        // Load the exposed module
        const exposed = await get(`./${componentName}`)
        const component = exposed.default || exposed

        if (!component) {
          throw new Error(`Component ${componentName} not found in exposed module`)
        }

        // Load Vue and create app
        const vueModule = await import('vue')
        const createApp = vueModule.createApp

        if (containerRef.current && mounted) {
          vueInstance = createApp({
            render() {
              // @ts-ignore
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
          setError(err instanceof Error ? err.message : 'Failed to load component')
          setLoading(false)
        }
      }
    }

    loadRemoteVueComponent()

    return () => {
      mounted = false
      if (vueInstance) {
        vueInstance.unmount()
      }
    }
  }, [remoteEntry, remoteName, exposedModule, componentName])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading Vue component...</div>
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        <div className="font-bold">Error loading Vue component:</div>
        <div className="text-sm mt-2">{error}</div>
        <div className="text-xs mt-4 text-gray-500">
          Remote entry: {remoteEntry}<br />
          Component: {componentName}
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className="vue-remote-container" />
}
