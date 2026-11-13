import Router from 'koa-router'
import swagger from 'swagger-ui-koa'
import fs from 'node:fs'

const router = new Router()
const openapiDoc = JSON.parse(
  fs.readFileSync(new URL('../../docs/openapi.json', import.meta.url), 'utf-8')
)

router.get('/openapi.json', (ctx) => {
  ctx.body = openapiDoc
})

router.get('/docs', swagger.serve, swagger.setup(openapiDoc))

export default router
