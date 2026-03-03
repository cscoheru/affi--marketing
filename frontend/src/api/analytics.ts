import request from '@/utils/request'
import type {
  ApiResponse,
  ExperimentOverview,
  ConversionFunnel,
  AttributionResult,
  DateFilter
} from '@/types'

// Get experiment overview
export const getOverview = (experimentId: string, filter?: DateFilter) => {
  return request.get<ApiResponse<ExperimentOverview>>(
    `/analytics/experiments/${experimentId}/overview`,
    { params: filter }
  )
}

// Get conversion funnel
export const getFunnel = (experimentId: string) => {
  return request.get<ApiResponse<ConversionFunnel>>(
    `/analytics/experiments/${experimentId}/funnel`
  )
}

// Get attribution analysis
export const getAttribution = (experimentId: string, model?: string, conversionId?: string) => {
  return request.get<ApiResponse<AttributionResult>>(
    `/analytics/experiments/${experimentId}/attribution`,
    { params: { model, conversion_id: conversionId } }
  )
}
