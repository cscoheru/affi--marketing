import request from '@/utils/request'
import type {
  ApiResponse,
  PaginatedResponse,
  Experiment,
  ExperimentQuery,
  CreateExperimentRequest,
  UpdateExperimentRequest
} from '@/types'
import { mockExperiments } from '@/api/mock/experiments'

// Use mock data if backend is not available
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Helper function to generate mock metrics
function generateMockMetrics() {
  return {
    total_visitors: Math.floor(Math.random() * 50000) + 1000,
    conversions: Math.floor(Math.random() * 2000) + 100,
    revenue: Math.floor(Math.random() * 50000) + 1000,
    conversion_rate: Math.random() * 0.1 + 0.01
  }
}

// Mock API functions
const mockExperimentApi = {
  list: async (params?: ExperimentQuery): Promise<ApiResponse<PaginatedResponse<Experiment>>> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    let filtered = [...mockExperiments]

    // Filter by type
    if (params?.type) {
      filtered = filtered.filter((e) => e.type === params.type)
    }

    // Filter by status
    if (params?.status) {
      filtered = filtered.filter((e) => e.status === params.status)
    }

    // Search
    if (params?.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(search))
    }

    // Pagination
    const page = params?.page || 1
    const size = params?.size || 20
    const start = (page - 1) * size
    const items = filtered.slice(start, start + size)

    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        items,
        total: filtered.length,
        page,
        size
      },
      errors: [],
      timestamp: Date.now()
    }
  },

  detail: async (id: string): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const experiment = mockExperiments.find((e) => e.id === id)
    if (!experiment) {
      throw new Error('Experiment not found')
    }
    return {
      success: true,
      code: 200,
      message: 'success',
      data: { ...experiment, metrics: generateMockMetrics() },
      errors: [],
      timestamp: Date.now()
    }
  },

  create: async (data: CreateExperimentRequest): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const newExperiment: Experiment = {
      id: `exp_${Date.now()}`,
      name: data.name,
      type: data.type,
      status: 'draft',
      config: data.config,
      created_by: 'usr_001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockExperiments.push(newExperiment)
    return {
      success: true,
      code: 201,
      message: 'Experiment created',
      data: newExperiment,
      errors: [],
      timestamp: Date.now()
    }
  },

  update: async (id: string, data: UpdateExperimentRequest): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const index = mockExperiments.findIndex((e) => e.id === id)
    if (index === -1) {
      throw new Error('Experiment not found')
    }
    Object.assign(mockExperiments[index], data, { updated_at: new Date().toISOString() })
    return {
      success: true,
      code: 200,
      message: 'Experiment updated',
      data: mockExperiments[index],
      errors: [],
      timestamp: Date.now()
    }
  },

  delete: async (): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      code: 200,
      message: 'Experiment deleted',
      data: undefined,
      errors: [],
      timestamp: Date.now()
    }
  },

  start: async (): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    mockExperiments[0].status = 'active'
    return {
      success: true,
      code: 200,
      message: 'Experiment started',
      data: mockExperiments[0],
      errors: [],
      timestamp: Date.now()
    }
  },

  stop: async (): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    mockExperiments[0].status = 'completed'
    return {
      success: true,
      code: 200,
      message: 'Experiment stopped',
      data: mockExperiments[0],
      errors: [],
      timestamp: Date.now()
    }
  },

  pause: async (): Promise<ApiResponse<Experiment>> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    mockExperiments[0].status = 'paused'
    return {
      success: true,
      code: 200,
      message: 'Experiment paused',
      data: mockExperiments[0],
      errors: [],
      timestamp: Date.now()
    }
  }
}

// Real API functions
const realExperimentApi = {
  list: (params?: ExperimentQuery) => {
    return request.get<ApiResponse<PaginatedResponse<Experiment>>>('/experiments', { params })
  },

  detail: (id: string) => {
    return request.get<ApiResponse<Experiment>>(`/experiments/${id}`)
  },

  create: (data: CreateExperimentRequest) => {
    return request.post<ApiResponse<Experiment>>('/experiments', data)
  },

  update: (id: string, data: UpdateExperimentRequest) => {
    return request.put<ApiResponse<Experiment>>(`/experiments/${id}`, data)
  },

  delete: (id: string) => {
    return request.delete<ApiResponse<void>>(`/experiments/${id}`)
  },

  start: (id: string) => {
    return request.post<ApiResponse<Experiment>>(`/experiments/${id}/start`)
  },

  stop: (id: string) => {
    return request.post<ApiResponse<Experiment>>(`/experiments/${id}/stop`)
  },

  pause: (id: string) => {
    return request.post<ApiResponse<Experiment>>(`/experiments/${id}/pause`)
  }
}

// Export appropriate API based on environment
const experimentApi = USE_MOCK ? mockExperimentApi : realExperimentApi

export default experimentApi
