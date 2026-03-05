'use client'

import { VuePlaceholder } from '@/components/vue-placeholder'

export default function PluginsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">插件管理</h1>
      <VuePlaceholder
        title="Plugins"
        description="插件管理模块正在迁移中，即将上线。"
        icon="🔌"
      />
    </div>
  )
}
