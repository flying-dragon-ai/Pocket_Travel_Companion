import { ok } from '../utils/response.js'
import { parseJson } from '../utils/json.js'
import { BizError } from '../utils/errors.js'
import { requireFields } from '../utils/validate.js'
import { findUserById, updateUserInterestTags } from '../models/userModel.js'


export async function getUserProfile(ctx) {
  const userId = ctx.state.user.userId
  const user = await findUserById(userId)
  if (!user) throw new BizError(10001, '用户不存在')
  ok(ctx, {
    id: user.id,
    openid: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatar_url,
    interestTags: parseJson(user.interest_tags_json, []),
    createdAt: user.created_at
  })
}

export async function updateUserProfile(ctx) {
  requireFields(ctx.request.body, ['interestTags'])
  const userId = ctx.state.user.userId
  const interestTags = ctx.request.body.interestTags
  if (!Array.isArray(interestTags)) throw new BizError(10001, '参数错误: interestTags 必须为数组')
  const row = await updateUserInterestTags(userId, interestTags)
  if (!row) throw new BizError(10001, '用户不存在')
  ok(ctx, { interestTags: parseJson(row.interest_tags_json, interestTags) })
}
