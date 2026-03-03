// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
  errors: Array<{ field: string; message: string }>
  timestamp: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// ============================================
// Authentication Types
// ============================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  refresh_token: string
  user: User
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// ============================================
// User Types
// ============================================

export type UserRole = 'admin' | 'user' | 'affiliate'

export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  api_token?: string
  last_login?: string
  created_at: string
  updated_at: string
}

// ============================================
// Experiment Types
// ============================================

export type ExperimentType = 'seo' | 'geo' | 'ai_agent' | 'affiliate_saas'

export type ExperimentStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export interface Experiment {
  id: string
  name: string
  type: ExperimentType
  status: ExperimentStatus
  config: ExperimentConfig
  metadata?: Record<string, any>
  start_date?: string
  end_date?: string
  created_by: string
  created_at: string
  updated_at: string
  // Expanded fields from API
  metrics?: ExperimentMetrics
}

export interface ExperimentConfig {
  seo_config?: SEOExperimentConfig
  geo_config?: GEOExperimentConfig
  ai_agent_config?: AIAgentExperimentConfig
  affiliate_saas_config?: AffiliateSAASConfig
}

export interface SEOExperimentConfig {
  target_keywords: string[]
  content_frequency: number
  target_platforms?: string[]
  auto_publish: boolean
  affiliate_networks?: string[]
}

export interface GEOExperimentConfig {
  target_queries: string[]
  generation_model: string
  optimization_goals: string[]
}

export interface AIAgentExperimentConfig {
  agent_type: string
  product_categories: string[]
  target_demographics: string[]
  commission_rate: number
}

export interface AffiliateSAASConfig {
  merchant_domains: string[]
  commission_tiers: CommissionTier[]
  cookie_duration: number
  approval_workflow: string
}

export interface CommissionTier {
  min_amount: number
  max_amount?: number
  commission_rate: number
}

export interface ExperimentMetrics {
  total_visitors: number
  conversions: number
  revenue: number
  conversion_rate: number
}

export interface ExperimentQuery {
  page?: number
  size?: number
  type?: ExperimentType
  status?: ExperimentStatus
  search?: string
}

// ============================================
// Tracking Types
// ============================================

export type TrackEventType = 'page_view' | 'click' | 'submit' | 'purchase' | 'signup' | 'custom'

export interface TrackEvent {
  experiment_id: string
  visitor_id: string
  session_id: string
  event_type: TrackEventType
  properties: Record<string, any>
  touchpoints?: Touchpoint[]
  timestamp: number
}

export interface Touchpoint {
  channel: string
  source: string
  campaign?: string
  content?: string
  term?: string
  medium?: string
  position?: number
}

export interface BatchTrackRequest {
  events: TrackEvent[]
}

// ============================================
// Conversion Types
// ============================================

export type ConversionType = 'lead' | 'signup' | 'purchase' | 'subscription' | 'custom'

export type ConversionStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export interface Conversion {
  id: string
  experiment_id: string
  track_id: string
  visitor_id: string
  type: ConversionType
  amount: number
  currency: string
  status: ConversionStatus
  attributed_to?: string
  attribution_model: string
  attribution_value: number
  properties?: Record<string, any>
  occurred_at: string
  created_at: string
}

// ============================================
// Settlement Types
// ============================================

export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Settlement {
  id: string
  conversion_id: string
  period: string // YYYY-MM format
  total_amount: number
  currency: string
  platform_fee: number
  affiliate_share: number
  breakdown: SettlementBreakdown
  status: SettlementStatus
  invoice_url?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface SettlementBreakdown {
  items: SettlementItem[]
}

export interface SettlementItem {
  description: string
  amount: number
  percentage: number
}

export interface SettlementQuery {
  page?: number
  size?: number
  period?: string
  status?: SettlementStatus
}

// ============================================
// Plugin Types
// ============================================

export type PluginType = 'seo' | 'attribution' | 'settlement' | 'tracking' | 'ai' | 'geo' | 'ai_agent' | 'affiliate_saas' | 'analytics' | 'testing'

export interface Plugin {
  id: string
  name: string
  type: PluginType
  version: string
  description?: string
  enabled: boolean
  config: Record<string, any>
  info?: PluginInfo
  created_at?: string
  updated_at?: string
}

export interface PluginInfo {
  author: string
  dependencies?: string[]
  documentation_url?: string
}

export interface PluginConfigUpdate {
  enabled?: boolean
  config?: Record<string, any>
  parameters?: Record<string, any>
}

export interface PluginExecuteRequest {
  type: string
  data: Record<string, any>
  context?: {
    experiment_id?: string
  }
}

export interface PluginExecuteResponse {
  result: Record<string, any>
  metrics: {
    duration_ms: number
    tokens_used?: number
  }
}

// ============================================
// Analytics Types
// ============================================

export interface ExperimentOverview {
  experiment: {
    id: string
    name: string
  }
  metrics: {
    visitors: number
    page_views: number
    conversions: number
    revenue: number
    conversion_rate: number
    avg_order_value: number
  }
  trends: {
    visitors_trend: Array<{ date: string; value: number }>
    conversions_trend: Array<{ date: string; value: number }>
  }
  top_sources: Array<{
    source: string
    visitors: number
    conversions: number
    revenue: number
  }>
}

export interface FunnelStep {
  name: string
  count: number
  conversion_rate: number
}

export interface ConversionFunnel {
  steps: FunnelStep[]
  overall_conversion_rate: number
}

export type AttributionModel = 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'position_based'

export interface AttributionResult {
  model: AttributionModel
  attribution: Array<{
    touchpoint_id: string
    channel: string
    source: string
    conversions: number
    revenue: number
    contribution: number
  }>
}

// ============================================
// SEO Content Types
// ============================================

export type ContentStatus = 'draft' | 'generated' | 'published' | 'archived'

export interface SEOContent {
  id: string
  experiment_id: string
  title: string
  content: string
  summary: string
  keywords: string[]
  meta_tags: MetaTags
  status: ContentStatus
  published_at?: string
  url?: string
  metrics: ContentMetrics
  created_at: string
  updated_at: string
}

export interface MetaTags {
  title: string
  description: string
  keywords?: string
  og_title?: string
  og_image?: string
  canonical?: string
}

export interface ContentMetrics {
  views: number
  clicks: number
  conversions: number
  revenue: number
  serp_rank?: number
  backlinks?: number
}

// ============================================
// Visitor Types
// ============================================

export interface Visitor {
  id: string
  fingerprint: string
  first_seen: string
  last_seen: string
  session_count: number
  properties: Record<string, any>
  custom_id?: string
  created_at: string
  updated_at: string
}

// ============================================
// System Types
// ============================================

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  version: string
  services: {
    database: string
    redis: string
    minio: string
  }
}

export interface SystemInfo {
  version: string
  environment: string
  features: {
    ai_enabled: boolean
    seo_enabled: boolean
    attribution_enabled: boolean
  }
}

// ============================================
// Utility Types
// ============================================

export type DateRange = '7d' | '30d' | '90d' | 'custom'

export interface DateFilter {
  from?: string
  to?: string
  period?: DateRange
}

// Form types
export interface CreateExperimentRequest {
  name: string
  type: ExperimentType
  config: ExperimentConfig
}

export interface UpdateExperimentRequest {
  name?: string
  status?: ExperimentStatus
  config?: ExperimentConfig
}

export interface CreateSettlementRequest {
  conversion_id: string
  period: string
  breakdown: SettlementBreakdown
}
