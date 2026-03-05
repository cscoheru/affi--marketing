'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'

export default function AnalyticsPage() {
  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/assets/remoteEntry.js"
      exposedModule="Analytics"
    />
  )
}
