'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueComponentLoader
          componentUrl="/vue-components/dashboard.js"
          componentName="Dashboard"
        />
      </div>
    </div>
  )
}
