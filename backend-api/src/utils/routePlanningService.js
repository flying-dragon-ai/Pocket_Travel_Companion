import { BizError } from './errors.js'

const FALLBACK_SPOTS = [
  {
    spotId: 1,
    name: '林间步道',
    duration: '1h',
    tag: '安静治愈',
    tags: ['自然', '安静治愈', '放松'],
    lat: 31.2304,
    lng: 121.4737,
    reason: '用低强度步行缓冲情绪'
  },
  {
    spotId: 2,
    name: '疗愈咖啡馆',
    duration: '1.5h',
    tag: '拍照出片',
    tags: ['咖啡', '拍照出片', '轻社交'],
    lat: 31.2321,
    lng: 121.476,
    reason: '适合停留记录与轻社交'
  },
  {
    spotId: 3,
    name: '城市天台花园',
    duration: '45min',
    tag: '开阔放松',
    tags: ['夜景', '开阔放松', '放空'],
    lat: 31.2342,
    lng: 121.4788,
    reason: '用开阔视野完成路线收束'
  },
  {
    spotId: 4,
    name: '街区展览空间',
    duration: '1h',
    tag: '充实丰富',
    tags: ['展览', '体验', '充实丰富'],
    lat: 31.236,
    lng: 121.481,
    reason: '用轻量展览补充行程层次'
  }
]

const DAY_MODE_LIMIT = {
  'half-day': 2,
  'one-day': 3,
  weekend: 3,
  'two-day': 4,
  'link-import': 3
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean).map(String) : [String(value)].filter(Boolean)
}

function pickTitle(city, sourceType) {
  if (sourceType === 'import') return `${city}链接导入路线`
  if (sourceType === 'adopt') return `${city}灵感采纳路线`
  return `${city}情绪疗愈路线`
}

function includesAny(values, keywords) {
  return keywords.some((keyword) => values.some((value) => value.includes(keyword) || keyword.includes(value)))
}

function buildConnections(spots) {
  return spots.slice(0, -1).map((spot, index) => ({
    fromSpotId: spot.spotId,
    toSpotId: spots[index + 1].spotId,
    distanceKm: Number((1.2 + index * 0.6).toFixed(1)),
    durationMinute: 12 + index * 8,
    transport: index === 0 ? '步行' : '骑行'
  }))
}

function scoreSpot(spot, preferenceTags, index) {
  const searchable = [spot.name, spot.tag, ...(spot.tags || [])]
  const preferenceScore = includesAny(searchable, preferenceTags) ? 40 : 0
  return preferenceScore + Math.max(0, 10 - index)
}

function buildSpots({ dayMode, moodTags, spotPreferences, mustGoSpots }) {
  const preferenceTags = [...moodTags, ...spotPreferences]
  const mustGoNames = toArray(mustGoSpots)
  const baseSpots = mustGoNames.map((name, index) => ({
    ...FALLBACK_SPOTS[index % FALLBACK_SPOTS.length],
    spotId: 1000 + index,
    name,
    tag: preferenceTags[index % Math.max(preferenceTags.length, 1)] || '必去点',
    tags: ['必去点', ...preferenceTags]
  }))
  const limit = DAY_MODE_LIMIT[dayMode] || DAY_MODE_LIMIT.weekend
  const rankedFallback = FALLBACK_SPOTS
    .map((spot, index) => ({ spot, score: scoreSpot(spot, preferenceTags, index), index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ spot }) => spot)
  const seenNames = new Set()

  return [...baseSpots, ...rankedFallback]
    .filter((spot) => {
      if (seenNames.has(spot.name)) return false
      seenNames.add(spot.name)
      return true
    })
    .slice(0, limit)
    .map((spot, index) => ({
      ...spot,
      order: index + 1,
      moodMatchScore: Math.max(70, 96 - index * 8),
      matchedTags: preferenceTags.slice(0, 3)
    }))
}

export function buildDeterministicRoutePlan(payload, { sourceType = 'generate', sourceUrl = '' } = {}) {
  const city = payload.city || '上海'
  const dayMode = payload.dayMode || 'weekend'
  const moodTags = toArray(payload.moodTags)
  const spotPreferences = toArray(payload.spotPreferences)
  const mustGoSpots = toArray(payload.mustGoSpots)
  const spots = buildSpots({ dayMode, moodTags, spotPreferences, mustGoSpots })

  return {
    title: pickTitle(city, sourceType),
    subtitle: sourceType === 'import' ? '来自自媒体链接解析，可继续微调' : '基于你当前心情生成',
    detail: {
      title: pickTitle(city, sourceType),
      subtitle: sourceType === 'import' ? '来自自媒体链接解析，可继续微调' : '基于你当前心情生成',
      city,
      dayMode,
      sourceType,
      sourceUrl,
      moodWeightApplied: moodTags.length > 0 || spotPreferences.length > 0,
      ragUsed: true,
      ragSources: ['local-top-spots', 'mood-preference-rules'],
      moodTags,
      spotPreferences,
      playTime: payload.playTime || 'half-day',
      atmosphere: payload.atmosphere || moodTags[0] || '轻松疗愈',
      spots,
      connections: buildConnections(spots),
      recommendedSpots: FALLBACK_SPOTS.filter((spot) => !spots.some((item) => item.name === spot.name)).slice(0, 2)
    }
  }
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new BizError(10001, '参数错误: url 无法解析路线内容', { consumedBeans: 0 })
  }
}

function extractPathKeyword(parsed) {
  const segment = parsed.pathname.split('/').filter(Boolean).pop() || ''
  const decoded = safeDecode(segment)
  const hasRouteToken = /(路线|攻略|景点|citywalk|trip|route|spot|poi|walk)/i.test(decoded)
  return hasRouteToken ? decoded : ''
}

export function parseImportLink(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new BizError(10001, '参数错误: url 必须为合法链接', { consumedBeans: 0 })
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) {
    throw new BizError(10001, '参数错误: url 必须为合法链接', { consumedBeans: 0 })
  }

  const pathKeyword = extractPathKeyword(parsed)
  const explicitSpots = toArray(parsed.searchParams.get('spots'))
  const spotPreferences = [...explicitSpots, pathKeyword].filter(Boolean)
  if (spotPreferences.length === 0) {
    throw new BizError(10001, '参数错误: url 无法解析路线内容', { consumedBeans: 0 })
  }

  return {
    city: parsed.searchParams.get('city') || '上海',
    dayMode: 'link-import',
    moodTags: ['导入模式'],
    spotPreferences,
    mustGoSpots: explicitSpots,
    sourceUrl: parsed.toString()
  }
}
