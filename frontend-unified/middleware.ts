import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否为博客独立站点模式
  const isBlogSite = process.env.IS_BLOG_SITE === 'true'

  console.log('[Middleware] IS_BLOG_SITE:', isBlogSite, 'pathname:', pathname)

  if (!isBlogSite) {
    return NextResponse.next()
  }

  // 静态资源、API、_next 不处理
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // 静态文件
  ) {
    return NextResponse.next()
  }

  // 已经是 /blog-public 路径，不重写
  if (pathname.startsWith('/blog-public')) {
    return NextResponse.next()
  }

  // 博客站点：将所有路径重写到 /blog-public
  const url = request.nextUrl.clone()
  url.pathname = `/blog-public${pathname === '/' ? '' : pathname}`

  console.log('[Middleware] Rewriting to:', url.pathname)
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
