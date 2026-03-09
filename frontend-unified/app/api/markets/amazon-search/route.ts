import { z } from 'zod'

// 请求参数验证
const RequestSchema = z.object({
  keywords: z.string().min(1).max(200),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().min(1).max(5).optional(),
  limit: z.number().min(1).max(20).optional().default(10),
  marketplace: z.enum(['com', 'co.uk', 'de', 'co.jp']).optional().default('com'),
})

interface AmazonProduct {
  asin: string
  title: string
  price: number | null
  originalPrice: number | null
  rating: number | null
  reviewCount: number | null
  imageUrl: string
  productUrl: string
  isPrime: boolean
  isBestSeller: boolean
  isSponsored: boolean
  // AI 分析字段
  aiScore?: number
  aiReason?: string
  matchedCriteria?: string[]
}

// 使用 Playwright MCP 采集 Amazon
async function scrapeAmazonWithPlaywright(
  keywords: string,
  marketplace: string,
  limit: number
): Promise<AmazonProduct[]> {
  const baseUrl = `https://www.amazon.${marketplace}`
  const searchUrl = `${baseUrl}/s?k=${encodeURIComponent(keywords)}`

  // 这里我们返回一个提示，让前端通过 Playwright MCP 来执行
  // 实际的采集逻辑在客户端通过 MCP 完成
  return []
}

// 使用 RapidAPI Rainforest 作为备选（更可靠）
async function searchWithRapidAPI(
  keywords: string,
  marketplace: string,
  limit: number
): Promise<AmazonProduct[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY

  if (!rapidApiKey) {
    console.log('RapidAPI key not configured, falling back to Playwright')
    return []
  }

  try {
    const response = await fetch(
      `https://rainforest-data.p.rapidapi.com/search/${marketplace}?q=${encodeURIComponent(keywords)}`,
      {
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'rainforest-data.p.rapidapi.com',
        },
      }
    )

    if (!response.ok) {
      console.error('RapidAPI error:', response.status)
      return []
    }

    const data = await response.json()
    const results = data.search_results || []

    return results.slice(0, limit).map((item: any) => ({
      asin: item.asin,
      title: item.title,
      price: item.price?.value || null,
      originalPrice: item.price?.raw || null,
      rating: item.rating || null,
      reviewCount: item.ratings_total || null,
      imageUrl: item.image || '',
      productUrl: item.link || `https://www.amazon.${marketplace}/dp/${item.asin}`,
      isPrime: item.is_prime || false,
      isBestSeller: item.is_best_seller || false,
      isSponsored: item.is_sponsored || false,
    }))
  } catch (error) {
    console.error('RapidAPI fetch error:', error)
    return []
  }
}

// 应用用户筛选条件
function applyFilters(
  products: AmazonProduct[],
  filters: {
    minPrice?: number
    maxPrice?: number
    minRating?: number
  }
): AmazonProduct[] {
  return products.filter((p) => {
    if (filters.minPrice && p.price && p.price < filters.minPrice) return false
    if (filters.maxPrice && p.price && p.price > filters.maxPrice) return false
    if (filters.minRating && p.rating && p.rating < filters.minRating) return false
    return true
  })
}

// 计算AI评分
function calculateAIScore(
  product: AmazonProduct,
  preferences: {
    commissionFocus?: string
    competitionLevel?: string
    marketTrend?: string
  }
): number {
  let score = 50

  // 评分因素
  if (product.rating && product.rating >= 4.5) score += 15
  else if (product.rating && product.rating >= 4.0) score += 10
  else if (product.rating && product.rating >= 3.5) score += 5

  if (product.reviewCount && product.reviewCount >= 1000) score += 10
  else if (product.reviewCount && product.reviewCount >= 100) score += 5

  if (product.price && product.price >= 30 && product.price <= 100) score += 10
  else if (product.price && product.price >= 20 && product.price <= 200) score += 5

  if (product.isBestSeller) score += 10
  if (product.isPrime) score += 5

  // 确保分数在 0-100 范围内
  return Math.min(100, Math.max(0, score))
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const params = RequestSchema.parse(body)

    const { keywords, category, minPrice, maxPrice, minRating, limit, marketplace } = params

    // 构建搜索词
    const searchKeywords = category
      ? `${category} ${keywords}`
      : keywords

    // 尝试多种方式获取数据
    let products: AmazonProduct[] = []

    // 1. 首先尝试 RapidAPI (如果有配置)
    products = await searchWithRapidAPI(searchKeywords, marketplace, limit * 2)

    // 2. 如果 RapidAPI 不可用，返回带有搜索链接的占位数据
    //    前端可以通过 Playwright MCP 来执行实际采集
    if (products.length === 0) {
      // 生成 Amazon 搜索链接，让用户或 Playwright MCP 执行
      const searchUrl = `https://www.amazon.${marketplace}/s?k=${encodeURIComponent(searchKeywords)}`

      // 返回搜索任务，前端可以：
      // 1. 使用 Playwright MCP 执行采集
      // 2. 让用户手动打开链接采集
      return new Response(
        JSON.stringify({
          mode: 'playwright_required',
          searchUrl,
          keywords: searchKeywords,
          marketplace,
          instructions: {
            method: 'playwright_mcp',
            steps: [
              `使用 Playwright MCP 导航到: ${searchUrl}`,
              '等待搜索结果加载完成',
              '提取产品卡片数据（ASIN、标题、价格、评分、图片）',
              '将数据发送回系统',
            ],
            mcpCommand: `mcp__plugin_playwright_playwright__browser_navigate: ${searchUrl}`,
          },
          // 同时返回 AI 推荐的产品方向（非真实数据）
          aiRecommendations: await generateAIRecommendations(params),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 应用筛选条件
    products = applyFilters(products, { minPrice, maxPrice, minRating })

    // 计算 AI 评分
    products = products.map((p) => ({
      ...p,
      aiScore: calculateAIScore(p, {}),
      aiReason: generateProductReason(p),
      matchedCriteria: getMatchedCriteria(p, { minPrice, maxPrice, minRating }),
    }))

    // 按评分排序
    products.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))

    return new Response(
      JSON.stringify({
        mode: 'real_data',
        products: products.slice(0, limit),
        searchUrl: `https://www.amazon.${marketplace}/s?k=${encodeURIComponent(searchKeywords)}`,
        totalFound: products.length,
        filters: { minPrice, maxPrice, minRating },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Amazon search error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '搜索失败',
      }),
      { status: 500 }
    )
  }
}

// 生成 AI 推荐的产品方向（备用）
async function generateAIRecommendations(params: z.infer<typeof RequestSchema>) {
  try {
    // 使用本地 API 路由（在服务器端使用 localhost）
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const response = await fetch(
      `${baseUrl}/api/markets/ai-recommend`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: params.category || 'all',
          limit: params.limit,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          minRating: params.minRating,
        }),
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.products || []
    }

    console.error('AI recommendations fetch failed:', response.status)
    return []
  } catch (error) {
    console.error('Failed to generate AI recommendations:', error)
    return []
  }
}

function generateProductReason(product: AmazonProduct): string {
  const reasons = []

  if (product.rating && product.rating >= 4.5) {
    reasons.push(`高评分(${product.rating})`)
  }
  if (product.reviewCount && product.reviewCount >= 1000) {
    reasons.push(`高销量(${product.reviewCount}+评论)`)
  }
  if (product.price && product.price >= 30 && product.price <= 100) {
    reasons.push('适中价格区间')
  }
  if (product.isBestSeller) {
    reasons.push('畅销商品')
  }
  if (product.isPrime) {
    reasons.push('Prime配送')
  }

  return reasons.length > 0 ? reasons.join('、') : '符合基本筛选条件'
}

function getMatchedCriteria(
  product: AmazonProduct,
  filters: { minPrice?: number; maxPrice?: number; minRating?: number }
): string[] {
  const matched: string[] = []

  if (filters.minPrice && product.price && product.price >= filters.minPrice) {
    matched.push(`价格 ≥ $${filters.minPrice}`)
  }
  if (filters.maxPrice && product.price && product.price <= filters.maxPrice) {
    matched.push(`价格 ≤ $${filters.maxPrice}`)
  }
  if (filters.minRating && product.rating && product.rating >= filters.minRating) {
    matched.push(`评分 ≥ ${filters.minRating}`)
  }

  return matched
}
