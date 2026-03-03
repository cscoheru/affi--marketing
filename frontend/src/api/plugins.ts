import request from '@/utils/request'
import type {
  ApiResponse,
  Plugin,
  PluginConfigUpdate,
  PluginExecuteRequest,
  PluginExecuteResponse
} from '@/types'

// Use mock data if backend is not available
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Mock plugins data
const mockPlugins: Plugin[] = [
  {
    id: 'plug_001',
    name: 'SEO Keyword Tracker',
    type: 'seo',
    version: '1.0.0',
    enabled: true,
    description: 'Track keyword rankings across search engines',
    config: { update_interval: 24, target_engines: ['google', 'bing'] },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'plug_002',
    name: 'Geo Location Router',
    type: 'geo',
    version: '2.1.0',
    enabled: true,
    description: 'Route traffic based on geographic location',
    config: { default_country: 'US', fallback_strategy: 'nearest' },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'plug_003',
    name: 'AI Content Optimizer',
    type: 'ai_agent',
    version: '1.5.0',
    enabled: false,
    description: 'Optimize landing page content using AI',
    config: { model: 'gpt-4', max_tokens: 2000 },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'plug_004',
    name: 'Affiliate Link Manager',
    type: 'affiliate_saas',
    version: '3.0.0',
    enabled: true,
    description: 'Manage and track affiliate links',
    config: { link_format: 'pretty', tracking_enabled: true },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'plug_005',
    name: 'Conversion Analytics',
    type: 'analytics',
    version: '1.2.0',
    enabled: true,
    description: 'Track and analyze conversion metrics',
    config: { funnel_stages: 5, attribution_model: 'last_click' },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'plug_006',
    name: 'A/B Testing Module',
    type: 'testing',
    version: '2.0.0',
    enabled: false,
    description: 'Run A/B tests on landing pages',
    config: { variants: 2, traffic_split: '50/50' },
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  }
]

// Mock plugins API
const mockPluginsApi = {
  getPlugins: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      code: 200,
      message: 'success',
      data: { items: mockPlugins },
      errors: [],
      timestamp: Date.now()
    }
  },

  getPluginDetail: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const plugin = mockPlugins.find(p => p.id === id)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    return {
      success: true,
      code: 200,
      message: 'success',
      data: plugin,
      errors: [],
      timestamp: Date.now()
    }
  },

  updatePluginConfig: async (id: string, data: PluginConfigUpdate) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const plugin = mockPlugins.find(p => p.id === id)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    Object.assign(plugin.config, data.config)
    plugin.enabled = data.enabled ?? plugin.enabled
    plugin.updated_at = new Date().toISOString()
    return {
      success: true,
      code: 200,
      message: 'Plugin config updated',
      data: plugin,
      errors: [],
      timestamp: Date.now()
    }
  },

  executePlugin: async (id: string, data: PluginExecuteRequest) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      success: true,
      code: 200,
      message: 'Plugin executed successfully',
      data: {
        result: 'Execution completed',
        output: { processed: 100, success_rate: 0.98 }
      },
      errors: [],
      timestamp: Date.now()
    }
  }
}

// Real plugins API
const realPluginsApi = {
  getPlugins: () => {
    return request.get<ApiResponse<{ items: Plugin[] }>>('/plugins')
  },

  getPluginDetail: (id: string) => {
    return request.get<ApiResponse<Plugin>>(`/plugins/${id}`)
  },

  updatePluginConfig: (id: string, data: PluginConfigUpdate) => {
    return request.put<ApiResponse<Plugin>>(`/plugins/${id}/config`, data)
  },

  executePlugin: (id: string, data: PluginExecuteRequest) => {
    return request.post<ApiResponse<PluginExecuteResponse>>(
      `/plugins/${id}/execute`,
      data
    )
  }
}

// Export appropriate API based on environment
const pluginsApi = USE_MOCK ? mockPluginsApi : realPluginsApi

export default pluginsApi
export const getPlugins = pluginsApi.getPlugins
export const getPluginDetail = pluginsApi.getPluginDetail
export const updatePluginConfig = pluginsApi.updatePluginConfig
export const executePlugin = pluginsApi.executePlugin
