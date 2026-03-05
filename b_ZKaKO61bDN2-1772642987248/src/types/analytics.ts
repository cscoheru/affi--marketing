export interface AnalyticsOverview {
  totalRevenue: number
  revenueTrend: number
  totalViews: number
  viewsTrend: number
  conversionRate: number
  conversionTrend: number
  publishedCount: number
  publishedTrend: number
}

export interface ContentPerformance {
  id: number
  title: string
  views: number
  clicks: number
  conversions: number
  revenue: number
}

export interface TrendData {
  date: string
  revenue: number
  views: number
}

export interface PlatformDistribution {
  name: string
  value: number
}
