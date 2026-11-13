import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateRoutePoster,
  generateSpotPoster,
  getSharedContent,
  shareRoute
} from '../src/controllers/shareController.js'
import { createShareRecord } from '../src/models/shareModel.js'
import { importOfficialContentBatch } from '../src/models/officialContentModel.js'

const state = {
  rows: [],
  db: null
}

vi.mock('../src/models/db.js', () => ({
  getDb: () => state.db
}))

describe('share contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.rows = []
    state.db = {
      query: vi.fn(async () => [state.rows.shift() || []])
    }
  })

  it('generates route poster fallback data and round-trips share code', async () => {
    state.rows.push(
      [
        {
          id: 9,
          title: '松弛城市漫游',
          subtitle: '适合放松的半日路线',
          detail_json: JSON.stringify({ spots: [{ spotId: 1, name: '林间步道' }] })
        }
      ],
      [{ id: 88 }]
    )

    const posterCtx = {
      state: { user: { userId: 7 } },
      request: { body: { routeId: 9 } }
    }
    await generateRoutePoster(posterCtx)

    expect(posterCtx.body.data).toMatchObject({
      targetType: 'route',
      targetId: 9,
      title: '松弛城市漫游',
      miniProgramPath: '/pages/route-detail/route-detail?routeId=9'
    })
    expect(posterCtx.body.data.shareCode).toHaveLength(12)
    expect(posterCtx.body.data.posterUrl).toContain('route_9')
    expect(posterCtx.body.data.miniProgramCode).toContain(posterCtx.body.data.shareCode)
    expect(state.db.query.mock.calls[1][1][4]).toContain('松弛城市漫游')
    expect(state.db.query.mock.calls[1][1][5]).toBeNull()

    state.rows.push([{ share_type: 'route', target_id: 9, share_code: posterCtx.body.data.shareCode }])
    const lookupCtx = { params: { shareCode: posterCtx.body.data.shareCode } }
    await getSharedContent(lookupCtx)

    expect(lookupCtx.body.data).toEqual({
      exist: true,
      shareType: 'route',
      targetId: 9,
      miniProgramPath: '/pages/route-detail/route-detail?routeId=9'
    })
  })

  it('generates spot poster fallback data for shared spot detail', async () => {
    state.rows.push(
      [
        {
          id: 3,
          name: '治愈花园',
          detail_json: JSON.stringify({ images: ['garden.jpg'], description: '适合拍照和放空' })
        }
      ],
      [{ id: 89 }]
    )

    const ctx = {
      state: { user: { userId: 7 } },
      request: { body: { spotId: 3, checkinId: 12, userPhoto: 'me.jpg' } }
    }
    await generateSpotPoster(ctx)

    expect(ctx.body.data).toMatchObject({
      targetType: 'spot',
      targetId: 3,
      title: '治愈花园',
      userPhoto: 'me.jpg',
      buddyImage: 'pocket-travel-buddy',
      miniProgramPath: '/pages/spot-detail/spot-detail?spotId=3'
    })
    expect(ctx.body.data.posterUrl).toContain('spot_3_12')
    expect(ctx.body.data.miniProgramCode).toContain(ctx.body.data.shareCode)
    expect(state.db.query.mock.calls[1][1][4]).toContain('me.jpg')
    expect(state.db.query.mock.calls[1][1][5]).toBe(12)
  })

  it('creates route share links and reports invalid share codes as non-existing', async () => {
    state.rows.push([{ id: 4, title: '老城路线', detail_json: '{}' }], [{ id: 90 }])
    const shareCtx = {
      state: { user: { userId: 7 } },
      request: { body: { routeId: 4 } }
    }
    await shareRoute(shareCtx)

    expect(shareCtx.body.data.shareCode).toHaveLength(12)
    expect(shareCtx.body.data.shareUrl).toBe(`/api/v1/share/${shareCtx.body.data.shareCode}`)
    expect(shareCtx.body.data.miniProgramPath).toBe('/pages/route-detail/route-detail?routeId=4')

    state.rows.push([])
    const invalidCtx = { params: { shareCode: 'missing-code' } }
    await getSharedContent(invalidCtx)

    expect(invalidCtx.body.data).toEqual({ exist: false })
  })

  it('keeps old share record calls compatible and writes optional metadata', async () => {
    state.rows.push([{ id: 91 }], [{ id: 92 }])

    await createShareRecord({ userId: 7, shareType: 'route', targetId: 4, shareCode: 'legacy-code' })
    await createShareRecord({
      userId: 7,
      shareType: 'spot',
      targetId: 3,
      shareCode: 'spot-code',
      metadataJson: { posterType: 'spot' },
      checkinId: 12
    })

    expect(state.db.query.mock.calls[0][1]).toEqual([7, 'route', 4, 'legacy-code', null, null])
    expect(state.db.query.mock.calls[1][1]).toEqual([7, 'spot', 3, 'spot-code', '{"posterType":"spot"}', 12])
  })

  it('upserts official imports and provider refs idempotently', async () => {
    state.rows.push([{ id: 1, external_id: 'official-1' }], [{ id: 2, external_id: 'poi-1' }])

    const result = await importOfficialContentBatch({
      imports: [
        {
          provider: 'official-cms',
          externalId: 'official-1',
          contentType: 'comment',
          title: '官方精选评论',
          sourceUrl: 'https://official.example/content/1',
          payloadJson: { officialUserId: 1001 }
        }
      ],
      spotProviderRefs: [
        {
          spotId: 3,
          provider: 'official-cms',
          externalId: 'poi-1',
          sourceUrl: 'https://official.example/poi/1',
          payloadJson: { name: '治愈花园' }
        }
      ]
    })

    expect(result.importedContents[0]).toMatchObject({ id: 1, external_id: 'official-1' })
    expect(result.providerRefs[0]).toMatchObject({ id: 2, external_id: 'poi-1' })
    expect(state.db.query.mock.calls[0][0]).toContain('ON CONFLICT (provider, external_id, content_type) DO UPDATE')
    expect(state.db.query.mock.calls[1][0]).toContain('ON CONFLICT (provider, external_id) DO UPDATE')
    expect(state.db.query.mock.calls[0][1][5]).toContain('officialUserId')
  })
})
