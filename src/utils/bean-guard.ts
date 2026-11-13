import { canConsumeBeans } from './bean-rule'

/**
 * 豆子消耗前置校验。
 *
 * 余额不足时弹窗说明获取途径并返回 false，调用方据此提前 return。
 * 此前 path.vue（生成路线 / 导入链接）与 route-preview.vue（采纳灵感）
 * 各写一份几乎相同的弹窗，文案里的豆子数还是硬编码。
 */
export function guardBeanCost(balance: number, cost: number, actionLabel: string): boolean {
  if (canConsumeBeans(balance, cost)) {
    return true
  }
  uni.showModal({
    title: '豆子不足',
    content: `${actionLabel}需要${cost}豆子。可以通过打卡、评论或更新心情获取豆子。`
  })
  return false
}
