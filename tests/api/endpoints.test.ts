import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestMock = vi.fn()

vi.mock('@/utils/request', () => ({
  request: (...args: unknown[]) => requestMock(...args)
}))

const api = await import('@/api')

describe('api endpoints', () => {
  beforeEach(() => {
    requestMock.mockReset()
    requestMock.mockResolvedValue({})
  })

  it('reads bean account and logs', async () => {
    await api.fetchBeanAccount()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/beans/balance', { method: 'GET' })

    await api.fetchBeanLogs()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/beans/logs', { method: 'GET' })
  })

  it('reads mood profile and user profile', async () => {
    await api.fetchMoodProfile()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/mood-map/profile', { method: 'GET' })

    await api.fetchUserProfile()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/user/profile', { method: 'GET' })
  })

  it('patches interest tags', async () => {
    await api.saveInterestTags(['咖啡', '自然'])
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/user/profile', {
      method: 'PATCH',
      data: { interestTags: ['咖啡', '自然'] }
    })
  })

  it('reads route and spot lists', async () => {
    await api.fetchRouteList()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/routes', { method: 'GET' })

    await api.fetchSpotList()
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/spots', { method: 'GET' })
  })

  it('generates and imports routes', async () => {
    const payload = {
      city: '上海',
      dayMode: 'one-day',
      spotPreferences: ['咖啡'],
      moodTags: ['安静']
    }
    await api.generateRoute(payload)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/routes/generate', {
      method: 'POST',
      data: payload
    })

    await api.importRouteByLink('https://example.com/note/1')
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/routes/import-link', {
      method: 'POST',
      data: { url: 'https://example.com/note/1' }
    })
  })

  it('deletes routes and favorites spots by id', async () => {
    await api.deleteRoute(42)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/routes/42', { method: 'DELETE' })

    await api.favoriteSpot('7')
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/spots/7/favorite', {
      method: 'POST',
      data: {}
    })
  })

  it('creates share codes and posters', async () => {
    await api.createRouteShare(9)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/share/route', {
      method: 'POST',
      data: { routeId: 9 }
    })

    await api.createRoutePoster(9)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/share/route-poster', {
      method: 'POST',
      data: { routeId: 9 }
    })

    await api.createSpotPoster(5)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/share/spot-poster', {
      method: 'POST',
      data: { spotId: 5, checkinId: 0 }
    })

    await api.createSpotPoster(5, 3)
    expect(requestMock).toHaveBeenLastCalledWith('/api/v1/share/spot-poster', {
      method: 'POST',
      data: { spotId: 5, checkinId: 3 }
    })
  })
})
