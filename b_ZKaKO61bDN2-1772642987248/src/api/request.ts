import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

const instance = axios.create({
  baseURL: 'https://api-hub.zenconsult.top/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    console.error('[API Error]', message)
    return Promise.reject(error)
  }
)

export function request<T>(config: AxiosRequestConfig): Promise<T> {
  return instance(config) as Promise<T>
}

export default instance
