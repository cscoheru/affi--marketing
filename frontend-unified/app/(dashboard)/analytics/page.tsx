'use client'

import { VuePlaceholder } from '@/components/vue-placeholder'

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">数据分析</h1>
      <VuePlaceholder
        title="Analytics"
        description="数据分析模块正在迁移中，即将上线。"
        icon="📈"
      />
    </div>
  )
}
