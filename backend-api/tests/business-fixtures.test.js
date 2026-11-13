import { describe, expect, it } from 'vitest'
import {
  authFixtures,
  beanFixtures,
  commentFixtures,
  moodProfileFixtures,
  routeFixtures,
  shareFixtures,
  spotFixtures
} from './fixtures/business-fixtures.js'

describe('backend business fixtures', () => {
  it('provide reusable fixtures for all core business domains', () => {
    expect(authFixtures.user.id).toBe('user-001')
    expect(beanFixtures.account.balance).toBeLessThanOrEqual(beanFixtures.account.cap)
    expect(routeFixtures.preview.spots).toHaveLength(spotFixtures.spots.length)
    expect(routeFixtures.preview.connections[0]?.distanceMeters).toBeGreaterThan(0)
    expect(moodProfileFixtures.answers.moodTags).toContain('想放空')
    expect(commentFixtures.comments[0]?.photos.length).toBeGreaterThan(0)
    expect(shareFixtures.routeShare.share_type).toBe('route')
    expect(shareFixtures.spotShare.share_type).toBe('spot')
  })
})
