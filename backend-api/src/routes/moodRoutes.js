import Router from 'koa-router'
import { authMiddleware } from '../utils/authMiddleware.js'
import { getMoodMapProfile, quickAdjustMood, submitMoodMap } from '../controllers/moodController.js'

const router = new Router({ prefix: '/api/v1/mood-map' })

router.use(authMiddleware)
router.post('/submit', submitMoodMap)
router.get('/profile', getMoodMapProfile)
router.patch('/quick-adjust', quickAdjustMood)

export default router
