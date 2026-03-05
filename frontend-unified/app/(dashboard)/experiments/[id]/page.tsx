'use client'

import { VueRemoteLoader } from '@/components/vue-remote-loader'
import { useAuthStore } from '@/lib/store'
import { useParams } from 'next/navigation'

export default function ExperimentDetailPage() {
  const { user, token } = useAuthStore()
  const params = useParams()
  const id = params.id as string

  return (
    <VueRemoteLoader
      remoteUrl="/vue-remote/assets/remoteEntry.js"
      exposedModule="ExperimentDetail"
      props={{ user, token, apiBaseUrl: "http://localhost:8080", experimentId: id }}
    />
  )
}