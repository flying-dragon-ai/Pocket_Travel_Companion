import { BizError } from './errors.js'
import { verifyToken } from './jwt.js'

export async function authMiddleware(ctx, next) {
  const authHeader = ctx.headers.authorization || ''
  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) {
    throw new BizError(10002, '未登录或鉴权失败')
  }
  ctx.state.user = verifyToken(token)
  await next()
}
