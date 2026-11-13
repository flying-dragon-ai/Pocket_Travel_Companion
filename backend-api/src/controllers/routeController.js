import { ok } from '../utils/response.js'
import { parseJson } from '../utils/json.js'
import { requireFields } from '../utils/validate.js'
import { withTransaction } from '../utils/transaction.js'
import { addBeanLog, getBeanBalanceTx, updateBeanBalanceTx } from '../models/beanModel.js'
import { beanRule, ensureEnoughBeans } from '../utils/beanRule.js'
import {
  createRoute,
  createRouteLegsTx,
  createRouteRunTx,
  createRouteStopsTx,
  deleteRouteById,
  getRouteDetail,
  getRouteList,
  updateRouteRunTx
} from '../models/routeModel.js'
import { BizError } from '../utils/errors.js'
import { buildDeterministicRoutePlan, parseImportLink } from '../utils/routePlanningService.js'


async function recordFailedRouteRun({ userId, payload, sourceType, error }) {
  try {
    await withTransaction((connection) =>
      createRouteRunTx(connection, {
        userId,
        sourceType,
        status: 'failed',
        inputJson: payload,
        error: error.message,
        consumedBeans: 0
      })
    )
  } catch {
    // 审计写入失败不应掩盖原始业务错误
  }
}

async function createChargedRoute({ userId, payload, sourceType, cost, reason }) {
  try {
    return await withTransaction(async (connection) => {
      const runId = await createRouteRunTx(connection, {
        userId,
        sourceType,
        status: 'running',
        inputJson: payload,
        consumedBeans: 0
      })

      const balance = await getBeanBalanceTx(connection, userId, { lock: true })
      ensureEnoughBeans(balance, cost)

      const plan = buildDeterministicRoutePlan(payload, { sourceType, sourceUrl: payload.sourceUrl || '' })
      const routeId = await createRoute(connection, {
        userId,
        title: plan.title,
        subtitle: plan.subtitle,
        sourceType,
        detail: plan.detail
      })
      await createRouteStopsTx(connection, routeId, plan.detail.spots)
      await createRouteLegsTx(connection, routeId, plan.detail.connections)

      const remainingBeans = balance - cost
      await updateBeanBalanceTx(connection, userId, remainingBeans)
      await addBeanLog(connection, { userId, delta: -cost, reason })
      await updateRouteRunTx(connection, runId, {
        status: 'succeeded',
        outputJson: plan.detail,
        routeId,
        consumedBeans: cost
      })

      return {
        routeId,
        consumedBeans: cost,
        remainingBeans,
        moodWeightApplied: plan.detail.moodWeightApplied,
        sourceType,
        route: plan.detail
      }
    })
  } catch (error) {
    await recordFailedRouteRun({ userId, payload, sourceType, error })
    if (error instanceof BizError) throw error

    const code = sourceType === 'import' ? 40002 : 40001
    const message = sourceType === 'import' ? '解析失败，请检查链接或手动生成路线' : '路线生成失败，请重试'
    throw new BizError(code, message, { consumedBeans: 0 })
  }
}

export async function generateRoute(ctx) {
  const userId = ctx.state.user.userId
  requireFields(ctx.request.body, ['city', 'dayMode', 'spotPreferences'])
  const sourceType = ctx.request.body.previewId ? 'adopt' : 'generate'
  const result = await createChargedRoute({
    userId,
    payload: ctx.request.body,
    sourceType,
    cost: beanRule.routeCost,
    reason: sourceType === 'adopt' ? '采纳路线消耗' : '生成路线消耗'
  })
  ok(ctx, result)
}

export async function importRouteByLink(ctx) {
  const userId = ctx.state.user.userId
  requireFields(ctx.request.body, ['url'])
  const parsed = parseImportLink(ctx.request.body.url)
  const result = await createChargedRoute({
    userId,
    payload: parsed,
    sourceType: 'import',
    cost: beanRule.importCost,
    reason: '导入路线消耗'
  })
  ok(ctx, { ...result, parsedSpots: result.route.spots.length })
}

export async function listRoutes(ctx) {
  const userId = ctx.state.user.userId
  const routes = await getRouteList(userId)
  ok(ctx, { list: routes })
}

export async function createRouteDirect(ctx) {
  // 与联调清单兼容：POST /api/v1/routes 走同一生成逻辑
  await generateRoute(ctx)
}

export async function getRoute(ctx) {
  const userId = ctx.state.user.userId
  const route = await getRouteDetail(userId, Number(ctx.params.routeId))
  if (!route) throw new BizError(10001, '路线不存在')
  const detail = parseJson(route.detail_json, {})
  ok(ctx, {
    ...route,
    routeId: route.id,
    title: route.title,
    subtitle: route.subtitle,
    city: detail.city || '',
    dayMode: detail.dayMode || '',
    spots: detail.spots || [],
    connections: detail.connections || [],
    recommendedSpots: detail.recommendedSpots || [],
    moodWeightApplied: Boolean(detail.moodWeightApplied),
    sourceType: route.source_type || detail.sourceType || '',
    detail
  })
}

export async function removeRoute(ctx) {
  const userId = ctx.state.user.userId
  const deleted = await deleteRouteById(userId, Number(ctx.params.routeId))
  if (!deleted) throw new BizError(10001, '路线不存在')
  ok(ctx, { deletedId: deleted.id })
}
