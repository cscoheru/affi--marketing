'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">数据分析</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueComponentLoader
          componentUrl="/vue-components/analytics.js"
          componentName="Analytics"
        />
      </div>
    </div>
  )
}
