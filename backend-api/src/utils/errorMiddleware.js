import { BizError } from './errors.js'
import { logger } from './logger.js'

export async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (error) {
    if (error instanceof BizError) {
      ctx.status = error.status
      ctx.body = {
        code: error.code,
        message: error.message,
        data: error.data
      }
      return
    }

    logger.error('UnhandledError', error)
    ctx.status = 500
    ctx.body = {
      code: 90000,
      message: '系统异常',
      data: null
    }
  }
}
