'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'

export default function SettlementsPage() {
  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/assets/remoteEntry.js"
      exposedModule="Settlements"
    />
  )
}
