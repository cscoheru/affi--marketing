export interface PublishTask {
  id: number
  contentId: number
  title: string
  platforms: string[]
  status: 'pending' | 'running' | 'success' | 'failed'
  results: PlatformResult[]
  createdAt: string
}

export interface PlatformResult {
  platform: string
  status: 'success' | 'failed'
  url?: string
  error?: string
}

export interface Platform {
  id: number
  name: string
  icon: string
  enabled: boolean
  config?: Record<string, string>
}

export interface PublishLog {
  id: number
  timestamp: string
  type: 'success' | 'warning' | 'danger' | 'info'
  message: string
}
