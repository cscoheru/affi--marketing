'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'
import { useAuthStore } from '@/lib/store'

export default function SettlementsPage() {
  const { user, token } = useAuthStore()

  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/dist/assets/remoteEntry.js"
      exposedModule="Settlements"
      props={{ user, token, apiBaseUrl: "http://localhost:8080" }}
    />
  )
}
