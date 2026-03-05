import type { Product } from '@/types/product'
import type { Material } from '@/types/material'
import type { Content } from '@/types/content'
import type { PublishTask, Platform, PublishLog } from '@/types/publish'
import type { AnalyticsOverview, ContentPerformance, TrendData, PlatformDistribution } from '@/types/analytics'

export const mockProducts: Product[] = [
  {
    id: 1,
    asin: 'B0DCZY7VR3',
    title: 'Breville Barista Express Impress',
    category: '咖啡机',
    price: 599.95,
    rating: 4.5,
    reviewCount: 2847,
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300&h=300&fit=crop',
    status: 'researching',
    potentialScore: 92,
    createdAt: '2025-12-01'
  },
  {
    id: 2,
    asin: 'B09RVNJHFH',
    title: 'De\'Longhi Magnifica Evo',
    category: '咖啡机',
    price: 449.99,
    rating: 4.3,
    reviewCount: 1523,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop',
    status: 'pending',
    potentialScore: 85,
    createdAt: '2025-12-02'
  },
  {
    id: 3,
    asin: 'B0C1JP3GR3',
    title: 'Lavazza Super Crema 咖啡豆',
    category: '咖啡豆',
    price: 18.99,
    rating: 4.6,
    reviewCount: 5621,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
    status: 'covered',
    potentialScore: 78,
    createdAt: '2025-11-28'
  },
  {
    id: 4,
    asin: 'B07HGMLJXQ',
    title: 'Fellow Stagg EKG 手冲壶',
    category: '手冲器具',
    price: 169.00,
    rating: 4.7,
    reviewCount: 3102,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
    status: 'pending',
    potentialScore: 88,
    createdAt: '2025-12-03'
  },
  {
    id: 5,
    asin: 'B0BXL5FKWB',
    title: 'Baratza Encore ESP 磨豆机',
    category: '磨豆机',
    price: 199.95,
    rating: 4.4,
    reviewCount: 982,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=300&h=300&fit=crop',
    status: 'researching',
    potentialScore: 81,
    createdAt: '2025-12-04'
  },
  {
    id: 6,
    asin: 'B0CK9XHLT2',
    title: 'Kicking Horse 有机咖啡豆',
    category: '咖啡豆',
    price: 14.99,
    rating: 4.5,
    reviewCount: 4215,
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=300&h=300&fit=crop',
    status: 'pending',
    potentialScore: 74,
    createdAt: '2025-12-05'
  }
]

export const mockMaterials: Material[] = [
  {
    id: 1, asin: 'B0DCZY7VR3', sourceType: 'amazon_review',
    sourceUrl: 'https://amazon.com/review/1',
    content: '这款Breville咖啡机做工精良，萃取效果非常好。操作简单，适合初学者。美中不足是清洁较麻烦。',
    sentimentScore: 0.85, createdAt: '2025-12-01'
  },
  {
    id: 2, asin: 'B0DCZY7VR3', sourceType: 'youtube',
    sourceUrl: 'https://youtube.com/watch?v=abc123',
    content: 'James Hoffmann 的详细评测视频，涵盖了萃取质量、蒸汽棒性能和日常使用体验。总体评价非常正面。',
    sentimentScore: 0.92, createdAt: '2025-12-02'
  },
  {
    id: 3, asin: 'B0DCZY7VR3', sourceType: 'reddit',
    sourceUrl: 'https://reddit.com/r/espresso/post/1',
    content: 'r/espresso 社区讨论，多数用户认为 Breville Barista Express 是入门意式咖啡的最佳选择之一。',
    sentimentScore: 0.78, createdAt: '2025-12-03'
  },
  {
    id: 4, asin: 'B09RVNJHFH', sourceType: 'amazon_review',
    sourceUrl: 'https://amazon.com/review/2',
    content: 'De\'Longhi 全自动咖啡机，一键操作非常方便。奶泡系统表现出色，但价格略高。',
    sentimentScore: 0.80, createdAt: '2025-12-01'
  },
  {
    id: 5, asin: 'B09RVNJHFH', sourceType: 'quora',
    sourceUrl: 'https://quora.com/q/1',
    content: 'Quora 上关于 De\'Longhi vs Breville 的讨论，用户反馈 De\'Longhi 更适合追求便捷的咖啡爱好者。',
    sentimentScore: 0.75, createdAt: '2025-12-04'
  },
  {
    id: 6, asin: 'B0C1JP3GR3', sourceType: 'amazon_review',
    sourceUrl: 'https://amazon.com/review/3',
    content: 'Lavazza Super Crema 是性价比极高的咖啡豆，口感均衡，适合各种冲煮方式。',
    sentimentScore: 0.88, createdAt: '2025-12-02'
  }
]

export const mockContents: Content[] = [
  {
    id: 1, slug: 'breville-barista-express-review', asin: 'B0DCZY7VR3',
    title: 'Breville Barista Express Impress 深度评测：家用咖啡机的新标杆',
    type: 'review', content: '# Breville Barista Express Impress 深度评测\n\n在家用意式咖啡机市场中...', html: '<h1>Breville Barista Express Impress 深度评测</h1><p>在家用意式咖啡机市场中，Breville Barista Express 系列一直占据着重要地位...</p>',
    status: 'published', aiGenerated: true, humanReviewed: true, aiScore: 94,
    wordCount: 2850, createdAt: '2025-12-05', updatedAt: '2025-12-06'
  },
  {
    id: 2, slug: 'home-espresso-guide', asin: 'B0DCZY7VR3',
    title: '2025家用意式咖啡入门完全指南',
    type: 'guide', content: '# 家用意式咖啡入门指南\n\n选择一款适合自己的咖啡机...', html: '<h1>家用意式咖啡入门指南</h1><p>选择一款适合自己的咖啡机是开启咖啡之旅的第一步...</p>',
    status: 'reviewing', aiGenerated: true, humanReviewed: false, aiScore: 87,
    wordCount: 3200, createdAt: '2025-12-06', updatedAt: '2025-12-06'
  },
  {
    id: 3, slug: 'coffee-extraction-science', asin: '',
    title: '咖啡萃取的科学：温度、压力与时间的完美平衡',
    type: 'science', content: '# 咖啡萃取的科学\n\n咖啡萃取是一个复杂的化学过程...', html: '<h1>咖啡萃取的科学</h1><p>咖啡萃取是一个复杂的化学过程，涉及温度、压力和时间三个关键变量...</p>',
    status: 'draft', aiGenerated: true, humanReviewed: false, aiScore: 91,
    wordCount: 1800, createdAt: '2025-12-07', updatedAt: '2025-12-07'
  },
  {
    id: 4, slug: 'delonghi-magnifica-review', asin: 'B09RVNJHFH',
    title: 'De\'Longhi Magnifica Evo 评测：全自动咖啡机之选',
    type: 'review', content: '# De\'Longhi Magnifica Evo 评测\n\n全自动咖啡机一直以便捷著称...', html: '<h1>De\'Longhi Magnifica Evo 评测</h1><p>全自动咖啡机一直以便捷著称...</p>',
    status: 'approved', aiGenerated: true, humanReviewed: true, aiScore: 89,
    wordCount: 2400, createdAt: '2025-12-08', updatedAt: '2025-12-09'
  },
  {
    id: 5, slug: 'coffee-beans-buying-guide', asin: 'B0C1JP3GR3',
    title: '咖啡豆选购指南：从烘焙度到产地的全面解析',
    type: 'guide', content: '# 咖啡豆选购指南\n\n选择优质咖啡豆...', html: '<h1>咖啡豆选购指南</h1><p>选择优质咖啡豆是制作一杯好咖啡的基础...</p>',
    status: 'draft', aiGenerated: false, humanReviewed: false,
    wordCount: 1500, createdAt: '2025-12-09', updatedAt: '2025-12-09'
  }
]

export const mockPublishQueue: PublishTask[] = [
  {
    id: 1, contentId: 1, title: 'Breville Barista Express Impress 深度评测',
    platforms: ['Blogger', 'Medium'],
    status: 'success',
    results: [
      { platform: 'Blogger', status: 'success', url: 'https://blog.example.com/breville-review' },
      { platform: 'Medium', status: 'success', url: 'https://medium.com/@user/breville-review' }
    ],
    createdAt: '2025-12-06 14:30'
  },
  {
    id: 2, contentId: 4, title: 'De\'Longhi Magnifica Evo 评测',
    platforms: ['Blogger', 'WordPress'],
    status: 'running',
    results: [],
    createdAt: '2025-12-09 10:15'
  },
  {
    id: 3, contentId: 2, title: '2025家用意式咖啡入门完全指南',
    platforms: ['Medium', 'WordPress', 'Blogger'],
    status: 'pending',
    results: [],
    createdAt: '2025-12-09 11:00'
  },
  {
    id: 4, contentId: 3, title: '咖啡萃取的科学',
    platforms: ['Blogger'],
    status: 'failed',
    results: [
      { platform: 'Blogger', status: 'failed', error: 'API Token 过期，请重新授权' }
    ],
    createdAt: '2025-12-08 09:45'
  }
]

export const mockPlatforms: Platform[] = [
  { id: 1, name: 'Blogger', icon: 'Document', enabled: true },
  { id: 2, name: 'Medium', icon: 'EditPen', enabled: true },
  { id: 3, name: 'WordPress', icon: 'Monitor', enabled: false },
  { id: 4, name: 'Ghost', icon: 'MagicStick', enabled: false },
  { id: 5, name: 'Substack', icon: 'Message', enabled: false }
]

export const mockPublishLogs: PublishLog[] = [
  { id: 1, timestamp: '2025-12-09 11:00:00', type: 'info', message: '新增发布任务：2025家用意式咖啡入门完全指南 -> Medium, WordPress, Blogger' },
  { id: 2, timestamp: '2025-12-09 10:15:00', type: 'info', message: '开始发布：De\'Longhi Magnifica Evo 评测 -> Blogger, WordPress' },
  { id: 3, timestamp: '2025-12-08 09:46:00', type: 'danger', message: '发布失败：咖啡萃取的科学 -> Blogger (API Token 过期)' },
  { id: 4, timestamp: '2025-12-06 14:35:00', type: 'success', message: '发布成功：Breville 深度评测 -> Medium' },
  { id: 5, timestamp: '2025-12-06 14:32:00', type: 'success', message: '发布成功：Breville 深度评测 -> Blogger' },
  { id: 6, timestamp: '2025-12-06 14:30:00', type: 'info', message: '开始发布：Breville Barista Express Impress 深度评测' }
]

export const mockAnalyticsOverview: AnalyticsOverview = {
  totalRevenue: 12580.50,
  revenueTrend: 15.3,
  totalViews: 185420,
  viewsTrend: 8.7,
  conversionRate: 3.2,
  conversionTrend: -0.5,
  publishedCount: 24,
  publishedTrend: 20
}

export const mockTopContents: ContentPerformance[] = [
  { id: 1, title: 'Breville Barista Express 深度评测', views: 45200, clicks: 3820, conversions: 156, revenue: 4680.00 },
  { id: 2, title: '2025家用意式咖啡入门指南', views: 38500, clicks: 2940, conversions: 98, revenue: 2940.00 },
  { id: 3, title: '咖啡豆选购完全指南', views: 29300, clicks: 2180, conversions: 72, revenue: 1800.00 },
  { id: 4, title: 'De\'Longhi 全自动咖啡机评测', views: 22100, clicks: 1650, conversions: 55, revenue: 1650.00 },
  { id: 5, title: '手冲咖啡器具推荐 TOP 10', views: 18900, clicks: 1420, conversions: 43, revenue: 1075.00 }
]

export const mockTrendData: TrendData[] = [
  { date: '12-01', revenue: 1200, views: 15200 },
  { date: '12-02', revenue: 1580, views: 18400 },
  { date: '12-03', revenue: 980, views: 14300 },
  { date: '12-04', revenue: 1420, views: 17800 },
  { date: '12-05', revenue: 1890, views: 22100 },
  { date: '12-06', revenue: 2100, views: 25600 },
  { date: '12-07', revenue: 1750, views: 21000 },
  { date: '12-08', revenue: 1630, views: 19400 },
  { date: '12-09', revenue: 2030, views: 24200 }
]

export const mockPlatformDistribution: PlatformDistribution[] = [
  { name: 'Blogger', value: 45 },
  { name: 'Medium', value: 30 },
  { name: 'WordPress', value: 15 },
  { name: '其他', value: 10 }
]
