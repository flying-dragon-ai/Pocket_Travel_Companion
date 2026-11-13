import Router from 'koa-router'
import { authMiddleware } from '../utils/authMiddleware.js'
import { getBeanAccount, getBeanLogs } from '../controllers/beanController.js'

const router = new Router({ prefix: '/api/v1/beans' })

router.use(authMiddleware)
router.get('/balance', getBeanAccount)
router.get('/logs', getBeanLogs)

export default router
