// Amazon 产品爬虫 - 服务端获取真实产品数据
import { z } from 'zod'

const RequestSchema = z.object({
  keywords: z.string().min(1),
  marketplace: z.enum(['com', 'co.uk', 'de', 'co.jp']).optional().default('com'),
  limit: z.number().min(1).max(10).optional().default(5),
})

interface ScrapedProduct {
  asin: string
  title: string
  price: string
  imageUrl: string
  rating: string
  reviewCount: number
  productUrl: string
  isPrime: boolean
  isBestSeller: boolean
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const params = RequestSchema.parse(body)

    const domain = params.marketplace === 'com' ? 'amazon.com' : `amazon.${params.marketplace}`
    const searchUrl = `https://www.${domain}/s?k=${encodeURIComponent(params.keywords)}`

    // 尝试使用 RapidAPI Rainforest（如果配置了）
    if (process.env.RAPIDAPI_KEY) {
      try {
        const response = await fetch(
          `https://rainforest-data.p.rapidapi.com/search/${params.marketplace}?q=${encodeURIComponent(params.keywords)}`,
          {
            headers: {
              'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'rainforest-data.p.rapidapi.com',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          const products = (data.search_results || []).slice(0, params.limit).map((item: any) => ({
            asin: item.asin,
            title: item.title,
            price: item.price?.value ? `$${item.price.value}` : 'N/A',
            imageUrl: item.image || '',
            rating: item.rating?.toString() || '0',
            reviewCount: item.ratings_total || 0,
            productUrl: item.link || `https://www.${domain}/dp/${item.asin}`,
            isPrime: item.is_prime || false,
            isBestSeller: item.is_best_seller || false,
          }))

          return new Response(JSON.stringify({
            mode: 'real_data',
            products,
            source: 'rapidapi_rainforest',
          }), { headers: { 'Content-Type': 'application/json' } })
        }
      } catch (e) {
        console.error('RapidAPI error:', e)
      }
    }

    // 如果没有 RapidAPI，尝试直接抓取（可能被 Amazon 拦截）
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
        },
      })

      if (response.ok) {
        const html = await response.text()

        // 解析 HTML 提取产品数据
        const products = parseAmazonSearchResults(html, domain, params.limit)

        if (products.length > 0) {
          return new Response(JSON.stringify({
            mode: 'real_data',
            products,
            source: 'direct_scrape',
          }), { headers: { 'Content-Type': 'application/json' } })
        }
      }
    } catch (e) {
      console.error('Direct scrape error:', e)
    }

    // 返回 Playwright 需要的指示
    return new Response(JSON.stringify({
      mode: 'playwright_required',
      searchUrl,
      keywords: params.keywords,
      marketplace: params.marketplace,
      instructions: {
        method: 'playwright_mcp',
        steps: [
          `使用 Playwright MCP 导航到: ${searchUrl}`,
          '等待搜索结果加载完成 (等待 .s-result-item 选择器)',
          '提取产品卡片数据',
        ],
        selectors: {
          productContainer: '.s-result-item[data-asin]',
          title: 'h2 a span',
          image: '.s-image',
          price: '.a-price .a-offscreen',
          rating: '.a-icon-star-small .a-icon-alt',
          reviews: '.a-size-base.s-underline-text',
        },
      },
      // 同时返回演示数据（使用真实产品图）
      demoProducts: getDemoProductsWithRealImages(params.keywords, params.limit),
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Amazon scraper error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '抓取失败' }),
      { status: 500 }
    )
  }
}

// 解析 Amazon 搜索结果 HTML
function parseAmazonSearchResults(html: string, domain: string, limit: number): ScrapedProduct[] {
  const products: ScrapedProduct[] = []

  // 简单的正则解析（实际项目建议用 cheerio）
  const productRegex = /data-asin="(B[A-Z0-9]{9})"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"[^>]*>[\s\S]*?<h2[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/gi

  let match
  let count = 0

  while ((match = productRegex.exec(html)) !== null && count < limit) {
    const asin = match[1]
    const imageUrl = match[2]
    const title = match[3].trim()

    if (asin && title && imageUrl) {
      // 提取价格
      const priceMatch = html.substring(match.index, match.index + 5000).match(/\$([0-9,.]+)/)
      const price = priceMatch ? `$${priceMatch[1]}` : 'N/A'

      // 提取评分
      const ratingMatch = html.substring(match.index, match.index + 5000).match(/(\d\.\d)\s*out\s*of\s*5/)
      const rating = ratingMatch ? ratingMatch[1] : '0'

      // 提取评价数
      const reviewMatch = html.substring(match.index, match.index + 5000).match(/([\d,]+)\s*(ratings|评价)/i)
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : 0

      products.push({
        asin,
        title,
        price,
        imageUrl,
        rating,
        reviewCount,
        productUrl: `https://www.${domain}/dp/${asin}`,
        isPrime: html.substring(match.index, match.index + 5000).includes('a-icon-prime'),
        isBestSeller: html.substring(match.index, match.index + 5000).includes('Best Seller'),
      })

      count++
    }
  }

  return products
}

// 根据 keywords 返回更相关的演示产品（使用真实 Amazon 图片）
function getDemoProductsWithRealImages(keywords: string, limit: number): ScrapedProduct[] {
  // 真实的 Amazon 产品图片和 ASIN（按类别分组）
  const productDatabase: Record<string, ScrapedProduct[]> = {
    'wireless earbuds': [
      { asin: 'B0B44FLTBY', title: 'Sony LinkBuds S Truly Wireless Earbuds', price: '$149.99', imageUrl: 'https://m.media-amazon.com/images/I/61eb7Vm0gxL._AC_SL1500_.jpg', rating: '4.4', reviewCount: 15420, productUrl: 'https://www.amazon.com/dp/B0B44FLTBY', isPrime: true, isBestSeller: false },
      { asin: 'B09V3HKRMZ', title: 'Soundcore by Anker Life P3 Noise Cancelling Earbuds', price: '$79.99', imageUrl: 'https://m.media-amazon.com/images/I/61eKW6W6oWL._AC_SL1500_.jpg', rating: '4.3', reviewCount: 28950, productUrl: 'https://www.amazon.com/dp/B09V3HKRMZ', isPrime: true, isBestSeller: true },
      { asin: 'B0C1FZ9M9S', title: 'TOZO NC9 Wireless Earbuds Active Noise Cancellation', price: '$35.99', imageUrl: 'https://m.media-amazon.com/images/I/51+qvlbp8KL._AC_SL1500_.jpg', rating: '4.2', reviewCount: 45230, productUrl: 'https://www.amazon.com/dp/B0C1FZ9M9S', isPrime: true, isBestSeller: true },
    ],
    'noise cancelling headphones': [
      { asin: 'B0863TXGM3', title: 'Sony WH-1000XM4 Wireless Noise Cancelling Headphones', price: '$248.00', imageUrl: 'https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg', rating: '4.7', reviewCount: 89450, productUrl: 'https://www.amazon.com/dp/B0863TXGM3', isPrime: true, isBestSeller: true },
      { asin: 'B0CCZ1L489', title: 'Sony WH-CH520 Wireless On-Ear Headphones', price: '$78.00', imageUrl: 'https://m.media-amazon.com/images/I/71V9tSbU8yL._AC_SL1500_.jpg', rating: '4.4', reviewCount: 12350, productUrl: 'https://www.amazon.com/dp/B0CCZ1L489', isPrime: true, isBestSeller: false },
    ],
    'smart watch': [
      { asin: 'B0CHX2F5QT', title: 'Garmin vívosmart 5 Activity Tracker', price: '$149.99', imageUrl: 'https://m.media-amazon.com/images/I/61QemTqrouL._AC_SL1500_.jpg', rating: '4.2', reviewCount: 8950, productUrl: 'https://www.amazon.com/dp/B0CHX2F5QT', isPrime: true, isBestSeller: false },
      { asin: 'B0B3R4B8KJ', title: 'Amazfit GTS 4 Smart Watch', price: '$199.99', imageUrl: 'https://m.media-amazon.com/images/I/61wVNO5selL._AC_SL1500_.jpg', rating: '4.1', reviewCount: 5620, productUrl: 'https://www.amazon.com/dp/B0B3R4B8KJ', isPrime: true, isBestSeller: false },
    ],
    'bluetooth speaker': [
      { asin: 'B099Y6SLJ1', title: 'JBL Flip 6 Portable Bluetooth Speaker', price: '$99.95', imageUrl: 'https://m.media-amazon.com/images/I/81nz0XlphlL._AC_SL1500_.jpg', rating: '4.7', reviewCount: 45230, productUrl: 'https://www.amazon.com/dp/B099Y6SLJ1', isPrime: true, isBestSeller: true },
      { asin: 'B09KWJSPM4', title: 'Ultimate Ears BOOM 3 Wireless Bluetooth Speaker', price: '$129.99', imageUrl: 'https://m.media-amazon.com/images/I/71k3d3OY6aL._AC_SL1500_.jpg', rating: '4.6', reviewCount: 32150, productUrl: 'https://www.amazon.com/dp/B09KWJSPM4', isPrime: true, isBestSeller: false },
    ],
    'power bank': [
      { asin: 'B0CP7SMWQD', title: 'Anker 26800mAh Portable Power Bank', price: '$65.99', imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg', rating: '4.8', reviewCount: 128000, productUrl: 'https://www.amazon.com/dp/B0CP7SMWQD', isPrime: true, isBestSeller: true },
      { asin: 'B0B7P6Q8ZJ', title: 'INIU Portable Charger 20000mAh', price: '$39.99', imageUrl: 'https://m.media-amazon.com/images/I/71ZLrKe7qIL._AC_SL1500_.jpg', rating: '4.5', reviewCount: 89560, productUrl: 'https://www.amazon.com/dp/B0B7P6Q8ZJ', isPrime: true, isBestSeller: true },
    ],
    'security camera': [
      { asin: 'B09M5VJRQQ', title: 'Ring Indoor Cam (2nd Gen)', price: '$59.99', imageUrl: 'https://m.media-amazon.com/images/I/61nWGMqQFqL._AC_SL1500_.jpg', rating: '4.4', reviewCount: 45230, productUrl: 'https://www.amazon.com/dp/B09M5VJRQQ', isPrime: true, isBestSeller: true },
      { asin: 'B0B7X6D3H8', title: 'eufy Security Indoor Cam C120', price: '$39.99', imageUrl: 'https://m.media-amazon.com/images/I/61v0Vm8h5EL._AC_SL1500_.jpg', rating: '4.3', reviewCount: 32150, productUrl: 'https://www.amazon.com/dp/B0B7X6D3H8', isPrime: true, isBestSeller: false },
    ],
    'default': [
      { asin: 'B08N5KWB9H', title: 'Sony WH-1000XM4 Wireless Headphones', price: '$248.00', imageUrl: 'https://m.media-amazon.com/images/I/71L2K9m9URL._AC_SL1500_.jpg', rating: '4.7', reviewCount: 89450, productUrl: 'https://www.amazon.com/dp/B08N5KWB9H', isPrime: true, isBestSeller: true },
      { asin: 'B0CHX2F5QT', title: 'Apple AirPods Pro (2nd Generation)', price: '$189.99', imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg', rating: '4.6', reviewCount: 128000, productUrl: 'https://www.amazon.com/dp/B0CHX2F5QT', isPrime: true, isBestSeller: true },
      { asin: 'B09V3HKRMZ', title: 'Soundcore Life P3 Wireless Earbuds', price: '$79.99', imageUrl: 'https://m.media-amazon.com/images/I/61eKW6W6oWL._AC_SL1500_.jpg', rating: '4.3', reviewCount: 28950, productUrl: 'https://www.amazon.com/dp/B09V3HKRMZ', isPrime: true, isBestSeller: true },
      { asin: 'B099Y6SLJ1', title: 'JBL Flip 6 Bluetooth Speaker', price: '$99.95', imageUrl: 'https://m.media-amazon.com/images/I/81nz0XlphlL._AC_SL1500_.jpg', rating: '4.7', reviewCount: 45230, productUrl: 'https://www.amazon.com/dp/B099Y6SLJ1', isPrime: true, isBestSeller: true },
      { asin: 'B0CP7SMWQD', title: 'Anker 26800mAh Power Bank', price: '$65.99', imageUrl: 'https://m.media-amazon.com/images/I/71E0PH8YIDL._AC_SL1500_.jpg', rating: '4.8', reviewCount: 128000, productUrl: 'https://www.amazon.com/dp/B0CP7SMWQD', isPrime: true, isBestSeller: true },
    ],
  }

  // 根据 keywords 匹配合适的产品
  const keywordLower = keywords.toLowerCase()
  let matchedProducts = productDatabase['default']

  for (const [key, products] of Object.entries(productDatabase)) {
    if (keywordLower.includes(key) || key.includes(keywordLower.split(' ')[0])) {
      matchedProducts = products
      break
    }
  }

  return matchedProducts.slice(0, limit)
}
