import { ok } from '../utils/response.js'
import { parseJson } from '../utils/json.js'
import { requireFields } from '../utils/validate.js'
import { BizError } from '../utils/errors.js'
import { calculateDistanceMeter, checkGpsWithin500Meter } from '../utils/gps.js'
import {
  createCheckin,
  createComment,
  favoriteSpot,
  getComments,
  getSpotById,
  getSpotList,
  likeCommentTx
} from '../models/spotModel.js'
import { beanRule, clampBeanBalance } from '../utils/beanRule.js'
import { withTransaction } from '../utils/transaction.js'
import { addBeanLog, claimDailyRewardTx, getBeanBalanceTx, updateBeanBalanceTx } from '../models/beanModel.js'
import { getMoodProfile } from '../models/moodModel.js'

function normalizeSpotDetail(spot, comments = []) {
  const detail = parseJson(spot.detail_json, {})
  return {
    ...spot,
    spotId: spot.id,
    images: detail.images || [],
    description: detail.description || spot.description || '',
    openTime: detail.openTime || '全天开放',
    ticketInfo: detail.ticketInfo || '免费',
    reservationTip: detail.reservationTip || '无需预约',
    weather: detail.weather || { condition: '晴', temp: 22 },
    crowdLevel: detail.crowdLevel || '一般',
    address: detail.address || '地址待补充',
    coordinates: { lat: Number(spot.lat), lng: Number(spot.lng) },
    comments
  }
}
export async function getSpotDetail(ctx) {
  const spot = await getSpotById(Number(ctx.params.spotId))
  if (!spot) throw new BizError(10001, '景点不存在')
  const comments = await getComments(spot.id)
  ok(ctx, normalizeSpotDetail(spot, comments))
}

export async function listSpots(ctx) {
  const list = await getSpotList()
  ok(ctx, { list })
}

export async function createSpotCheckin(ctx) {
  const userId = ctx.state.user.userId
  const spotId = Number(ctx.params.spotId)
  requireFields(ctx.request.body, ['lat', 'lng', 'photos', 'dryTags'])
  const { lat, lng, photos, dryTags, content = '' } = ctx.request.body

  const spot = await getSpotById(spotId)
  if (!spot) throw new BizError(10001, '景点不存在')
  if (!Array.isArray(photos) || photos.length < 1 || photos.length > 3) {
    throw new BizError(10001, '参数错误: photos 必须为1到3张')
  }
  if (!Array.isArray(dryTags) || dryTags.length < 1) {
    throw new BizError(10001, '参数错误: dryTags 必填')
  }

  const distanceMeter = Math.round(calculateDistanceMeter(lat, lng, spot.lat, spot.lng))
  if (!checkGpsWithin500Meter(distanceMeter)) {
    throw new BizError(50001, '你离景点还有点远哦,到达后再打卡吧', { distanceMeter })
  }

  const checkinId = await createCheckin({ userId, spotId, distanceMeter, photos, dryTags, content })

  let rewardBeans = 0
  await withTransaction(async (connection) => {
    const claimed = await claimDailyRewardTx(connection, {
      userId,
      rewardType: 'checkin',
      targetType: 'spot',
      targetId: spotId
    })
    const balance = await getBeanBalanceTx(connection, userId, { lock: true })
    const nextBalance = claimed ? clampBeanBalance(balance + beanRule.checkinReward) : balance
    rewardBeans = nextBalance - balance
    if (rewardBeans > 0) {
      await updateBeanBalanceTx(connection, userId, nextBalance)
      await addBeanLog(connection, { userId, delta: rewardBeans, reason: '打卡奖励' })
    }
  })

  ok(ctx, { checkinId, distanceMeter, rewardBeans, rewardGranted: rewardBeans > 0 })
}

export async function createSpotComment(ctx) {
  const userId = ctx.state.user.userId
  const spotId = Number(ctx.params.spotId)
  requireFields(ctx.request.body, ['rating', 'content'])
  const { rating, content, images = [], tags = [], moodTags = [] } = ctx.request.body
  const spot = await getSpotById(spotId)
  if (!spot) throw new BizError(10001, '景点不存在')
  if (Number(rating) < 1 || Number(rating) > 5) {
    throw new BizError(10001, '参数错误: rating 必须在1到5之间')
  }
  if (String(content).length > 200) {
    throw new BizError(10001, '参数错误: content 最多200字')
  }
  const commentId = await createComment({ userId, spotId, rating, content, images, tags, moodTags })

  let rewardBeans = 0
  await withTransaction(async (connection) => {
    const claimed = await claimDailyRewardTx(connection, {
      userId,
      rewardType: 'comment',
      targetType: 'spot',
      targetId: spotId
    })
    const balance = await getBeanBalanceTx(connection, userId, { lock: true })
    const nextBalance = claimed ? clampBeanBalance(balance + beanRule.commentReward) : balance
    rewardBeans = nextBalance - balance
    if (rewardBeans > 0) {
      await updateBeanBalanceTx(connection, userId, nextBalance)
      await addBeanLog(connection, { userId, delta: rewardBeans, reason: '评论奖励' })
    }
  })

  ok(ctx, { commentId, rewardBeans, rewardGranted: rewardBeans > 0 })
}

export async function listSpotComments(ctx) {
  const userId = ctx.state.user.userId
  const spotId = Number(ctx.params.spotId)
  const profile = await getMoodProfile(userId)
  const profileTags = parseJson(profile?.mood_tags_json, [])
  const comments = await getComments(spotId, { profileTags })
  ok(ctx, { list: comments })
}

export async function likeSpotComment(ctx) {
  const userId = ctx.state?.user?.userId ?? 0
  const spotId = Number(ctx.params.spotId)
  const commentId = Number(ctx.params.commentId)
  const result = await withTransaction(async (connection) => {
    const liked = await likeCommentTx(connection, { userId, spotId, commentId })
    if (!liked) throw new BizError(10001, '评论不存在')
    return liked
  })
  ok(ctx, { commentId, likeCount: result.like_count })
}

export async function markSpotFavorite(ctx) {
  const userId = ctx.state.user.userId
  const spotId = Number(ctx.params.spotId)
  const spot = await getSpotById(spotId)
  if (!spot) throw new BizError(10001, '景点不存在')
  await favoriteSpot(userId, spotId)
  ok(ctx, { spotId, favorited: true })
}
