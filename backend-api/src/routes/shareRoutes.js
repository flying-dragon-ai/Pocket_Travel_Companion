import Router from 'koa-router'
import { authMiddleware } from '../utils/authMiddleware.js'
import {
  generateRoutePoster,
  generateSpotPoster,
  getSharedContent,
  shareRoute
} from '../controllers/shareController.js'

const router = new Router({ prefix: '/api/v1/share' })

// 分享接收页需要允许未登录访问
router.get('/:shareCode', getSharedContent)

router.use(authMiddleware)
router.post('/route-poster', generateRoutePoster)
router.post('/spot-poster', generateSpotPoster)
router.post('/route', shareRoute)

export default router
