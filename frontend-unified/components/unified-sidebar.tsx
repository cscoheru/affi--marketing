'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore, useAuthStore, useThemeStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  type: 'react' | 'vue' | 'ssg'
  category: string
}

const navItems: NavItem[] = [
  // Vue微应用 - 控制台功能
  { id: 'dashboard', label: '仪表板', icon: '📊', path: '/dashboard', type: 'vue', category: '控制台' },
  { id: 'experiments', label: '实验管理', icon: '🔬', path: '/experiments', type: 'vue', category: '控制台' },
  { id: 'plugins', label: '插件市场', icon: '🔌', path: '/plugins', type: 'vue', category: '控制台' },
  { id: 'settlements', label: '佣金结算', icon: '💰', path: '/settlements', type: 'vue', category: '控制台' },

  // React原生组件 - 内容企业核心模块
  { id: 'strategy', label: '市场战略', icon: '🎯', path: '/strategy', type: 'react', category: '内容企业' },
  { id: 'products', label: '产品中心', icon: '📄', path: '/products', type: 'react', category: '内容企业' },
  { id: 'marketing', label: '营销中心', icon: '📢', path: '/marketing', type: 'react', category: '内容企业' },
  { id: 'analytics', label: '数据分析', icon: '📈', path: '/analytics', type: 'react', category: '内容企业' },

  // 博客系统
  { id: 'blog-home', label: '博客首页', icon: '📝', path: '/blog', type: 'react', category: '博客' },
  { id: 'blog-admin', label: '文章管理', icon: '📚', path: '/blog/admin', type: 'react', category: '博客' },
  { id: 'blog-categories', label: '分类管理', icon: '🏷️', path: '/blog/admin/categories', type: 'react', category: '博客' },
  { id: 'blog-settings', label: '博客设置', icon: '⚙️', path: '/blog/admin/settings', type: 'react', category: '博客' },
]

export function UnifiedSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  // 按类别分组
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // 主题图标
  const getThemeIcon = () => {
    if (theme === 'light') return '☀️'
    if (theme === 'dark') return '🌙'
    return '💻'
  }

  const getThemeLabel = () => {
    if (theme === 'light') return '白天模式'
    if (theme === 'dark') return '夜间模式'
    return '跟随系统'
  }

  return (
    <aside className={cn(
      "flex flex-col border-r bg-sidebar transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo区 */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Affi-Marketing
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {sidebarCollapsed ? '→' : '←'}
        </Button>
      </div>

      {/* 导航区 */}
      <ScrollArea className="flex-1 px-2 py-4">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className={cn("mb-4", sidebarCollapsed && "text-center")}>
            {!sidebarCollapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase">
                {category}
              </h3>
            )}
            <ul className="space-y-1">
              {items.map(item => (
                <li key={item.id}>
                  <Link href={item.path}>
                    <Button
                      variant={pathname === item.path ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        sidebarCollapsed && "justify-center px-2"
                      )}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!sidebarCollapsed && (
                        <>
                          <span className="ml-3">{item.label}</span>
                          {item.type === 'vue' && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              Vue
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </ScrollArea>

      {/* 主题切换区 */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                sidebarCollapsed && "justify-center px-2"
              )}
            >
              <span className="text-lg">{getThemeIcon()}</span>
              {!sidebarCollapsed && (
                <span className="ml-3">{getThemeLabel()}</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>主题设置</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
              <DropdownMenuRadioItem value="light">
                ☀️ 白天模式
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                🌙 夜间模式
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                💻 跟随系统
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 用户信息区 */}
      <div className="border-t p-4">
        {user && !sidebarCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2" data-testid="user-menu-button">
                <Avatar className="h-8 w-8" data-testid="user-avatar">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 text-left">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>设置</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {user && sidebarCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="mx-auto h-8 w-8 cursor-pointer" data-testid="user-avatar">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name[0]}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>我的账户</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>设置</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
