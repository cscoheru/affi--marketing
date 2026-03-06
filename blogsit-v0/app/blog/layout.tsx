import type { Metadata } from 'next'
import Link from 'next/link'
import { PenSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Affi-Marketing 博客',
  description: '探索联盟营销、SEO、技术和产品测评的最新内容',
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/blog" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg">Affi-Marketing</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              博客首页
            </Link>
            <Link href="/blog/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              管理后台
            </Link>
            <Button asChild size="sm">
              <Link href="/blog/admin/new">
                <PenSquare className="h-4 w-4 mr-2" />
                写文章
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Affi-Marketing. 保留所有权利。</p>
        </div>
      </footer>
    </div>
  )
}
