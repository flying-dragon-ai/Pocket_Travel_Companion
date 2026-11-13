import Router from 'koa-router'
import authRoutes from './authRoutes.js'
import moodRoutes from './moodRoutes.js'
import routeRoutes from './routeRoutes.js'
import spotRoutes from './spotRoutes.js'
import beanRoutes from './beanRoutes.js'
import shareRoutes from './shareRoutes.js'
import docsRoutes from './docsRoutes.js'
import userRoutes from './userRoutes.js'
import { ok } from '../utils/response.js'

const router = new Router()

router.get('/health', (ctx) => ok(ctx, { status: 'ok' }))
router.use(authRoutes.routes(), authRoutes.allowedMethods())
router.use(moodRoutes.routes(), moodRoutes.allowedMethods())
router.use(routeRoutes.routes(), routeRoutes.allowedMethods())
router.use(spotRoutes.routes(), spotRoutes.allowedMethods())
router.use(beanRoutes.routes(), beanRoutes.allowedMethods())
router.use(shareRoutes.routes(), shareRoutes.allowedMethods())
router.use(userRoutes.routes(), userRoutes.allowedMethods())
router.use(docsRoutes.routes(), docsRoutes.allowedMethods())

export default router
