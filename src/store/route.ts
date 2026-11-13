import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface RecommendCard {
  id: string | number
  title: string
  subtitle: string
  cover: string
  goneCount: number
  sceneType: string
  recommendationRule: string
}

export interface RouteRecommendationSource {
  id: string | number
  title?: string
  subtitle?: string
  cover?: string
  goneCount?: number
  sceneType?: string
}

const sceneCopy = {
  healing: {
    title: '把自己还给自己',
    subtitle: '安静散步 · 温柔补能 · 慢节奏周末',
    rule: '安静/低落情绪优先推荐自然、散步、低刺激空间'
  },
  social: {
    title: '甜妹出街快门按烂',
    subtitle: '咖啡车 · 滨江风 · 轻社交拍照局',
    rule: '社交/庆祝情绪优先推荐咖啡、展览、出片场景'
  },
  rainy: {
    title: '雨天也能松弛一下',
    subtitle: '室内展览 · 书店 · 热饮回血',
    rule: '雨天优先推荐室内、短距离、可停留空间'
  },
  default: {
    title: '今天也有小小出逃',
    subtitle: '咖啡 · 自然 · 展览 · 轻量探索',
    rule: '无明确画像时使用通用周末微旅行推荐'
  }
}

function resolveSceneType(moodTags: string[], socialIdentity = '', weatherText = '') {
  const moodText = moodTags.join(' ')
  if (/雨|阴/.test(weatherText)) return 'rainy'
  if (/社交|庆祝|拍照|甜妹|朋友/.test(`${moodText} ${socialIdentity}`)) return 'social'
  if (/安静|低落|疲惫|放松|治愈/.test(moodText)) return 'healing'
  return 'default'
}

export function buildPersonalizedRecommendCards(
  routes: RouteRecommendationSource[],
  moodTags: string[],
  socialIdentity = '',
  weatherText = ''
): RecommendCard[] {
  const fallbackScene = resolveSceneType(moodTags, socialIdentity, weatherText)
  const sourceRoutes = routes.length ? routes : [{ id: fallbackScene }]

  return sourceRoutes.map((route, index) => {
    const sceneType = route.sceneType || (index === 0 ? fallbackScene : resolveSceneType(moodTags, socialIdentity, weatherText))
    const copy = sceneCopy[sceneType as keyof typeof sceneCopy] || sceneCopy.default

    return {
      id: route.id,
      title: route.title || copy.title,
      subtitle: route.subtitle || copy.subtitle,
      cover: route.cover || `https://picsum.photos/360/240?route=${encodeURIComponent(String(route.id || index))}`,
      goneCount: route.goneCount ?? 0,
      sceneType,
      recommendationRule: copy.rule
    }
  })
}

/**
 * 路线状态：当前行程 + 推荐卡片（探索页瀑布流）。
 */
export const useRouteStore = defineStore('route', () => {
  const currentRouteId = ref('')
  const historyRouteIds = ref<string[]>([])
  const recommendCards = ref<RecommendCard[]>(
    buildPersonalizedRecommendCards(
      [
        { id: 'route-1', sceneType: 'healing', goneCount: 328 },
        { id: 'route-2', sceneType: 'social', goneCount: 217 }
      ],
      ['放松中'],
      '独处青年',
      '晴'
    )
  )

  function setRecommendCards(cards: RecommendCard[]) {
    recommendCards.value = cards
  }

  return {
    currentRouteId,
    historyRouteIds,
    recommendCards,
    setRecommendCards
  }
})
