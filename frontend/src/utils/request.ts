import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and token refresh
request.interceptors.response.use(
  (response) => {
    // Return the data part of the response directly
    return response.data
  },
  async (error: AxiosError<ApiResponse>) => {
    const userStore = useUserStore()

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/refresh')) {
      try {
        // Try to refresh the token
        await userStore.refreshToken()
        // Retry the original request with new token
        if (error.config) {
          return request(error.config)
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        userStore.logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const message = error.response?.data?.message || error.message || 'Request failed'
    ElMessage.error(message)

    return Promise.reject(error)
  }
)

export default request
