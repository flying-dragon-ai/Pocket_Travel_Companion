const isProd = import.meta.env.PROD

/**
 * 生产环境 API 地址由 `VITE_API_BASE_URL` 注入，仓库里不写真实服务器地址。
 *
 * 未注入时回落到占位域名：构建仍能通过，但部署前必须配置，
 * 否则请求会打到 example.com。开发环境固定走本地。
 */
export function resolveApiBaseUrl(isProduction: boolean, override = '') {
  if (override) return override
  return isProduction ? 'https://api.example.com' : 'http://127.0.0.1:3000'
}

export const API_BASE_URL = resolveApiBaseUrl(isProd, import.meta.env.VITE_API_BASE_URL || '')

export const API_TIMEOUT = 15000
