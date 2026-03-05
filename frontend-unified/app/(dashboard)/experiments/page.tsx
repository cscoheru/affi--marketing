'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function ExperimentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">实验管理</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueComponentLoader
          componentUrl="/vue-components/experiments.js"
          componentName="Experiments"
        />
      </div>
    </div>
  )
}
