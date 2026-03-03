import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginRequest, AuthResponse } from '@/types'
import * as authApi from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)
  const loading = ref(false)

  // Computed
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  const login = async (credentials: LoginRequest) => {
    loading.value = true
    try {
      const response = await authApi.login(credentials) as any
      const data: AuthResponse = response.data

      token.value = data.token
      user.value = data.user

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      return data
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('refresh_token')
    }
  }

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await authApi.refreshToken({ refresh_token: refreshToken }) as any
    const data = response.data

    token.value = data.token
    localStorage.setItem('token', data.token)
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token)
    }
  }

  const loadUserFromStorage = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user:', error)
      }
    }
  }

  // Initialize user from storage
  loadUserFromStorage()

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    refreshToken,
    loadUserFromStorage
  }
})
