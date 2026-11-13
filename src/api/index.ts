import { request } from '@/utils/request'

/**
 * 后端接口的唯一入口。
 *
 * 此前每个页面各自拼 `/api/v1/...` 字符串并各自声明响应类型：
 * `fetchBeanBalance` 在 4 个页面各写一份，`fetchUserProfile` / `fetchMoodProfile`
 * 各 2 份。路径或响应结构一变就要改多处，且页面无法脱离网络单独测试。
 * 集中到本模块后，页面只依赖语义化函数名。
 */

export interface BeanAccount {
  balance: number
}

export interface BeanLogEntry {
  id: number | string
  delta: number
  reason: string
  created_at: string
}

export interface MoodProfile {
  moodTags: string[]
  socialIdentity?: string
  lastUpdatedAt?: string | null
}

export interface UserProfile {
  openid?: string
  nickname?: string
  avatarUrl?: string
  interestTags?: string[]
}

export interface RouteSummary {
  id: number | string
  title?: string
  subtitle?: string
  cover?: string
  goneCount?: number
  sceneType?: string
  source_type?: string
  created_at?: string
}

export interface SpotSummary {
  id: number | string
  name?: string
}

export interface RouteGeneratePayload {
  city: string
  dayMode: string
  spotPreferences: string[]
  moodTags: string[]
  previewId?: string
}

export interface RouteGenerationResult {
  routeId: number
  remainingBeans: number
}

export interface PosterResult {
  posterUrl: string
  shareCode?: string
}

/** 豆子账户余额。 */
export function fetchBeanAccount() {
  return request<BeanAccount>('/api/v1/beans/balance', { method: 'GET' })
}

/** 豆子流水。 */
export function fetchBeanLogs() {
  return request<{ list: BeanLogEntry[] }>('/api/v1/beans/logs', { method: 'GET' })
}

/** 情绪画像。 */
export function fetchMoodProfile() {
  return request<MoodProfile>('/api/v1/mood-map/profile', { method: 'GET' })
}

/** 用户资料。 */
export function fetchUserProfile() {
  return request<UserProfile>('/api/v1/user/profile', { method: 'GET' })
}

/** 保存兴趣标签。 */
export function saveInterestTags(interestTags: string[]) {
  return request<{ interestTags: string[] }>('/api/v1/user/profile', {
    method: 'PATCH',
    data: { interestTags }
  })
}

/** 路线列表。 */
export function fetchRouteList() {
  return request<{ list: RouteSummary[] }>('/api/v1/routes', { method: 'GET' })
}

/** 景点列表。 */
export function fetchSpotList() {
  return request<{ list: SpotSummary[] }>('/api/v1/spots', { method: 'GET' })
}

/** 按情绪与偏好生成路线（成功后扣豆）。 */
export function generateRoute(payload: RouteGeneratePayload) {
  return request<RouteGenerationResult>('/api/v1/routes/generate', {
    method: 'POST',
    data: payload
  })
}

/** 按自媒体链接导入并生成路线（成功后扣豆）。 */
export function importRouteByLink(url: string) {
  return request<RouteGenerationResult>('/api/v1/routes/import-link', {
    method: 'POST',
    data: { url }
  })
}

/** 删除路线。 */
export function deleteRoute(routeId: number | string) {
  return request<void>(`/api/v1/routes/${routeId}`, { method: 'DELETE' })
}

/** 收藏景点。 */
export function favoriteSpot(spotId: number | string) {
  return request<{ spotId?: number; favorited?: boolean }>(`/api/v1/spots/${spotId}/favorite`, {
    method: 'POST',
    data: {}
  })
}

/** 生成路线分享码。 */
export function createRouteShare(routeId: number) {
  return request<{ shareCode: string }>('/api/v1/share/route', {
    method: 'POST',
    data: { routeId }
  })
}

/** 生成路线分享海报。 */
export function createRoutePoster(routeId: number) {
  return request<PosterResult>('/api/v1/share/route-poster', {
    method: 'POST',
    data: { routeId }
  })
}

/** 生成景点分享海报。 */
export function createSpotPoster(spotId: number, checkinId = 0) {
  return request<PosterResult>('/api/v1/share/spot-poster', {
    method: 'POST',
    data: { spotId, checkinId }
  })
}
