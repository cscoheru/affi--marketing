# 任务卡: 02-React前端工程师

> **角色**: React前端工程师
> **项目**: Affi-Marketing 前端整合
> **工期**: 7-10天
> **优先级**: 🔴 高
> **依赖**: 01-微前端架构师完成Module Federation配置

---

## 🎯 任务目标

在01-微前端架构师的基础上，实现统一布局系统、侧边栏导航、主题系统和认证逻辑。

---

## 📋 需要读取的文件

在开始工作前，请依次阅读以下文件：

| 优先级 | 文件路径 | 用途 |
|--------|----------|------|
| 1 | `/Users/kjonekong/Documents/Affi-Marketing/COLLABORATION.md` | 协作机制 ⭐ |
| 2 | `/Users/kjonekong/Documents/Affi-Marketing/docs/ARCHITECTURE.md` | 系统架构 |
| 3 | `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md` | 了解其他角色进度 |
| 4 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/next.config.ts` | 确认Module Federation配置已完成 |
| 5 | `/Users/kjonekong/Documents/Affi-Marketing/frontend-unified/components/vue-component-loader.tsx` | 了解Vue组件加载方式 |

**重要**: 首先阅读 `COLLABORATION.md` 了解协作机制。确认 `frontend-unified/` 项目已存在且可以启动，再开始工作。

---

## 📁 你的工作目录

```
frontend-unified/
│
├── app/
│   ├── layout.tsx          ← [已由01创建] 你需要扩展
│   ├── page.tsx            ← 你需要创建 (首页)
│   ├── (dashboard)/        ← 你需要创建 (Vue微应用路由组)
│   │   ├── layout.tsx      ← 统一布局
│   │   ├── dashboard/
│   │   │   └── page.tsx    ← 仪表板页面
│   │   ├── experiments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── plugins/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settlements/page.tsx
│   │
│   └── (content)/          ← 你需要创建 (React原生路由组)
│       ├── layout.tsx      ← 统一布局 (与dashboard共享)
│       ├── products/page.tsx
│       ├── materials/page.tsx
│       ├── content/page.tsx
│       └── publish/page.tsx
│
├── components/
│   ├── unified-sidebar.tsx ← 你需要创建 (统一侧边栏)
│   ├── unified-header.tsx  ← 你需要创建 (统一顶部栏)
│   ├── protected-route.tsx ← 你需要创建 (路由保护)
│   └── ui/                 ← shadcn/ui组件 (需要安装)
│
└── lib/
    ├── auth.ts             ← 你需要创建 (认证逻辑)
    ├── store.ts            ← 你需要创建 (Zustand状态管理)
    └── api.ts              ← 你需要创建 (API请求封装)
```

---

## 🔧 具体任务

### 任务1: 安装shadcn/ui组件库 (Day 1)

```bash
cd frontend-unified
npx shadcn@latest init
```

选择默认配置，然后安装需要的组件：

```bash
npx shadcn@latest add button input card dialog tabs select badge label separator scroll-area avatar dropdown-menu
```

### 任务2: 创建Zustand状态管理 (Day 1-2)

**文件**: `frontend-unified/lib/store.ts`

```typescript
import { create } from 'zustand'

// 用户状态
interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

// 认证状态
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    // TODO: 实际API调用
    // 演示登录
    if (email === 'demo@example.com' && password === 'password') {
      const user = {
        id: '1',
        email: 'demo@example.com',
        name: '管理员',
        role: 'admin' as const
      }
      const token = 'demo-token-' + Date.now()
      set({ user, token, isAuthenticated: true })
      localStorage.setItem('auth_token', token)
    } else {
      throw new Error('登录失败')
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    localStorage.removeItem('auth_token')
  },

  setUser: (user: User) => set({ user }),
}))

// UI状态 (侧边栏折叠等)
interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
```

### 任务3: 创建统一侧边栏 (Day 2-3)

**文件**: `frontend-unified/components/unified-sidebar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  { id: 'analytics', label: '数据分析', icon: '📈', path: '/analytics', type: 'vue', category: '控制台' },
  { id: 'settlements', label: '佣金结算', icon: '💰', path: '/settlements', type: 'vue', category: '控制台' },

  // React原生组件 - 内容自动化
  { id: 'products', label: '产品管理', icon: '📦', path: '/products', type: 'react', category: '内容自动化' },
  { id: 'materials', label: '素材库', icon: '📄', path: '/materials', type: 'react', category: '内容自动化' },
  { id: 'content', label: '内容管理', icon: '✍️', path: '/content', type: 'react', category: '内容自动化' },
  { id: 'publish', label: '发布中心', icon: '📤', path: '/publish', type: 'react', category: '内容自动化' },

  // SSG博客 - 公开访问
  { id: 'blog', label: '博客首页', icon: '📝', path: '/blog', type: 'ssg', category: '博客' },
  { id: 'blog-list', label: '文章列表', icon: '📚', path: '/blog/list', type: 'ssg', category: '博客' },
]

export function UnifiedSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  // 按类别分组
  const groupedItems = navItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

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

      {/* 用户信息区 */}
      <div className="border-t p-4">
        {user && !sidebarCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start px-2">
                <Avatar className="h-8 w-8">
                  <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
                    {user.name[0]}
                  </div>
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
              <DropdownMenuItem>退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {user && sidebarCollapsed && (
          <Avatar className="mx-auto h-8 w-8">
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground">
              {user.name[0]}
            </div>
          </Avatar>
        )}
      </div>
    </aside>
  )
}
```

### 任务4: 创建统一布局 (Day 3-4)

**文件**: `frontend-unified/app/(dashboard)/layout.tsx`

```tsx
'use client'

import { UnifiedSidebar } from '@/components/unified-sidebar'
import { ProtectedRoute } from '@/components/protected-route'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <UnifiedSidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
```

**文件**: `frontend-unified/components/protected-route.tsx`

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">请先登录</div>
      </div>
    )
  }

  return <>{children}</>
}
```

### 任务5: 创建登录页面 (Day 4-5)

**文件**: `frontend-unified/app/login/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore(state => state.login)
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError('登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>登录</CardTitle>
          <CardDescription>
            使用演示账户登录: demo@example.com / password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 任务6: 创建Vue微应用占位页面 (Day 5-6)

**文件**: `frontend-unified/app/(dashboard)/dashboard/page.tsx`

```tsx
'use client'

import { VueComponentLoader } from '@/components/vue-component-loader'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">仪表板</h1>
      <div className="h-[calc(100vh-200px)]">
        <VueComponentLoader
          componentUrl="/vue-components/dashboard.js"
          componentName="Dashboard"
        />
      </div>
    </div>
  )
}
```

### 任务7: 创建React原生页面 (产品管理) (Day 6-7)

**文件**: `frontend-unified/app/(content)/products/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// 模拟数据
const mockProducts = [
  { asin: 'B08C4KVM9K', title: 'Nespresso 咖啡机', status: 'active' },
  { asin: 'B09F3K2L7M', title: 'DeLonghi 全自动咖啡机', status: 'pending' },
]

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [products] = useState(mockProducts)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">产品管理</h1>
        <Button>添加产品</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4">
            <Input
              placeholder="搜索产品..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ASIN</TableHead>
                <TableHead>产品名称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.asin}>
                  <TableCell>{product.asin}</TableCell>
                  <TableCell>{product.title}</TableCell>
                  <TableCell>{product.status}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">编辑</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## ✅ 完成标准

- [ ] shadcn/ui组件库安装完成
- [ ] Zustand状态管理创建完成
- [ ] 统一侧边栏 (`UnifiedSidebar`) 创建完成
- [ ] 统一布局 (`DashboardLayout`) 创建完成
- [ ] 登录页面创建完成
- [ ] Vue微应用占位页面创建完成
- [ ] React原生页面 (产品管理) 创建完成
- [ ] 登录功能正常工作
- [ ] 侧边栏折叠功能正常
- [ ] 路由跳转正常

---

## 📤 交付物

完成后，请更新 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_PROGRESS.md`:

```markdown
### 02-React前端工程师 - 统一布局和认证
**状态**: ✅完成
**完成时间**: [填写日期]
**产出文件**:
- frontend-unified/lib/store.ts: Zustand状态管理
- frontend-unified/components/unified-sidebar.tsx: 统一侧边栏
- frontend-unified/components/protected-route.tsx: 路由保护
- frontend-unified/app/(dashboard)/layout.tsx: 控制台布局
- frontend-unified/app/(content)/layout.tsx: 内容自动化布局
- frontend-unified/app/login/page.tsx: 登录页面
- frontend-unified/app/(dashboard)/dashboard/page.tsx: Vue仪表板占位
- frontend-unified/app/(content)/products/page.tsx: React产品管理

**测试结果**:
- [ ] 登录功能正常
- [ ] 侧边栏导航正常
- [ ] 路由保护正常
- [ ] 侧边栏折叠正常

**遗留问题**:
- [ ] (如果有，在此列出)
```

---

## ❓ 问题处理

遇到问题时，写入 `/Users/kjonekong/Documents/Affi-Marketing/PROJECT_ISSUES.md`:

```markdown
### [02-React前端] [问题简述]
**提出时间**: YYYY-MM-DD HH:MM
**优先级**: 🔴高 / 🟡中 / 🟢低
**问题描述**:
...

**需要支持**:
- [ ] 需要项目经理决策
- [ ] 需要01-架构师确认: (具体问题)
- [ ] 需要03-Vue迁移配合: (具体问题)
- [ ] 需要04-后端与AI提供: (具体信息)

**当前状态**: 待解决 / 解决中 / 已解决
**解决时间**: YYYY-MM-DD HH:MM
**解决方案**: ...
```

**不要弹窗询问项目经理**，直接写入问题文件，继续其他工作。

---

## 📞 协作提示

1. 你是前端整合的基础，**03-Vue迁移** 需要你的统一布局和侧边栏才能开始工作
2. 完成统一布局后，立即更新 `PROJECT_PROGRESS.md` 通知03角色
3. 你需要为Vue组件提供props接口规范文档
4. **04-后端与AI** 完成API后，需要对接真实API替换Mock数据

---

## 🚀 快速启动

```bash
cd /Users/kjonekong/Documents/Affi-Marketing/frontend-unified
npm run dev
```

---

**任务卡版本**: v2.0
**创建时间**: 2026-03-05
**更新时间**: 2026-03-05

**启动命令**: "导入角色任务卡 /Users/kjonekong/Documents/Affi-Marketing/roles/02-react-frontend.md"
