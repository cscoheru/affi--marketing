import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Affi Marketing Blog - 联盟营销指南与策略',
    template: '%s | Affi Marketing Blog'
  },
  description: '专业的联盟营销知识库，提供营销策略、产品评测和行业洞察',
  keywords: ['联盟营销', 'Affiliate Marketing', '营销策略', '产品评测'],
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 公开访问 - 无需侧边栏 */}
      <div className="flex flex-col">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container flex h-16 items-center justify-between px-4 mx-auto">
            <a href="/blog-public" className="text-xl font-bold text-gray-900">
              Affi Marketing
            </a>
            <nav className="flex items-center space-x-6">
              <a href="/blog-public" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                博客首页
              </a>
              <a href="/blog-public/category/all" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                分类浏览
              </a>
              <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                管理后台
              </a>
            </nav>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1">
          {children}
        </main>

        {/* 页脚 */}
        <footer className="border-t bg-white">
          <div className="container px-4 py-8 mx-auto">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">关于我们</h3>
                <p className="text-sm text-gray-600">
                  专业的联盟营销知识平台，助您掌握营销策略和行业趋势。
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">快速链接</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/blog-public" className="hover:text-gray-900">博客首页</a></li>
                  <li><a href="/blog-public/category/all" className="hover:text-gray-900">所有分类</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">热门分类</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="/blog/category/marketing" className="hover:text-gray-900">营销策略</a></li>
                  <li><a href="/blog/category/reviews" className="hover:text-gray-900">产品评测</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">联系我们</h3>
                <p className="text-sm text-gray-600">
                  如有合作意向，请通过管理后台联系我们。
                </p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
              © {new Date().getFullYear()} Affi Marketing Blog. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
