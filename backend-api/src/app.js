import dotenv from 'dotenv'
import Koa from 'koa'
import cors from '@koa/cors'
import helmet from 'koa-helmet'
import bodyParser from 'koa-bodyparser'
import { v4 as uuidv4 } from 'uuid'
import router from './routes/index.js'
import { errorMiddleware } from './utils/errorMiddleware.js'
import { logger } from './utils/logger.js'
import { initDb } from './models/db.js'
import { startSchedulers } from './utils/scheduler.js'

dotenv.config()

const app = new Koa()

app.use(errorMiddleware)
app.use(
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Platform', 'X-App-Version', 'X-Request-Id']
  })
)
app.use(helmet())
app.use(bodyParser({ enableTypes: ['json'], jsonLimit: '2mb' }))

app.use(async (ctx, next) => {
  ctx.state.requestId = ctx.headers['x-request-id'] || uuidv4()
  ctx.set('X-Request-Id', ctx.state.requestId)
  await next()
})

app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  logger.info(`${ctx.method} ${ctx.url} ${ctx.status} ${Date.now() - start}ms`)
})

app.use(router.routes())
app.use(router.allowedMethods())

const port = Number(process.env.PORT || 3000)
const allowStartWithoutDb =
  process.env.ALLOW_START_WITHOUT_DB === 'true' || process.env.NODE_ENV !== 'production'

initDb()
  .then(() => {
    startSchedulers()
    app.listen(port, () => {
      logger.info(`backend-api started at http://127.0.0.1:${port}`)
    })
  })
  .catch((error) => {
    if (!allowStartWithoutDb) {
      logger.error('数据库初始化失败，服务未启动', error)
      process.exit(1)
    }

    logger.warn('数据库初始化失败，已降级启动（仅可用无需数据库的接口）', error)
    app.listen(port, () => {
      logger.info(`backend-api started at http://127.0.0.1:${port} (degraded mode)`)
    })
  })
