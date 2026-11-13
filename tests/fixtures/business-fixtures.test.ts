import { describe, expect, it } from 'vitest'
import {
  authFixtures,
  beanFixtures,
  commentFixtures,
  moodProfileFixtures,
  routeFixtures,
  shareFixtures,
  spotFixtures
} from '../fixtures/business-fixtures'

describe('frontend business fixtures', () => {
  it('provide reusable fixtures for all core business domains', () => {
    expect(authFixtures.user.id).toBe('user-001')
    expect(beanFixtures.account.balance).toBeLessThanOrEqual(beanFixtures.account.cap)
    expect(routeFixtures.preview.spots).toHaveLength(spotFixtures.spots.length)
    expect(routeFixtures.preview.connections[0]?.distanceMeters).toBeGreaterThan(0)
    expect(moodProfileFixtures.answers.moodTags).toContain('想放空')
    expect(commentFixtures.comments[0]?.photos.length).toBeGreaterThan(0)
    expect(shareFixtures.routeShare.shareType).toBe('route')
    expect(shareFixtures.spotShare.shareType).toBe('spot')
  })

  it('keeps route detail fixture compatible with detail contract fields', () => {
    const detail = {
      ...routeFixtures.preview,
      recommendedSpots: spotFixtures.spots.slice(0, 1),
      moodTags: moodProfileFixtures.answers.moodTags
    }

    expect(detail.spots).toHaveLength(spotFixtures.spots.length)
    expect(detail.connections[0]).toMatchObject({ fromSpotId: 'spot-001', toSpotId: 'spot-002' })
    expect(detail.recommendedSpots[0]?.spotId).toBe('spot-001')
    expect(detail.moodTags).toContain('想放空')
  })
})
