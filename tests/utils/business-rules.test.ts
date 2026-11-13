import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBeanStore } from '@/store/bean'
import { buildPersonalizedRecommendCards, useRouteStore } from '@/store/route'
import { useUserStore } from '@/store/user'
import { API_BASE_URL, API_TIMEOUT, resolveApiBaseUrl } from '@/config/env'
import { BEAN_RULE, canConsumeBeans, clampBeanBalance, consumeBeansOnSuccess } from '@/utils/bean-rule'
import { calculateDistanceMeter, isWithinDistance } from '@/utils/gps-validate'
import { defaultMoodProfile } from '@/utils/mood-map'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'
import {
  clearLoginSession,
  getWechatLoginCode,
  isLoggedIn,
  isTokenExpired,
  refreshAuthToken,
  saveLoginSession,
  wechatLogin
} from '@/utils/auth'
import { request } from '@/utils/request'

const uniMock = globalThis.uni as unknown as {
  request: ReturnType<typeof vi.fn>
  login: ReturnType<typeof vi.fn>
  getStorageSync: ReturnType<typeof vi.fn>
  setStorageSync: ReturnType<typeof vi.fn>
  removeStorageSync: ReturnType<typeof vi.fn>
}

describe('frontend business rules and stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-05T00:00:00.000Z'))
    const storage = new Map<string, unknown>()
    uniMock.getStorageSync.mockImplementation((key: string) => storage.get(key))
    uniMock.setStorageSync.mockImplementation((key: string, value: unknown) => storage.set(key, value))
    uniMock.removeStorageSync.mockImplementation((key: string) => storage.delete(key))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies bean, GPS, storage, and store behavior', () => {
    expect([resolveApiBaseUrl(true), resolveApiBaseUrl(false)]).toContain(API_BASE_URL)
    expect(resolveApiBaseUrl(true)).toBe('https://api.example.com')
    expect(resolveApiBaseUrl(true, 'https://api.pocket-travel-companion.com')).toBe(
      'https://api.pocket-travel-companion.com'
    )
    expect(resolveApiBaseUrl(false)).toBe('http://127.0.0.1:3000')
    expect(API_TIMEOUT).toBe(15000)
    expect(BEAN_RULE.maxBalance).toBe(200)
    expect(clampBeanBalance(260)).toBe(200)
    expect(clampBeanBalance(-8)).toBe(0)
    expect(canConsumeBeans(39, 40)).toBe(false)
    expect(canConsumeBeans(40, 40)).toBe(true)
    expect(consumeBeansOnSuccess(80, 40)).toBe(40)
    expect(() => consumeBeansOnSuccess(10, 40)).toThrow('豆子不足')
    expect(isWithinDistance(500)).toBe(true)
    expect(isWithinDistance(501)).toBe(false)
    expect(calculateDistanceMeter(31.2304, 121.4737, 31.2304, 121.4737)).toBe(0)
    expect(calculateDistanceMeter(31.2304, 121.4737, 31.2314, 121.4737)).toBeGreaterThan(100)
    expect(defaultMoodProfile.tags).toEqual([])

    setStorage('token', 'abc')
    expect(getStorage<string>('token')).toBe('abc')
    removeStorage('token')
    expect(getStorage<string>('token')).toBeNull()

    const beanStore = useBeanStore()
    beanStore.setBalance(250)
    expect(beanStore.balance).toBe(200)
    beanStore.addBeans(10, '打卡奖励')
    expect(beanStore.logs[0]?.reason).toBe('打卡奖励')
    beanStore.setBalance(100)
    beanStore.consumeRouteBeans()
    expect(beanStore.balance).toBe(60)
    expect(beanStore.maxBalance).toBe(200)
    expect(beanStore.routeCost).toBe(40)

    const userStore = useUserStore()
    userStore.setProfile({ openid: 'openid-1', nickname: '测试用户', avatar: 'avatar.png' })
    userStore.setProfile({ nickname: '只改昵称' })
    userStore.setMoodTags([])
    expect(userStore.primaryMoodText).toBe('未设置')
    userStore.setMoodTags(['放松中'])
    userStore.setAuth({ token: 'token-1', expireAt: Date.now() + 1000 })
    expect(userStore.nickname).toBe('只改昵称')
    expect(userStore.openid).toBe('openid-1')
    expect(userStore.avatar).toBe('avatar.png')
    expect(userStore.token).toBe('token-1')

    const routeStore = useRouteStore()
    routeStore.setRecommendCards([
      {
        id: 'r1',
        title: '路线',
        subtitle: '描述',
        cover: 'cover.png',
        goneCount: 1,
        sceneType: 'healing',
        recommendationRule: '安静/低落情绪优先推荐自然、散步、低刺激空间'
      }
    ])
    expect(routeStore.recommendCards[0]?.title).toBe('路线')

    expect(buildPersonalizedRecommendCards([], ['安静'], '独处青年', '晴')[0]).toMatchObject({
      sceneType: 'healing',
      recommendationRule: '安静/低落情绪优先推荐自然、散步、低刺激空间'
    })
    expect(buildPersonalizedRecommendCards([{ id: 'r2', sceneType: 'social' }], ['庆祝'], '朋友出游', '晴')[0]).toMatchObject({
      title: '甜妹出街快门按烂',
      sceneType: 'social'
    })
    expect(buildPersonalizedRecommendCards([{ id: 'r3' }], ['放松中'], '', '上海 · 雨 18℃')[0]).toMatchObject({
      sceneType: 'rainy',
      recommendationRule: '雨天优先推荐室内、短距离、可停留空间'
    })

    // 未知 sceneType 回落到 default 文案
    expect(buildPersonalizedRecommendCards([{ id: 'r4', sceneType: 'unknown' }], ['安静'])[0]).toMatchObject({
      sceneType: 'unknown',
      recommendationRule: '无明确画像时使用通用周末微旅行推荐'
    })

    // 第二条起无 sceneType 时按画像逐条解析；id 为空时用下标兜底封面
    const mixed = buildPersonalizedRecommendCards(
      [{ id: 'r5', sceneType: 'social' }, { id: '' }],
      ['安静'],
      '',
      '晴'
    )
    expect(mixed).toHaveLength(2)
    expect(mixed[1]).toMatchObject({ sceneType: 'healing', goneCount: 0 })
    expect(mixed[1]?.cover).toContain('route=1')
  })

  it('handles login session and wechat login outcomes', async () => {
    expect(isLoggedIn()).toBe(false)
    expect(isTokenExpired()).toBe(true)

    saveLoginSession({ token: 'token-a', openid: 'openid-a', userId: 1 })
    expect(isLoggedIn()).toBe(true)
    expect(isTokenExpired()).toBe(false)
    expect(useUserStore().openid).toBe('openid-a')

    clearLoginSession()
    expect(isLoggedIn()).toBe(false)

    uniMock.login.mockImplementationOnce(({ success }: { success: (res: { code: string }) => void }) =>
      success({ code: 'wx-code' })
    )
    await expect(getWechatLoginCode()).resolves.toBe('wx-code')

    uniMock.login.mockImplementationOnce(({ success }: { success: (res: { code?: string }) => void }) =>
      success({})
    )
    await expect(getWechatLoginCode()).rejects.toThrow('微信登录 code 获取失败')

    uniMock.login.mockImplementationOnce(({ fail }: { fail: (error: Error) => void }) => fail(new Error('login fail')))
    await expect(getWechatLoginCode()).rejects.toThrow('login fail')

    uniMock.login.mockImplementation(({ success }: { success: (res: { code: string }) => void }) =>
      success({ code: 'wx-code-2' })
    )
    uniMock.request.mockImplementation(({ success }: { success: (res: unknown) => void }) =>
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { token: 'token-b', openid: 'openid-b' } } })
    )
    await expect(wechatLogin()).resolves.toMatchObject({ token: 'token-b', openid: 'openid-b' })
    await expect(refreshAuthToken()).resolves.toBeUndefined()
  })

  it('normalizes request success, business errors, HTTP errors, network errors, and auth retry', async () => {
    useUserStore().setAuth({ token: 'token-a', expireAt: Date.now() + 1000 })

    uniMock.request.mockImplementationOnce(({ url, header, success }: { url: string; header: Record<string, string>; success: (res: unknown) => void }) => {
      expect(url).toBe(`${API_BASE_URL}/api/v1/beans/balance`)
      expect(header.Authorization).toBe('Bearer token-a')
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { balance: 100 } } })
    })
    await expect(request('/api/v1/beans/balance')).resolves.toEqual({ balance: 100 })

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 200, data: { hello: 'world' } })
    })
    await expect(request('health', { auth: false })).resolves.toEqual({ hello: 'world' })

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 500, data: { message: 'server down' } })
    })
    await expect(request('/error')).rejects.toThrow('server down')

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 500, data: { message: '' } })
    })
    await expect(request('/error-empty-message')).rejects.toThrow('HTTP 500')

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 404, data: {} })
    })
    await expect(request('/missing')).rejects.toThrow('HTTP 404')

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 200, data: { code: 20001, message: '豆子不足', data: null } })
    })
    await expect(request('/business-error')).rejects.toThrow('豆子不足')

    uniMock.request.mockImplementationOnce(({ success }: { success: (res: unknown) => void }) => {
      success({ statusCode: 200, data: { code: 40001, message: '', data: null } })
    })
    await expect(request('/business-error-empty-message')).rejects.toThrow('请求失败')

    uniMock.request.mockImplementationOnce(({ fail }: { fail: (error: unknown) => void }) => {
      fail({ errMsg: 'timeout' })
    })
    await expect(request('/network')).rejects.toThrow('timeout')

    uniMock.request.mockImplementationOnce(({ fail }: { fail: (error: unknown) => void }) => {
      fail({})
    })
    await expect(request('/network-empty')).rejects.toThrow('网络异常')

    uniMock.setStorageSync('token', 'storage-token')
    useUserStore().setAuth({ token: '', expireAt: Date.now() + 1000 })
    uniMock.request.mockImplementationOnce(({ header, success }: { header: Record<string, string>; success: (res: unknown) => void }) => {
      expect(header.Authorization).toBe('Bearer storage-token')
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { ok: 'storage' } } })
    })
    await expect(request('/storage-token')).resolves.toEqual({ ok: 'storage' })

    setActivePinia(undefined)
    uniMock.request.mockImplementationOnce(({ url, header, success }: { url: string; header: Record<string, string>; success: (res: unknown) => void }) => {
      expect(url).toBe('https://example.test/absolute')
      expect(header.Authorization).toBe('Bearer storage-token')
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { ok: 'absolute' } } })
    })
    await expect(request('https://example.test/absolute')).resolves.toEqual({ ok: 'absolute' })
    setActivePinia(createPinia())

    let callCount = 0
    uniMock.login.mockImplementation(({ success }: { success: (res: { code: string }) => void }) =>
      success({ code: 'refresh-code' })
    )
    uniMock.request.mockImplementation(({ url, success }: { url: string; success: (res: unknown) => void }) => {
      callCount += 1
      if (callCount === 1) {
        success({ statusCode: 200, data: { code: 10002, message: '鉴权失败', data: null } })
        return
      }
      if (url.endsWith('/api/v1/auth/login')) {
        success({ statusCode: 200, data: { code: 0, message: 'ok', data: { token: 'token-new', openid: 'openid-new' } } })
        return
      }
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { ok: true } } })
    })
    await expect(request('/needs-auth')).resolves.toEqual({ ok: true })
    expect(useUserStore().token).toBe('token-new')
  })

  it('keeps frontend API contract payloads stable for comment likes and share posters', async () => {
    uniMock.request.mockImplementationOnce(({ url, success }: { url: string; success: (res: unknown) => void }) => {
      expect(url).toBe(`${API_BASE_URL}/api/v1/spots/spot-001/comments/comment-001/like`)
      success({ statusCode: 200, data: { code: 0, message: 'ok', data: { likeCount: 9 } } })
    })
    await expect(request('/api/v1/spots/spot-001/comments/comment-001/like', { method: 'POST' })).resolves.toEqual({
      likeCount: 9
    })

    uniMock.request.mockImplementationOnce(({ url, success }: { url: string; success: (res: unknown) => void }) => {
      expect(url).toBe(`${API_BASE_URL}/api/v1/share/route-poster`)
      success({
        statusCode: 200,
        data: {
          code: 0,
          message: 'ok',
          data: { posterUrl: 'https://example.test/poster.png', shareCode: 'route-share-001' }
        }
      })
    })
    await expect(request('/api/v1/share/route-poster', { method: 'POST' })).resolves.toEqual({
      posterUrl: 'https://example.test/poster.png',
      shareCode: 'route-share-001'
    })
  })
})
