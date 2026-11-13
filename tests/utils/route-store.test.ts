import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { buildPersonalizedRecommendCards, useRouteStore } from '../../src/store/route'

describe('route store personalized recommendations', () => {
  it('builds fallback cards when no routes exist', () => {
    const cards = buildPersonalizedRecommendCards([], [], '', '')

    expect(cards).toHaveLength(1)
    expect(cards[0].sceneType).toBe('default')
    expect(cards[0].title).toContain('今天也有小小出逃')
    expect(cards[0].recommendationRule).toContain('无明确画像')
  })

  it('derives healing, social, and rainy scene copy', () => {
    const healing = buildPersonalizedRecommendCards([{ id: 'h', sceneType: 'healing' }], ['放松'], '独处青年', '晴')[0]
    const social = buildPersonalizedRecommendCards([{ id: 's', sceneType: 'social' }], ['拍照'], '庆祝聚会', '晴')[0]
    const rainy = buildPersonalizedRecommendCards([{ id: 'r', sceneType: 'rainy' }], ['通勤'], '通用', '雨天')[0]

    expect(healing.title).toBe('把自己还给自己')
    expect(healing.recommendationRule).toContain('安静/低落')
    expect(social.title).toBe('甜妹出街快门按烂')
    expect(social.recommendationRule).toContain('社交/庆祝')
    expect(rainy.title).toBe('雨天也能松弛一下')
    expect(rainy.recommendationRule).toContain('雨天优先推荐')
  })

  it('falls back to derived copy and defaults when route fields are missing', () => {
    const cards = buildPersonalizedRecommendCards([{ id: 'x' }], ['放松'], '独处', '晴')

    expect(cards[0].sceneType).toBe('healing')
    expect(cards[0].title).toBe('把自己还给自己')
    expect(cards[0].subtitle).toContain('安静散步')
    expect(cards[0].cover).toContain('route=x')
    expect(cards[0].goneCount).toBe(0)
  })

  it('supports store updates for current and history ids and recommend cards', () => {
    setActivePinia(createPinia())
    const store = useRouteStore()

    expect(store.currentRouteId).toBe('')
    expect(store.historyRouteIds).toEqual([])
    expect(store.recommendCards.length).toBeGreaterThan(0)

    store.setRecommendCards([{ id: 'x', title: '路线', subtitle: '副标题', cover: '', goneCount: 0, sceneType: 'default', recommendationRule: '通用' }])

    expect(store.recommendCards).toHaveLength(1)
    expect(store.recommendCards[0].id).toBe('x')
  })
})
