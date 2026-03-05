// 标准Props接口 - 来自 docs/COMPONENT_API.md
export interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

export interface ComponentProps {
  user: UserInfo | null
  token: string | null
  apiBaseUrl: string
}

// 标准事件接口
export interface ComponentEmits {
  mounted: () => void
  error: (error: Error) => void
  dataRefresh: (data: any) => void
}

// PostMessage格式
export interface PostMessageData {
  source: 'vue-app' | 'react-app'
  type: string
  payload?: any
}

// 向React父组件发送通知
export function notifyParent(type: string, payload: any): void {
  if (window.parent !== window) {
    const data: PostMessageData = {
      source: 'vue-app',
      type,
      payload
    }
    window.parent.postMessage(data, '*')
  }
}
