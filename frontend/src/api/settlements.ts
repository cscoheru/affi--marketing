import request from '@/utils/request'
import type {
  ApiResponse,
  PaginatedResponse,
  Settlement,
  SettlementQuery,
  CreateSettlementRequest
} from '@/types'

// Get settlement list
export const getSettlements = (params?: SettlementQuery) => {
  return request.get<ApiResponse<PaginatedResponse<Settlement>>>(
    '/settlements',
    { params }
  )
}

// Create settlement
export const createSettlement = (data: CreateSettlementRequest) => {
  return request.post<ApiResponse<Settlement>>(
    '/settlements',
    data
  )
}

// Confirm settlement
export const confirmSettlement = (id: string) => {
  return request.post<ApiResponse<Settlement>>(
    `/settlements/${id}/confirm`
  )
}

// Get settlement detail
export const getSettlementDetail = (id: string) => {
  return request.get<ApiResponse<Settlement>>(
    `/settlements/${id}`
  )
}
