'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'
import { useAuthStore } from '@/lib/store'

export default function ExperimentsPage() {
  const { user, token } = useAuthStore()

  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/dist/assets/remoteEntry.js"
      exposedModule="Experiments"
      props={{ user, token, apiBaseUrl: "http://localhost:8080" }}
    />
  )
}
