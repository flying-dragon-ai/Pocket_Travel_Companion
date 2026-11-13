import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createNotificationTx } from '../src/models/notificationModel.js'
import { BizError } from '../src/utils/errors.js'
import {
  createSpotCheckin,
  getSpotDetail,
  likeSpotComment,
  listSpotComments
} from '../src/controllers/spotController.js'

const state = {
  rows: [],
  connectionRows: [],
  db: null,
  connection: null
}

vi.mock('../src/models/db.js', () => ({
  getDb: () => state.db
}))

describe('spot interaction contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.rows = []
    state.connectionRows = []
    state.connection = {
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
      query: vi.fn(async () => [state.connectionRows.shift() || []])
    }
    state.db = {
      query: vi.fn(async () => [state.rows.shift() || []]),
      getConnection: vi.fn(async () => state.connection)
    }
  })

  it('returns normalized spot detail contract with comments', async () => {
    state.rows.push(
      [
        {
          id: 1,
          name: '林间步道',
          lat: '31.230400',
          lng: '121.473700',
          detail_json: JSON.stringify({
            images: ['a.jpg'],
            description: '适合散步',
            address: '上海市黄浦区',
            weather: { condition: '多云', temp: 20 },
            crowdLevel: '舒适'
          })
        }
      ],
      [{ id: 9, content: '安静有图', images_json: JSON.stringify(['p.jpg']), like_count: 2 }]
    )

    const ctx = { params: { spotId: '1' } }
    await getSpotDetail(ctx)

    expect(ctx.body.data).toMatchObject({
      spotId: 1,
      images: ['a.jpg'],
      description: '适合散步',
      address: '上海市黄浦区',
      coordinates: { lat: 31.2304, lng: 121.4737 },
      weather: { condition: '多云', temp: 20 },
      crowdLevel: '舒适',
      comments: [{ id: 9, images: ['p.jpg'] }]
    })
  })

  it('rejects checkin outside 500m with code 50001 and enforces photo bounds', async () => {
    state.rows.push([{ id: 1, lat: 31.2304, lng: 121.4737 }])
    await expect(
      createSpotCheckin({
        state: { user: { userId: 7 } },
        params: { spotId: '1' },
        request: { body: { lat: 31.24, lng: 121.49, photos: ['a'], dryTags: ['攻略'] } }
      })
    ).rejects.toMatchObject({ code: 50001 })

    state.rows.push([{ id: 1, lat: 31.2304, lng: 121.4737 }])
    await expect(
      createSpotCheckin({
        state: { user: { userId: 7 } },
        params: { spotId: '1' },
        request: { body: { lat: 31.2304, lng: 121.4737, photos: ['a', 'b', 'c', 'd'], dryTags: ['攻略'] } }
      })
    ).rejects.toThrow(BizError)
  })

  it('prioritizes matching profile comments with photos before likes and time', async () => {
    state.rows.push(
      [{ mood_tags_json: JSON.stringify(['安静']) }],
      [
        { id: 1, content: '普通高赞', images_json: JSON.stringify([]), tags_json: JSON.stringify([]), mood_tags_json: JSON.stringify([]), like_count: 99, created_at: '2026-05-01T00:00:00.000Z' },
        { id: 2, content: '有图低赞', images_json: JSON.stringify(['a.jpg']), tags_json: JSON.stringify([]), mood_tags_json: JSON.stringify(['安静']), like_count: 1, created_at: '2026-05-02T00:00:00.000Z' },
        { id: 3, content: '普通新评论', images_json: JSON.stringify([]), tags_json: JSON.stringify([]), mood_tags_json: JSON.stringify([]), like_count: 2, created_at: '2026-05-03T00:00:00.000Z' },
        { id: 4, content: '有图高赞', images_json: JSON.stringify(['b.jpg']), tags_json: JSON.stringify(['安静']), mood_tags_json: JSON.stringify([]), like_count: 20, created_at: '2026-05-01T00:00:00.000Z' }
      ]
    )
    const ctx = { state: { user: { userId: 7 } }, params: { spotId: '1' } }

    await listSpotComments(ctx)

    expect(ctx.body.data.list.map((comment) => comment.id)).toEqual([4, 2, 1, 3])
    expect(ctx.body.data.list[0].images).toEqual(['b.jpg'])
  })

  it('keeps comment likes idempotent per user and increments for different users', async () => {
    state.connection.query = vi.fn(async (sql) => {
      if (sql.includes('FROM comments')) {
        return [[{ id: 5, user_id: 9, like_count: 10 }]]
      }
      if (sql.includes('INSERT INTO comment_likes')) {
        return [[{ id: 1 }]]
      }
      if (sql.includes('UPDATE comments')) {
        return [[{ like_count: 11 }]]
      }
      return [[]]
    })

    const firstCtx = { state: { user: { userId: 7 } }, params: { spotId: '1', commentId: '5' } }
    await likeSpotComment(firstCtx)

    expect(firstCtx.body.data).toEqual({ commentId: 5, likeCount: 11 })
    expect(state.connection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO comment_likes'), [7, 5])
    expect(state.connection.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE comments'), [5, 1])
    expect(state.connection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO notifications'), [
      9,
      7,
      'comment_like',
      '你的评论收到点赞',
      '有人点赞了你的景点评论',
      JSON.stringify({ spotId: 1, commentId: 5, dedupeKey: 'comment_like:5:7' })
    ])

    state.connection.query = vi.fn(async (sql) => {
      if (sql.includes('FROM comments')) {
        return [[{ id: 5, user_id: 9, like_count: 11 }]]
      }
      if (sql.includes('INSERT INTO comment_likes')) {
        return [[]]
      }
      return [[]]
    })

    const duplicateCtx = { state: { user: { userId: 7 } }, params: { spotId: '1', commentId: '5' } }
    await likeSpotComment(duplicateCtx)

    expect(duplicateCtx.body.data).toEqual({ commentId: 5, likeCount: 11 })
    expect(state.connection.query).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE comments'), expect.anything())
    expect(state.connection.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notifications'),
      expect.anything()
    )

    state.connection.query = vi.fn(async (sql) => {
      if (sql.includes('FROM comments')) {
        return [[{ id: 5, user_id: 9, like_count: 11 }]]
      }
      if (sql.includes('INSERT INTO comment_likes')) {
        return [[{ id: 2 }]]
      }
      if (sql.includes('UPDATE comments')) {
        return [[{ like_count: 12 }]]
      }
      return [[]]
    })

    const anotherUserCtx = { state: { user: { userId: 8 } }, params: { spotId: '1', commentId: '5' } }
    await likeSpotComment(anotherUserCtx)

    expect(anotherUserCtx.body.data).toEqual({ commentId: 5, likeCount: 12 })
    expect(state.connection.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO comment_likes'), [8, 5])
  })

  it('rejects missing comment ids', async () => {
    state.connectionRows.push([])
    await expect(
      likeSpotComment({ state: { user: { userId: 7 } }, params: { spotId: '1', commentId: '404' } })
    ).rejects.toMatchObject({ code: 10001 })
    expect(state.connection.rollback).toHaveBeenCalled()
  })

  it('deduplicates notification writes by payload dedupeKey', async () => {
    state.connection.query = vi
      .fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ id: 3 }]])

    const existing = await createNotificationTx(state.connection, {
      recipientUserId: 9,
      actorUserId: 7,
      notificationType: 'comment_like',
      title: '你的评论收到点赞',
      content: '有人点赞了你的景点评论',
      payload: { spotId: 1, commentId: 5 },
      dedupeKey: 'comment_like:5:7'
    })

    expect(existing).toEqual({ id: 3 })
    expect(state.connection.query).toHaveBeenCalledTimes(2)
    expect(state.connection.query).toHaveBeenCalledWith('SELECT pg_advisory_xact_lock(hashtext(?))', [
      'comment_like:5:7'
    ])
    expect(state.connection.query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notifications'),
      expect.anything()
    )
  })
})
