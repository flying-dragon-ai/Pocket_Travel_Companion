import Router from 'koa-router'
import { wechatLogin } from '../controllers/authController.js'

const router = new Router({ prefix: '/api/v1/auth' })

router.post('/wechat/login', wechatLogin)
router.post('/login', wechatLogin)

export default router
