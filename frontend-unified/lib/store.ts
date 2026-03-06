import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { updateApiToken, clearApiToken } from './api'

// 主题状态
type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
)

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
  initializeAuth: () => void
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
      localStorage.setItem('auth_user', JSON.stringify(user))
      // 更新 API 客户端的 token
      updateApiToken(token)
    } else {
      throw new Error('登录失败')
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    // 清除 API 客户端的 token
    clearApiToken()
  },

  setUser: (user: User) => set({ user }),

  initializeAuth: () => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User
        set({ user, token, isAuthenticated: true })
        // 更新 API 客户端的 token
        updateApiToken(token)
      } catch {
        // Invalid stored user, clear everything
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  },
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
