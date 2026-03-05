'use client'

import { VuePlaceholder } from '@/components/vue-placeholder'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <VuePlaceholder
        title="Dashboard"
        description="仪表板正在迁移中，即将上线。"
        icon="📊"
      />
    </div>
  )
}
