import request from '@/utils/request'
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  User
} from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Mock user data
const mockUser: User = {
  id: 'usr_001',
  email: 'demo@affihub.com',
  name: 'Demo User',
  role: 'admin',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

// Mock auth API
const mockAuthApi = {
  login: async (data: LoginRequest) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      code: 200,
      message: 'Login successful',
      data: {
        token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        user: mockUser
      },
      errors: [],
      timestamp: Date.now()
    }
  },

  register: async (data: RegisterRequest) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return {
      success: true,
      code: 201,
      message: 'Registration successful',
      data: {
        token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        user: {
          ...mockUser,
          email: data.email,
          name: data.name
        }
      },
      errors: [],
      timestamp: Date.now()
    }
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      code: 200,
      message: 'Token refreshed',
      data: {
        token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now()
      },
      errors: [],
      timestamp: Date.now()
    }
  },

  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      code: 200,
      message: 'Logged out successfully',
      data: null,
      errors: [],
      timestamp: Date.now()
    }
  },

  getCurrentUser: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      success: true,
      code: 200,
      message: 'success',
      data: { user: mockUser },
      errors: [],
      timestamp: Date.now()
    }
  }
}

// Real auth API
const realAuthApi = {
  login: (data: LoginRequest) => {
    return request.post<ApiResponse<AuthResponse>>('/auth/login', data)
  },

  register: (data: RegisterRequest) => {
    return request.post<ApiResponse<AuthResponse>>('/auth/register', data)
  },

  refreshToken: (data: RefreshTokenRequest) => {
    return request.post<ApiResponse<{ token: string; refresh_token: string }>>('/auth/refresh', data)
  },

  logout: () => {
    return request.post<ApiResponse<void>>('/auth/logout')
  },

  getCurrentUser: () => {
    return request.get<ApiResponse<{ user: User }>>('/auth/me')
  }
}

// Export appropriate API based on environment
const authApi = USE_MOCK ? mockAuthApi : realAuthApi

export default authApi
export const login = authApi.login
export const register = authApi.register
export const refreshToken = authApi.refreshToken
export const logout = authApi.logout
export const getCurrentUser = authApi.getCurrentUser
