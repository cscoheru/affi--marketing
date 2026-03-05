import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { UserInfo, PostMessageData } from '../wrappers/types'

export const useBridgeStore = defineStore('bridge', () => {
  // 状态
  const user = ref<UserInfo | null>(null)
  const token = ref<string | null>(null)
  const isAuthenticated = ref(false)

  // 从localStorage恢复状态
  const hydrate = () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
        isAuthenticated.value = true
        console.log('[BridgeStore] Hydrated auth state from localStorage')
      } catch (error) {
        console.error('[BridgeStore] Failed to parse saved user', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }
  }

  // 监听来自React的消息
  const setupReactListener = () => {
    window.addEventListener('message', (event: MessageEvent) => {
      const data = event.data as PostMessageData

      // 安全检查: 生产环境应验证 origin
      // if (event.origin !== expectedOrigin) return

      if (data.source !== 'react-app') return

      console.log('[BridgeStore] Received message from React:', data.type)

      switch (data.type) {
        case 'auth:login':
          token.value = data.payload?.token || null
          user.value = data.payload?.user || null
          isAuthenticated.value = true
          // 同步到localStorage
          localStorage.setItem('auth_token', data.payload?.token || '')
          localStorage.setItem('auth_user', JSON.stringify(data.payload?.user || null))
          break

        case 'auth:logout':
          token.value = null
          user.value = null
          isAuthenticated.value = false
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          break

        case 'data:refresh':
          // 触发数据刷新 - 可以被其他store监听
          console.log('[BridgeStore] Data refresh requested:', data.payload?.dataType)
          break
      }
    })
  }

  // 向React发送消息
  const sendToReact = (type: string, payload: any = null) => {
    if (window.parent !== window) {
      const data: PostMessageData = {
        source: 'vue-app',
        type,
        payload
      }
      window.parent.postMessage(data, '*')
      console.log('[BridgeStore] Sent message to React:', type)
    }
  }

  // 监听Vue状态变化，同步到React
  watch(
    () => [token.value, user.value, isAuthenticated.value],
    ([newToken, newUser, newAuth]) => {
      sendToReact('auth:state', {
        authenticated: newAuth,
        token: newToken,
        user: newUser
      })
    },
    { deep: true, immediate: false }
  )

  return {
    // 状态
    user,
    token,
    isAuthenticated,

    // 方法
    hydrate,
    setupReactListener,
    sendToReact
  }
})
