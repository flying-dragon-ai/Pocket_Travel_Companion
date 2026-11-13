import { ok } from '../utils/response.js'
import { parseJson } from '../utils/json.js'
import { requireFields } from '../utils/validate.js'
import { getMoodProfile, saveMoodProfile } from '../models/moodModel.js'
import { withTransaction } from '../utils/transaction.js'
import { addBeanLog, claimDailyRewardTx, getBeanBalanceTx, updateBeanBalanceTx } from '../models/beanModel.js'
import { beanRule, clampBeanBalance } from '../utils/beanRule.js'

function extractMoodTags(answers) {
  // 情绪标签提取占位逻辑：后续可由模型/规则引擎替换
  const moodAnswer = answers.find((x) => x.questionNo === 2)
  return moodAnswer?.values?.slice(0, 3) || ['放松中']
}


export async function submitMoodMap(ctx) {
  requireFields(ctx.request.body, ['answers'])
  const { answers, rewardExpected = true } = ctx.request.body
  const userId = ctx.state.user.userId
  const moodTags = extractMoodTags(answers)
  await saveMoodProfile(userId, answers, moodTags)

  let rewardBeans = 0
  let rewardGranted = false
  let balance
  if (rewardExpected) {
    await withTransaction(async (connection) => {
      const claimed = await claimDailyRewardTx(connection, { userId, rewardType: 'mood_update' })
      const currentBalance = await getBeanBalanceTx(connection, userId, { lock: true })
      const nextBalance = claimed ? clampBeanBalance(currentBalance + beanRule.moodUpdateReward) : currentBalance
      rewardBeans = nextBalance - currentBalance
      rewardGranted = rewardBeans > 0
      balance = nextBalance
      if (rewardGranted) {
        await updateBeanBalanceTx(connection, userId, nextBalance)
        await addBeanLog(connection, { userId, delta: rewardBeans, reason: '更新情绪地图奖励' })
      }
    })
  }

  ok(ctx, {
    moodTags,
    rewardBeans,
    rewardGranted,
    balance,
    updatedAt: new Date().toISOString()
  })
}

export async function getMoodMapProfile(ctx) {
  const userId = ctx.state.user.userId
  const profile = await getMoodProfile(userId)
  ok(ctx, {
    socialIdentity: '未设置',
    moodTags: profile ? parseJson(profile.mood_tags_json, []) : [],
    travelRhythm: [],
    lastUpdatedAt: profile?.updated_at || null
  })
}

export async function quickAdjustMood(ctx) {
  requireFields(ctx.request.body, ['moodTags'])
  const userId = ctx.state.user.userId
  const profile = await getMoodProfile(userId)
  const answers = profile ? parseJson(profile.answers_json, []) : []
  await saveMoodProfile(userId, answers, ctx.request.body.moodTags)
  ok(ctx, { moodTags: ctx.request.body.moodTags })
}
