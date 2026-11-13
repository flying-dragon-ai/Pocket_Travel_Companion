import { getActivePinia } from 'pinia'
import { API_BASE_URL, API_TIMEOUT } from '@/config/env'
import { refreshAuthToken } from './auth'
import { useUserStore } from '@/store/user'

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface RequestOptions extends Omit<UniNamespace.RequestOptions, 'url' | 'success' | 'fail' | 'method'> {
  method?: UniNamespace.RequestOptions['method'] | 'PATCH'
  auth?: boolean
  retryOnAuthFail?: boolean
}

/**
 * 请求封装（微信小程序 + 鉴权）：
 * 1. 生产环境 API 为 HTTPS；开发环境允许 HTTP（本地 127.0.0.1 联调）
 * 2. 从 Pinia / 本地存储读取 token，统一注入 Authorization: Bearer
 * 3. 统一处理业务 code；遇 10002 时静默微信重登后重试一次
 */
export async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const fullUrl = buildUrl(url)

  const { auth = true, retryOnAuthFail = true, header = {}, timeout = API_TIMEOUT, method, ...restOptions } = options
  const token = getTokenFromPiniaOrStorage()
  const requestOptions = {
    url: fullUrl,
    ...restOptions,
    ...(method ? { method: method as UniNamespace.RequestOptions['method'] } : {}),
    timeout,
    header: {
      'Content-Type': 'application/json',
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...header
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      ...requestOptions,
      success: (res) => {
        const data = res.data as ApiResponse<T> | T
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(getHttpErrorMessage(res.statusCode, data)))
          return
        }

        if (typeof data === 'object' && data !== null && 'code' in data) {
          const typedData = data as ApiResponse<T>
          if (typedData.code !== 0) {
            if (typedData.code === 10002 && retryOnAuthFail && auth) {
              refreshAuthToken()
                .then(() =>
                  request<T>(url, {
                    ...options,
                    retryOnAuthFail: false
                  })
                    .then(resolve)
                    .catch(reject)
                )
                .catch(reject)
              return
            }
            reject(new Error(typedData.message || '请求失败'))
            return
          }
          resolve(typedData.data)
          return
        }
        resolve(data as T)
      },
      fail: (error: unknown) => {
        // 微信小程序 fail 回调多为 { errMsg }，统一成 Error 便于各页与探索页一致处理
        const errMsg =
          error && typeof error === 'object' && 'errMsg' in error
            ? String((error as { errMsg?: string }).errMsg)
            : ''
        reject(new Error(errMsg || '网络异常，请检查连接'))
      }
    })
  })
}

function getHttpErrorMessage(statusCode: number, data: unknown) {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = String((data as { message?: string }).message || '')
    if (message) return message
  }
  return `请求失败（HTTP ${statusCode}）`
}

function buildUrl(pathOrUrl: string) {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  if (!pathOrUrl.startsWith('/')) return `${API_BASE_URL}/${pathOrUrl}`
  return `${API_BASE_URL}${pathOrUrl}`
}

function getTokenFromPiniaOrStorage() {
  const pinia = getActivePinia()
  if (pinia) {
    const userStore = useUserStore()
    if (userStore.token) return userStore.token
  }
  return uni.getStorageSync('token')
}
