import { BizError } from './errors.js'

export const beanRule = {
  weeklyGrant: 100,
  maxBalance: 200,
  routeCost: 40,
  importCost: 40,
  checkinReward: 10,
  commentReward: 10,
  moodUpdateReward: 5
}

export function clampBeanBalance(balance) {
  return Math.max(0, Math.min(beanRule.maxBalance, balance))
}

/**
 * 路线生成扣费保护：
 * - 成功才扣费
 * - 失败时必须不扣费（由调用方控制事务）
 */
export function ensureEnoughBeans(balance, cost) {
  if (balance < cost) {
    throw new BizError(20001, '豆子不足40，可通过打卡/评论/更新情绪获取，或等待周一发放')
  }
}
