// 产品类型
export interface Product {
  id: number;
  asin: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  status: "pending" | "researching" | "covered" | "ignored";
  potentialScore: number;
  createdAt: string;
}

// 素材类型
export interface Material {
  id: number;
  asin: string;
  sourceType: "amazon_review" | "youtube" | "reddit" | "quora";
  sourceUrl: string;
  content: string;
  sentimentScore: number;
  createdAt: string;
}

// 内容类型
export interface Content {
  id: number;
  slug: string;
  asin: string;
  title: string;
  type: "review" | "science" | "guide";
  content: string;
  status: "draft" | "reviewing" | "approved" | "published";
  aiGenerated: boolean;
  humanReviewed: boolean;
  aiModel?: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

// 发布任务类型
export interface PublishTask {
  id: number;
  contentId: number;
  platforms: string[];
  status: "pending" | "running" | "success" | "failed";
  results: PlatformResult[];
  createdAt: string;
}

export interface PlatformResult {
  platform: string;
  status: "success" | "failed";
  url?: string;
  error?: string;
}

// 分析数据类型
export interface AnalyticsStats {
  totalRevenue: number;
  totalViews: number;
  totalClicks: number;
  conversionRate: number;
  publishedCount: number;
}

export interface ContentPerformance {
  id: number;
  title: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// 发布平台类型
export interface PublishPlatform {
  id: number;
  name: string;
  enabled: boolean;
  status: "connected" | "disconnected";
  config?: Record<string, unknown>;
}

// 发布日志类型
export interface PublishLog {
  id: number;
  taskId: number;
  timestamp: string;
  type: "success" | "error" | "info";
  message: string;
}

// 用户类型
export interface User {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  createdAt: string;
}
