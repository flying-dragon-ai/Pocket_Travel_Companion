import { isLoggedIn, isTokenExpired, wechatLogin } from './auth'

/**
 * 页面级会话守卫：token 缺失或已过期时静默重登。
 *
 * 此前 9 个页面各写一份同名函数，逻辑完全一致。集中后
 * 登录策略（何时重登、重登走哪个接口）只有一处定义。
 */
export async function ensureSession(): Promise<void> {
  if (!isLoggedIn() || isTokenExpired()) {
    await wechatLogin()
  }
}
