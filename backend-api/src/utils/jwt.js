import jwt from 'jsonwebtoken'
import { BizError } from './errors.js'

/**
 * 密钥按调用时读取，便于测试注入与运行时配置。
 *
 * 生产环境缺少 `JWT_SECRET` 时直接抛错：用默认密钥签发 token 等于没有鉴权，
 * 宁可启动失败也不要静默降级。
 */
function resolveSecret() {
  const secret = process.env.JWT_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET 未配置：生产环境禁止使用默认密钥')
  }
  return 'dev-secret'
}

function resolveExpiresIn() {
  return process.env.JWT_EXPIRES_IN || '7d'
}

export function signToken(payload) {
  return jwt.sign(payload, resolveSecret(), { expiresIn: resolveExpiresIn() })
}

export function verifyToken(token) {
  // 密钥解析放在 try 外：配置缺失不能被当成「鉴权失败」吞掉
  const secret = resolveSecret()
  try {
    return jwt.verify(token, secret)
  } catch {
    throw new BizError(10002, '未登录或鉴权失败')
  }
}
