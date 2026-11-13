import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BEAN_RULE, clampBeanBalance, consumeBeansOnSuccess } from '@/utils/bean-rule'

/**
 * 豆子状态管理：
 * 严格遵循 .dev.rule 的扣费与奖励规则。
 */
export const useBeanStore = defineStore('bean', () => {
  const balance = ref(100)
  const logs = ref<Array<{ reason: string; delta: number; createdAt: string }>>([])

  const maxBalance = computed(() => BEAN_RULE.maxBalance)
  const routeCost = computed(() => BEAN_RULE.routeGenerationCost)

  function addBeans(delta: number, reason: string) {
    balance.value = clampBeanBalance(balance.value + delta)
    logs.value.unshift({
      reason,
      delta,
      createdAt: new Date().toISOString()
    })
  }

  function consumeRouteBeans(reason = '生成路线') {
    balance.value = consumeBeansOnSuccess(balance.value, BEAN_RULE.routeGenerationCost)
    logs.value.unshift({
      reason,
      delta: -BEAN_RULE.routeGenerationCost,
      createdAt: new Date().toISOString()
    })
  }

  function setBalance(nextBalance: number) {
    balance.value = clampBeanBalance(nextBalance)
  }

  return {
    balance,
    logs,
    maxBalance,
    routeCost,
    addBeans,
    consumeRouteBeans,
    setBalance
  }
})
