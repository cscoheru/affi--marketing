'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function PluginsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">插件市场</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueComponentLoader
          componentUrl="/vue-components/plugins.js"
          componentName="Plugins"
        />
      </div>
    </div>
  )
}
