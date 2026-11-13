import Router from 'koa-router'
import { authMiddleware } from '../utils/authMiddleware.js'
import { getUserProfile, updateUserProfile } from '../controllers/userController.js'

const router = new Router({ prefix: '/api/v1/user' })

router.use(authMiddleware)
router.get('/profile', getUserProfile)
router.patch('/profile', updateUserProfile)

export default router
