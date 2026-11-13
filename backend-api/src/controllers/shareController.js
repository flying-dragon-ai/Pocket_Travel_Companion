import { ok } from '../utils/response.js'
import { parseJson } from '../utils/json.js'
import { requireFields } from '../utils/validate.js'
import { getRouteDetail } from '../models/routeModel.js'
import { getSpotById } from '../models/spotModel.js'
import { getShareRecordByCode, createShareRecord } from '../models/shareModel.js'
import { BizError } from '../utils/errors.js'
import { v4 as uuidv4 } from 'uuid'

function createShareCode() {
  return uuidv4().replace(/-/g, '').slice(0, 12)
}


function miniProgramPathFor(shareType, targetId) {
  if (shareType === 'spot') return `/pages/spot-detail/spot-detail?spotId=${targetId}`
  return `/pages/route-detail/route-detail?routeId=${targetId}`
}

function miniProgramCodeFor(shareCode) {
  return `mp-code://${shareCode}`
}

export async function generateRoutePoster(ctx) {
  requireFields(ctx.request.body, ['routeId'])
  const userId = ctx.state.user.userId
  const routeId = Number(ctx.request.body.routeId)
  const route = await getRouteDetail(userId, routeId)
  if (!route) throw new BizError(10001, '路线不存在')
  const detail = parseJson(route.detail_json, {})
  const shareCode = createShareCode()
  const metadataJson = {
    posterType: 'route',
    title: route.title || detail.title || '情绪疗愈路线',
    subtitle: route.subtitle || detail.subtitle || '口袋旅行搭子为你生成的周末微旅行灵感',
    coverImage: detail.coverImage || detail.spots?.[0]?.image || '',
    miniProgramPath: miniProgramPathFor('route', routeId)
  }
  await createShareRecord({ userId, shareType: 'route', targetId: routeId, shareCode, metadataJson })
  ok(ctx, {
    targetType: 'route',
    targetId: routeId,
    title: metadataJson.title,
    subtitle: metadataJson.subtitle,
    coverImage: metadataJson.coverImage,
    buddyImage: 'pocket-travel-buddy',
    posterUrl: `https://cdn.example.com/posters/route_${routeId}.png`,
    shareCode,
    miniProgramCode: miniProgramCodeFor(shareCode),
    miniProgramPath: miniProgramPathFor('route', routeId)
  })
}

export async function generateSpotPoster(ctx) {
  requireFields(ctx.request.body, ['spotId', 'checkinId'])
  const userId = ctx.state.user.userId
  const spotId = Number(ctx.request.body.spotId)
  const spot = await getSpotById(spotId)
  if (!spot) throw new BizError(10001, '景点不存在')
  const detail = parseJson(spot.detail_json, {})
  const shareCode = createShareCode()
  const checkinId = Number(ctx.request.body.checkinId)
  const metadataJson = {
    posterType: 'spot',
    title: spot.name || '景点分享',
    subtitle: detail.description || spot.description || '我在这里完成了一次情绪疗愈打卡',
    userPhoto: ctx.request.body.userPhoto || detail.images?.[0] || '',
    spotImage: detail.images?.[0] || '',
    miniProgramPath: miniProgramPathFor('spot', spotId)
  }
  await createShareRecord({ userId, shareType: 'spot', targetId: spotId, shareCode, metadataJson, checkinId })
  ok(ctx, {
    targetType: 'spot',
    targetId: spotId,
    title: metadataJson.title,
    subtitle: metadataJson.subtitle,
    userPhoto: metadataJson.userPhoto,
    spotImage: metadataJson.spotImage,
    buddyImage: 'pocket-travel-buddy',
    posterUrl: `https://cdn.example.com/posters/spot_${spotId}_${checkinId}.png`,
    shareCode,
    miniProgramCode: miniProgramCodeFor(shareCode),
    miniProgramPath: miniProgramPathFor('spot', spotId)
  })
}

export async function shareRoute(ctx) {
  requireFields(ctx.request.body, ['routeId'])
  const userId = ctx.state.user.userId
  const routeId = Number(ctx.request.body.routeId)
  const route = await getRouteDetail(userId, routeId)
  if (!route) {
    throw new BizError(10001, '路线不存在')
  }

  const shareCode = createShareCode()
  await createShareRecord({
    userId,
    shareType: 'route',
    targetId: routeId,
    shareCode
  })
  ok(ctx, {
    shareCode,
    shareUrl: `/api/v1/share/${shareCode}`,
    miniProgramPath: miniProgramPathFor('route', routeId)
  })
}

export async function getSharedContent(ctx) {
  const code = ctx.params.shareCode
  const record = await getShareRecordByCode(code)
  if (!record) {
    ok(ctx, { exist: false })
    return
  }
  ok(ctx, {
    exist: true,
    shareType: record.share_type,
    targetId: record.target_id,
    miniProgramPath: miniProgramPathFor(record.share_type, record.target_id)
  })
}
