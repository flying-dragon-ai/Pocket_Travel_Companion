import { getStorage, removeStorage, setStorage } from './storage'
import { useUserStore } from '@/store/user'

const TOKEN_KEY = 'token'
const OPENID_KEY = 'openid'
const TOKEN_EXPIRE_AT_KEY = 'tokenExpireAt'

export interface LoginResult {
  token: string
  openid: string
  userId?: number
}

/**
 * 鉴权状态判断：用于页面守卫或业务入口判断。
 */
export function isLoggedIn() {
  return Boolean(getStorage<string>(TOKEN_KEY))
}

/**
 * 微信登录预处理（前端侧）：
 * - 调用 uni.login 获取 code
 * - 后续应将 code 发送至后端换取 token/openid
 */
export async function getWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (!res.code) {
          reject(new Error('微信登录 code 获取失败'))
          return
        }
        resolve(res.code)
      },
      fail: reject
    })
  })
}

/**
 * 持久化登录态：避免每次进入小程序重复鉴权。
 */
export function saveLoginSession(payload: LoginResult) {
  const expireAt = Date.now() + 6 * 24 * 60 * 60 * 1000
  setStorage(TOKEN_KEY, payload.token)
  setStorage(OPENID_KEY, payload.openid)
  setStorage(TOKEN_EXPIRE_AT_KEY, expireAt)
  const userStore = useUserStore()
  userStore.setProfile({ openid: payload.openid })
  userStore.setAuth({ token: payload.token, expireAt })
}

export function clearLoginSession() {
  removeStorage(TOKEN_KEY)
  removeStorage(OPENID_KEY)
  removeStorage(TOKEN_EXPIRE_AT_KEY)
}

/**
 * 微信登录换票：
 * - 使用统一 request 封装（与业务接口一致的错误码、超时、BASE_URL）
 * - 采用动态 import 避免 request.ts ↔ auth.ts 循环依赖
 * - 后端路径与文档一致：POST /api/v1/auth/login（与 /auth/wechat/login 等价）
 */
export async function wechatLogin() {
  const code = await getWechatLoginCode()
  const { request } = await import('./request')
  const data = await request<LoginResult>('/api/v1/auth/login', {
    method: 'POST',
    auth: false,
    retryOnAuthFail: false,
    data: { code }
  })
  saveLoginSession(data)
  return data
}

export function isTokenExpired() {
  const expireAt = Number(getStorage<number>(TOKEN_EXPIRE_AT_KEY) || 0)
  if (!expireAt) return true
  return Date.now() >= expireAt
}

/**
 * token 续期策略：
 * - 本期后端无 refresh-token 接口，采用微信静默登录重拿 token
 * - 确保请求遇到 10002 时可恢复
 */
export async function refreshAuthToken() {
  await wechatLogin()
}
