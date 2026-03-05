// Product types
export interface Product {
  id: number
  asin: string
  title: string
  category: string
  price: number
  rating: number
  reviewCount: number
  imageUrl: string
  status: 'pending' | 'researching' | 'covered' | 'ignored'
  potentialScore: number
  createdAt: string
}

// Material types
export interface Material {
  id: number
  asin: string
  sourceType: 'amazon_review' | 'youtube' | 'reddit' | 'quora'
  sourceUrl: string
  content: string
  sentimentScore: number
  createdAt: string
}

// Content types
export interface Content {
  id: number
  slug: string
  asin: string
  title: string
  type: 'review' | 'science' | 'guide'
  content: string
  status: 'draft' | 'reviewing' | 'approved' | 'published'
  aiGenerated: boolean
  humanReviewed: boolean
  wordCount: number
  createdAt: string
  updatedAt: string
}

// Publish types
export interface PublishTask {
  id: number
  contentId: number
  contentTitle: string
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
  enabled: boolean
  icon: string
  configured: boolean
}

export interface PublishLog {
  id: number
  message: string
  type: 'success' | 'warning' | 'danger' | 'info'
  timestamp: string
}

// Analytics types
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
  fill: string
}
