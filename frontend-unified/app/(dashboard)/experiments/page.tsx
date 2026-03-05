'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'

export default function ExperimentsPage() {
  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/assets/remoteEntry.js"
      exposedModule="Experiments"
    />
  )
}
