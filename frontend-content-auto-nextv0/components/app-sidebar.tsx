'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Package,
  FileText,
  FolderOpen,
  Send,
  BarChart3,
  Zap,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const navItems = [
  { title: '产品候选库', href: '/products', icon: Package },
  { title: '素材库', href: '/materials', icon: FolderOpen },
  { title: '内容管理', href: '/content', icon: FileText },
  { title: '发布中心', href: '/publish', icon: Send },
  { title: '数据看板', href: '/analytics', icon: BarChart3 },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <Link href="/products" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-4" />
          </div>
          <span className="text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            ContentHub
          </span>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>工作台</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium">
            A
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-medium text-sidebar-foreground">Admin</span>
            <span className="text-xs text-sidebar-foreground/60">admin@example.com</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
