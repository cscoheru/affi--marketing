'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'
import { useAuthStore } from '@/lib/store'

export default function AnalyticsPage() {
  const { user, token } = useAuthStore()

  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/dist/assets/remoteEntry.js"
      exposedModule="Analytics"
      props={{ user, token, apiBaseUrl: "http://localhost:8080" }}
    />
  )
}
