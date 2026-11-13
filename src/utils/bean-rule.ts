export const BEAN_RULE = {
  weeklyGrant: 100,
  weeklyGrantTime: 'monday_00_00',
  maxBalance: 200,
  routeGenerationCost: 40,
  importRouteCost: 40,
  checkinReward: 10,
  commentReward: 10,
  moodUpdateReward: 5
} as const

/**
 * 豆子上限保护：
 * 每周发放/奖励时都必须过该函数，确保余额不超过 200。
 */
export function clampBeanBalance(balance: number) {
  return Math.max(0, Math.min(balance, BEAN_RULE.maxBalance))
}

/**
 * 消耗校验：不足 40 豆子禁止生成路线。
 */
export function canConsumeBeans(balance: number, cost: number) {
  return balance >= cost
}

/**
 * 扣费保护逻辑：
 * .dev.rule 要求生成失败不扣豆子，因此这里仅在成功时返回新余额。
 */
export function consumeBeansOnSuccess(balance: number, cost: number) {
  if (!canConsumeBeans(balance, cost)) {
    throw new Error('豆子不足，无法执行当前操作')
  }
  return clampBeanBalance(balance - cost)
}
