import { beforeEach, describe, expect, it, vi } from 'vitest'
import { guardBeanCost } from '@/utils/bean-guard'
import { BEAN_RULE } from '@/utils/bean-rule'

const uniMock = globalThis.uni as unknown as {
  showModal: ReturnType<typeof vi.fn>
}

describe('guardBeanCost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes through when the balance covers the cost', () => {
    expect(guardBeanCost(BEAN_RULE.routeGenerationCost, BEAN_RULE.routeGenerationCost, '生成路线')).toBe(true)
    expect(guardBeanCost(200, BEAN_RULE.importRouteCost, '导入链接')).toBe(true)
    expect(uniMock.showModal).not.toHaveBeenCalled()
  })

  it('blocks and explains how to earn beans when the balance is short', () => {
    expect(guardBeanCost(39, BEAN_RULE.routeGenerationCost, '生成路线')).toBe(false)
    expect(uniMock.showModal).toHaveBeenCalledWith({
      title: '豆子不足',
      content: '生成路线需要40豆子。可以通过打卡、评论或更新心情获取豆子。'
    })
  })

  it('keeps the cost and action label in the modal copy', () => {
    guardBeanCost(0, BEAN_RULE.importRouteCost, '导入链接')
    expect(uniMock.showModal).toHaveBeenLastCalledWith({
      title: '豆子不足',
      content: '导入链接需要40豆子。可以通过打卡、评论或更新心情获取豆子。'
    })
  })
})
