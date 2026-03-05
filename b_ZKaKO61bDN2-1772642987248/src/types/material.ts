export interface Material {
  id: number
  asin: string
  sourceType: 'amazon_review' | 'youtube' | 'reddit' | 'quora'
  sourceUrl: string
  content: string
  sentimentScore: number
  createdAt: string
}
