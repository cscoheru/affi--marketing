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
