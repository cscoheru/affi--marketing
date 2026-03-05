'use client'

import { VuePlaceholder } from '@/components/vue-placeholder'

export default function ExperimentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">实验管理</h1>
      <VuePlaceholder
        title="Experiments"
        description="实验管理模块正在迁移中，即将上线。"
        icon="🧪"
      />
    </div>
  )
}
