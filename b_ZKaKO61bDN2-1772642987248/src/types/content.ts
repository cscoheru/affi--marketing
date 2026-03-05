export interface Content {
  id: number
  slug: string
  asin: string
  title: string
  type: 'review' | 'science' | 'guide'
  content: string
  html?: string
  status: 'draft' | 'reviewing' | 'approved' | 'published'
  aiGenerated: boolean
  humanReviewed: boolean
  aiScore?: number
  wordCount: number
  createdAt: string
  updatedAt: string
}
