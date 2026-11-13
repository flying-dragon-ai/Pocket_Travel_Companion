import Router from 'koa-router'
import { authMiddleware } from '../utils/authMiddleware.js'
import {
  createRouteDirect,
  generateRoute,
  getRoute,
  importRouteByLink,
  listRoutes,
  removeRoute
} from '../controllers/routeController.js'

const router = new Router({ prefix: '/api/v1/routes' })

router.use(authMiddleware)
router.post('/generate', generateRoute)
router.post('/', createRouteDirect)
router.post('/import-link', importRouteByLink)
router.get('/', listRoutes)
router.get('/:routeId', getRoute)
router.delete('/:routeId', removeRoute)

export default router
