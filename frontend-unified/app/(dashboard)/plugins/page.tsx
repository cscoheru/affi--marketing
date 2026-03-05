'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'
import { useAuthStore } from '@/lib/store'

export default function PluginsPage() {
  const { user, token } = useAuthStore()

  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/assets/remoteEntry.js"
      exposedModule="Plugins"
      props={{ user, token, apiBaseUrl: "http://localhost:8080" }}
    />
  )
}
