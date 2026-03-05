'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueRemoteLoader
          remoteUrl="/vue-remote/dist/assets/remoteEntry.js"
          exposedModule="Dashboard"
        />
      </div>
    </div>
  )
}
