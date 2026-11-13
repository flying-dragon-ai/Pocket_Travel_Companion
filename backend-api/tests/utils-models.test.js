import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BizError } from '../src/utils/errors.js'
import { authMiddleware } from '../src/utils/authMiddleware.js'
import { beanRule, clampBeanBalance, ensureEnoughBeans } from '../src/utils/beanRule.js'
import { errorMiddleware } from '../src/utils/errorMiddleware.js'
import { calculateDistanceMeter, checkGpsWithin500Meter } from '../src/utils/gps.js'
import { signToken, verifyToken } from '../src/utils/jwt.js'
import { ok, fail } from '../src/utils/response.js'
import { requireFields } from '../src/utils/validate.js'
import { logger } from '../src/utils/logger.js'
import {
  claimDailyRewardTx,
  addBeanLog,
  ensureBeanAccount,
  getBeanBalance,
  getBeanBalanceTx,
  grantWeeklyBeansBatch,
  updateBeanBalanceTx
} from '../src/models/beanModel.js'
import { saveMoodProfile, getMoodProfile } from '../src/models/moodModel.js'
import {
  createRoute,
  createRouteLegsTx,
  createRouteRunTx,
  createRouteStopsTx,
  deleteRouteById,
  getRouteDetail,
  getRouteList,
  updateRouteRunTx
} from '../src/models/routeModel.js'
import { createShareRecord, getShareRecordByCode } from '../src/models/shareModel.js'
import {
  countTodayCheckin,
  countTodayComment,
  createCheckin,
  createComment,
  favoriteSpot,
  getComments,
  getSpotById,
  getSpotList,
  incrementCommentLike
} from '../src/models/spotModel.js'
import { submitMoodMap } from '../src/controllers/moodController.js'
import { createSpotCheckin, createSpotComment } from '../src/controllers/spotController.js'
import { generateRoute, getRoute, importRouteByLink } from '../src/controllers/routeController.js'
import { createUser, findUserById, findUserByOpenid } from '../src/models/userModel.js'
import { buildDeterministicRoutePlan, parseImportLink } from '../src/utils/routePlanningService.js'

const state = {
  rows: [],
  connectionRows: [],
  db: null,
  connection: null
}

vi.mock('../src/models/db.js', () => ({
  getDb: () => state.db
}))

describe('backend utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
    process.env.JWT_EXPIRES_IN = '1h'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_EXPIRES_IN
  })

  it('formats responses and validates business errors', () => {
    const ctx = {}
    ok(ctx, { id: 1 }, 'done')
    expect(ctx.body).toEqual({ code: 0, message: 'done', data: { id: 1 } })
    fail(ctx, 10001, 'bad', { field: 'x' }, 400)
    expect(ctx.status).toBe(400)
    expect(ctx.body).toEqual({ code: 10001, message: 'bad', data: { field: 'x' } })

    expect(() => requireFields({ a: 1 }, ['a'])).not.toThrow()
    for (const payload of [{}, { a: '' }, { a: null }, { a: undefined }]) {
      expect(() => requireFields(payload, ['a'])).toThrow(BizError)
    }

    expect(beanRule.routeCost).toBe(40)
    expect(clampBeanBalance(260)).toBe(200)
    expect(clampBeanBalance(-2)).toBe(0)
    expect(() => ensureEnoughBeans(39, 40)).toThrow(BizError)
    expect(() => ensureEnoughBeans(40, 40)).not.toThrow()

    expect(calculateDistanceMeter(31.2304, 121.4737, 31.2304, 121.4737)).toBe(0)
    expect(calculateDistanceMeter(31.2304, 121.4737, 31.2314, 121.4737)).toBeGreaterThan(100)
    expect(checkGpsWithin500Meter(500)).toBe(true)
    expect(checkGpsWithin500Meter(501)).toBe(false)
  })

  it('builds deterministic route plans and validates import links', () => {
    const plan = buildDeterministicRoutePlan({
      city: '杭州',
      dayMode: 'one-day',
      moodTags: ['放松'],
      spotPreferences: ['咖啡'],
      mustGoSpots: ['西湖'],
      playTime: 'full-day',
      atmosphere: '安静'
    })
    expect(plan.title).toBe('杭州情绪疗愈路线')
    expect(plan.detail).toMatchObject({
      city: '杭州',
      dayMode: 'one-day',
      sourceType: 'generate',
      moodWeightApplied: true,
      playTime: 'full-day',
      atmosphere: '安静'
    })
    expect(plan.detail.spots[0]).toMatchObject({ name: '西湖', order: 1, matchedTags: ['放松', '咖啡'] })
    expect(plan.detail.connections[0]).toMatchObject({ fromSpotId: 1000, toSpotId: 1 })
    expect(plan.detail.recommendedSpots.length).toBeGreaterThan(0)

    const imported = parseImportLink('https://example.com/posts/治愈路线')
    expect(imported).toMatchObject({
      city: '上海',
      dayMode: 'link-import',
      moodTags: ['导入模式'],
      sourceUrl: 'https://example.com/posts/%E6%B2%BB%E6%84%88%E8%B7%AF%E7%BA%BF'
    })
    expect(imported.spotPreferences).toEqual(['治愈路线'])
    expect(() => parseImportLink('https://example.com/')).toThrow(BizError)
    expect(() => parseImportLink('https://example.com/%E0%A4%A')).toThrow(BizError)
    expect(() => parseImportLink('ftp://example.com/a')).toThrow(BizError)
    expect(() => parseImportLink('not-a-url')).toThrow(BizError)
  })

  it('signs, verifies, and rejects JWT tokens through middleware', async () => {
    const token = signToken({ userId: 1, openid: 'openid' })
    expect(verifyToken(token)).toMatchObject({ userId: 1, openid: 'openid' })
    expect(() => verifyToken('bad-token')).toThrow(BizError)

    // 生产环境缺 JWT_SECRET 必须直接失败，不能静默用默认密钥签发
    const originalNodeEnv = process.env.NODE_ENV
    const originalSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET
    process.env.NODE_ENV = 'production'
    try {
      expect(() => signToken({ userId: 1 })).toThrow('JWT_SECRET 未配置')
      expect(() => verifyToken('any-token')).toThrow('JWT_SECRET 未配置')
    } finally {
      process.env.NODE_ENV = originalNodeEnv
      if (originalSecret !== undefined) process.env.JWT_SECRET = originalSecret
    }

    // 非生产环境允许 dev-secret 兜底，保证本地与测试可跑
    delete process.env.JWT_SECRET
    process.env.NODE_ENV = 'development'
    try {
      const devToken = signToken({ userId: 2 })
      expect(verifyToken(devToken)).toMatchObject({ userId: 2 })
    } finally {
      process.env.NODE_ENV = originalNodeEnv
      if (originalSecret !== undefined) process.env.JWT_SECRET = originalSecret
    }

    const ctx = { headers: { authorization: `Bearer ${token}` }, state: {} }
    const next = vi.fn()
    await authMiddleware(ctx, next)
    expect(ctx.state.user.userId).toBe(1)
    expect(next).toHaveBeenCalled()

    await expect(authMiddleware({ headers: {}, state: {} }, vi.fn())).rejects.toMatchObject({ code: 10002 })
    await expect(authMiddleware({ headers: { authorization: 'Basic abc' }, state: {} }, vi.fn())).rejects.toMatchObject({
      code: 10002
    })
  })

  it('converts handled and unhandled errors in middleware', async () => {
    const bizCtx = {}
    await errorMiddleware(bizCtx, async () => {
      throw new BizError(20001, '豆子不足', { balance: 1 })
    })
    expect(bizCtx.body).toEqual({ code: 20001, message: '豆子不足', data: { balance: 1 } })

    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const unknownCtx = {}
    await errorMiddleware(unknownCtx, async () => {
      throw new Error('boom')
    })
    expect(unknownCtx.status).toBe(500)
    expect(unknownCtx.body.code).toBe(90000)
    expect(loggerSpy).toHaveBeenCalled()

    const passCtx = {}
    const next = vi.fn(async () => {
      passCtx.ok = true
    })
    await errorMiddleware(passCtx, next)
    expect(passCtx.ok).toBe(true)
  })
})

describe('backend models', () => {
  beforeEach(() => {
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

  it('queries bean accounts and weekly grants', async () => {
    state.rows.push([{ balance: 90 }], [])
    expect(await getBeanBalance(1)).toBe(90)
    await ensureBeanAccount(1)
    expect(state.db.query).toHaveBeenLastCalledWith(
      'INSERT INTO bean_accounts (user_id, balance) VALUES (?, 100) ON CONFLICT (user_id) DO NOTHING',
      [1]
    )

    state.connectionRows.push([{ id: 99 }], [{ balance: 40 }], [], [], [])
    expect(await claimDailyRewardTx(state.connection, { userId: 1, rewardType: 'mood_update' })).toBe(true)
    expect(await getBeanBalanceTx(state.connection, 1, { lock: true })).toBe(40)
    await addBeanLog(state.connection, { userId: 1, delta: -40, reason: '生成路线' })
    await updateBeanBalanceTx(state.connection, 1, 260)
    expect(state.connection.query).toHaveBeenCalledWith(
      'UPDATE bean_accounts SET balance = ? WHERE user_id = ?',
      [200, 1]
    )
    state.connectionRows = []
    expect(await getBeanBalanceTx(state.connection, 1)).toBe(0)

    state.connectionRows = [
      [
        { user_id: 1, balance: 50 },
        { user_id: 2, balance: 200 }
      ],
      [],
      []
    ]
    await expect(grantWeeklyBeansBatch()).resolves.toEqual({ grantCount: 1 })
    expect(state.connection.commit).toHaveBeenCalled()

    state.connectionRows = [[{ user_id: 1, balance: 50 }]]
    state.connection.query.mockRejectedValueOnce(new Error('db fail'))
    await expect(grantWeeklyBeansBatch()).rejects.toThrow('db fail')
    expect(state.connection.rollback).toHaveBeenCalled()
  })

  it('queries mood, route, share, spot, and user models', async () => {
    state.rows.push([], [{ user_id: 1 }])
    await saveMoodProfile(1, [{ questionNo: 1 }], ['放松'])
    expect(await getMoodProfile(1)).toEqual({ user_id: 1 })

    state.connectionRows.push([{ id: 9 }], [{ id: 21 }], [{ id: 22 }], [{ id: 23, spot_id: 1, stop_order: 1 }], [
      { id: 23, spot_id: 1, stop_order: 1 },
      { id: 24, spot_id: 2, stop_order: 2 }
    ])
    expect(
      await createRoute(state.connection, {
        userId: 1,
        title: '路线',
        subtitle: '描述',
        detail: { spots: [] },
        sourceType: 'generate'
      })
    ).toBe(9)
    expect(
      await createRouteRunTx(state.connection, {
        userId: 1,
        sourceType: 'generate',
        status: 'running',
        inputJson: { city: '杭州' },
        consumedBeans: 0
      })
    ).toBe(21)
    expect(
      await updateRouteRunTx(state.connection, 21, {
        status: 'succeeded',
        outputJson: { title: '路线' },
        routeId: 9,
        consumedBeans: 40
      })
    ).toEqual({ id: 22 })
    expect(await createRouteStopsTx(state.connection, 9, [{ spotId: 1, order: 1, name: '第一站', lat: 30, lng: 120 }])).toEqual([
      { id: 23, spot_id: 1, stop_order: 1 }
    ])
    await createRouteLegsTx(state.connection, 9, [{ fromSpotId: 1, toSpotId: 2, distanceKm: 1.2, durationMinute: 12 }])
    state.rows.push([{ id: 1 }], [{ id: 2 }], [{ id: 3 }])
    expect(await getRouteList(1)).toEqual([{ id: 1 }])
    expect(await getRouteDetail(1, 2)).toEqual({ id: 2 })
    expect(await deleteRouteById(1, 3)).toEqual({ id: 3 })

    state.rows.push([{ id: 4 }], [], [{ share_code: 'abc' }])
    expect(await createShareRecord({ userId: 1, shareType: 'route', targetId: 2, shareCode: 'abc' })).toEqual({
      id: 4
    })
    expect(await createShareRecord({ userId: 1, shareType: 'spot', targetId: 3, shareCode: 'def' })).toBeNull()
    expect(await getShareRecordByCode('abc')).toEqual({ share_code: 'abc' })

    state.rows.push(
      [{ id: 1, name: '景点' }],
      [{ id: 2, name: '景点2' }],
      [{ id: 3 }],
      [{}],
      [{ c: '1' }],
      [{ id: 4 }],
      [{}],
      [{ c: 2 }],
      [{ id: 5, like_count: 8 }],
      [{ like_count: 9 }],
      [{ id: 6 }]
    )
    expect(await getSpotById(1)).toEqual({ id: 1, name: '景点' })
    expect(await getSpotList()).toEqual([{ id: 2, name: '景点2' }])
    expect(await createCheckin({ userId: 1, spotId: 1, distanceMeter: 20, photos: ['a'], dryTags: ['b'], content: '' })).toBe(3)
    expect(await createCheckin({ userId: 1, spotId: 1, distanceMeter: 20, photos: ['a'], dryTags: ['b'], content: '描述' })).toBeUndefined()
    expect(await countTodayCheckin(1, 1)).toBe(1)
    expect(await createComment({ userId: 1, spotId: 1, rating: 5, content: '好', images: [] })).toBe(4)
    expect(await createComment({ userId: 1, spotId: 1, rating: 4, content: '好', images: undefined })).toBeUndefined()
    expect(await countTodayComment(1, 1)).toBe(2)
    expect(await getComments(1)).toEqual([{ id: 5, like_count: 8, images: [], tags: [], moodTags: [] }])
    expect(await incrementCommentLike({ spotId: 1, commentId: 5 })).toEqual({ like_count: 9 })
    expect(await favoriteSpot(1, 1)).toEqual({ id: 6 })

    state.rows.push([{ id: 7 }], [{ id: 8 }], [{ id: 9 }], [{ id: 10 }])
    expect(await findUserByOpenid('openid')).toEqual({ id: 7 })
    expect(await createUser({ openid: 'openid', nickname: '昵称', avatarUrl: 'avatar' })).toEqual({
      id: 8,
      openid: 'openid',
      nickname: '昵称',
      avatarUrl: 'avatar'
    })
    expect(await findUserById(9)).toEqual({ id: 9 })
    expect(await createUser({ openid: 'openid-default' })).toEqual({
      id: 10,
      openid: 'openid-default',
      nickname: '旅行搭子',
      avatarUrl: ''
    })
  })

  it('returns null and zero when models find no rows', async () => {
    state.rows.push([], [], [], [], [], [], [], [], [], [], [])
    expect(await getBeanBalance(1)).toBe(0)
    expect(await getMoodProfile(1)).toBeNull()
    expect(await getRouteDetail(1, 1)).toBeNull()
    expect(await deleteRouteById(1, 1)).toBeNull()
    expect(await getShareRecordByCode('none')).toBeNull()
    expect(await getSpotById(1)).toBeNull()
    expect(await countTodayCheckin(1, 1)).toBe(0)
    expect(await countTodayComment(1, 1)).toBe(0)
    expect(await incrementCommentLike({ spotId: 1, commentId: 1 })).toBeNull()
    expect(await favoriteSpot(1, 1)).toBeNull()
    expect(await findUserByOpenid('none')).toBeNull()
    expect(await findUserById(1)).toBeNull()
  })
})

describe('route controller contracts', () => {
  beforeEach(() => {
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

  it('creates generated routes then consumes exactly 40 beans', async () => {
    state.connectionRows.push([{ id: 41 }], [{ balance: 100 }], [{ id: 31 }], [{ id: 51 }], [{ id: 52 }], [{ id: 53 }], [
      { id: 51, spot_id: 1, stop_order: 1 },
      { id: 52, spot_id: 2, stop_order: 2 },
      { id: 53, spot_id: 3, stop_order: 3 }
    ], [], [], [{ id: 41 }])
    const ctx = {
      state: { user: { userId: 7 } },
      request: {
        body: {
          city: '杭州',
          dayMode: 'one-day',
          spotPreferences: ['咖啡'],
          moodTags: ['放松']
        }
      }
    }

    await generateRoute(ctx)

    expect(ctx.body.data).toMatchObject({
      routeId: 31,
      consumedBeans: 40,
      remainingBeans: 60,
      moodWeightApplied: true,
      sourceType: 'generate'
    })
    expect(ctx.body.data.route).toMatchObject({ city: '杭州', sourceType: 'generate' })
    expect(state.connection.query.mock.calls.some(([sql]) => String(sql).startsWith('INSERT INTO route_stops'))).toBe(true)
    expect(state.connection.query.mock.calls.some(([sql]) => String(sql).startsWith('INSERT INTO route_legs'))).toBe(true)
    expect(state.connection.query).toHaveBeenCalledWith(
      'UPDATE route_generation_runs SET status = ?, result_json = ?, error_message = ?, route_id = ? WHERE id = ? RETURNING id',
      expect.arrayContaining(['succeeded', expect.any(String), '', 31, 41])
    )
    expect(state.connection.query).toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [60, 7])
  })

  it('adopts previews with the same 40 bean charge', async () => {
    state.connection.query.mockImplementation(async (sql) => {
      const text = String(sql)
      if (text.startsWith('SELECT balance')) return [[{ balance: 90 }]]
      if (text.startsWith('INSERT INTO route_generation_runs')) return [[{ id: 42 }]]
      if (text.startsWith('INSERT INTO routes')) return [[{ id: 33 }]]
      if (text.startsWith('INSERT INTO route_stops')) return [[{ id: 54 }]]
      if (text.startsWith('SELECT id, spot_id')) {
        return [[
          { id: 54, spot_id: 3, stop_order: 1 },
          { id: 55, spot_id: 1, stop_order: 2 },
          { id: 56, spot_id: 2, stop_order: 3 }
        ]]
      }
      if (text.startsWith('UPDATE route_generation_runs')) return [[{ id: 42 }]]
      return [[]]
    })
    const ctx = {
      state: { user: { userId: 7 } },
      request: {
        body: {
          previewId: 'preview-1',
          city: '杭州',
          dayMode: 'one-day',
          spotPreferences: ['夜景'],
          moodTags: ['放松']
        }
      }
    }

    await generateRoute(ctx)

    expect(ctx.body.data).toMatchObject({
      routeId: 33,
      consumedBeans: 40,
      remainingBeans: 50,
      sourceType: 'adopt'
    })
    expect(ctx.body.data.route).toMatchObject({ city: '杭州', sourceType: 'adopt' })
  })

  it('rolls back route generation failures without bean updates', async () => {
    state.connection.query.mockImplementation(async (sql) => {
      const text = String(sql)
      if (text.startsWith('SELECT balance')) return [[{ balance: 100 }]]
      if (text.startsWith('INSERT INTO route_generation_runs')) return [[{ id: 43 }]]
      if (text.startsWith('INSERT INTO routes')) throw new Error('route insert failed')
      return [[]]
    })
    const ctx = {
      state: { user: { userId: 7 } },
      request: { body: { city: '杭州', dayMode: 'one-day', spotPreferences: ['咖啡'] } }
    }

    const commitCountBefore = state.connection.commit.mock.calls.length
    await expect(generateRoute(ctx)).rejects.toMatchObject({ code: 40001, data: { consumedBeans: 0 } })
    expect(state.connection.rollback).toHaveBeenCalled()
    expect(state.connection.commit.mock.calls.length).toBe(commitCountBefore + 1)
    expect(state.connection.query).not.toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [60, 7])
    expect(state.connection.query).toHaveBeenCalledWith(
      'INSERT INTO route_generation_runs (user_id, source_type, status, request_json, result_json, error_message, route_id) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      expect.arrayContaining([7, 'generate', 'failed', expect.any(String), null, 'route insert failed', null])
    )
    expect(state.db.getConnection).toHaveBeenCalledTimes(2)
  })

  it('rejects insufficient beans and invalid import links without charging', async () => {
    state.connectionRows.push([{ balance: 39 }])
    await expect(
      generateRoute({
        state: { user: { userId: 7 } },
        request: { body: { city: '杭州', dayMode: 'one-day', spotPreferences: ['咖啡'] } }
      })
    ).rejects.toMatchObject({ code: 20001 })
    expect(state.connection.rollback).toHaveBeenCalled()

    state.db.getConnection.mockClear()
    await expect(
      importRouteByLink({ state: { user: { userId: 7 } }, request: { body: { url: 'bad-link' } } })
    ).rejects.toMatchObject({ code: 10001, data: { consumedBeans: 0 } })
    await expect(
      importRouteByLink({ state: { user: { userId: 7 } }, request: { body: { url: 'https://example.com/' } } })
    ).rejects.toMatchObject({ code: 10001, data: { consumedBeans: 0 } })
    await expect(
      importRouteByLink({ state: { user: { userId: 7 } }, request: { body: { url: 'https://example.com/%E0%A4%A' } } })
    ).rejects.toMatchObject({ code: 10001, data: { consumedBeans: 0 } })
    expect(state.db.getConnection).not.toHaveBeenCalled()
  })

  it('rolls back when charging fails after route creation', async () => {
    state.connection.query.mockImplementation(async (sql) => {
      const text = String(sql)
      if (text.startsWith('INSERT INTO route_generation_runs')) return [[{ id: 45 }]]
      if (text.startsWith('SELECT balance')) return [[{ balance: 100 }]]
      if (text.startsWith('INSERT INTO routes')) return [[{ id: 34 }]]
      if (text.startsWith('INSERT INTO route_stops')) return [[{ id: 61 }]]
      if (text.startsWith('SELECT id, spot_id')) {
        return [[
          { id: 61, spot_id: 1, stop_order: 1 },
          { id: 62, spot_id: 2, stop_order: 2 },
          { id: 63, spot_id: 3, stop_order: 3 }
        ]]
      }
      if (text.startsWith('UPDATE bean_accounts')) throw new Error('charge failed')
      return [[]]
    })
    const ctx = {
      state: { user: { userId: 7 } },
      request: { body: { city: '杭州', dayMode: 'one-day', spotPreferences: ['咖啡'] } }
    }

    const commitCountBefore = state.connection.commit.mock.calls.length
    await expect(generateRoute(ctx)).rejects.toMatchObject({ code: 40001, data: { consumedBeans: 0 } })
    expect(state.connection.rollback).toHaveBeenCalled()
    expect(state.connection.commit.mock.calls.length).toBe(commitCountBefore + 1)
    expect(state.connection.query.mock.calls.some(([sql]) => String(sql).startsWith('INSERT INTO bean_logs'))).toBe(false)
  })

  it('imports valid links and returns normalized route detail contract', async () => {
    state.connection.query.mockImplementation(async (sql) => {
      const text = String(sql)
      if (text.startsWith('SELECT balance')) return [[{ balance: 80 }]]
      if (text.startsWith('INSERT INTO route_generation_runs')) return [[{ id: 46 }]]
      if (text.startsWith('INSERT INTO routes')) return [[{ id: 32 }]]
      if (text.startsWith('INSERT INTO route_stops')) return [[{ id: 57 }]]
      if (text.startsWith('SELECT id, spot_id')) {
        return [[
          { id: 57, spot_id: 1, stop_order: 1 },
          { id: 58, spot_id: 2, stop_order: 2 },
          { id: 59, spot_id: 3, stop_order: 3 }
        ]]
      }
      if (text.startsWith('UPDATE route_generation_runs')) return [[{ id: 46 }]]
      return [[]]
    })
    const importCtx = {
      state: { user: { userId: 7 } },
      request: { body: { url: 'https://example.com/posts/quiet-route' } }
    }
    await importRouteByLink(importCtx)
    expect(importCtx.body.data).toMatchObject({
      routeId: 32,
      parsedSpots: 3,
      consumedBeans: 40,
      remainingBeans: 40,
      sourceType: 'import'
    })

    const detail = {
      city: '上海',
      dayMode: 'link-import',
      spots: [{ spotId: 1 }],
      connections: [],
      recommendedSpots: [{ spotId: 2 }],
      moodWeightApplied: true,
      sourceType: 'import'
    }
    state.rows.push([
      {
        id: 32,
        title: '链接导入路线',
        created_at: '2026-05-06T00:00:00.000Z',
        detail_json: JSON.stringify(detail),
        source_type: 'import'
      }
    ])
    const detailCtx = { state: { user: { userId: 7 } }, params: { routeId: '32' } }
    await getRoute(detailCtx)
    expect(detailCtx.body.data).toMatchObject({
      id: 32,
      source_type: 'import',
      created_at: '2026-05-06T00:00:00.000Z',
      city: '上海',
      dayMode: 'link-import',
      spots: [{ spotId: 1 }],
      recommendedSpots: [{ spotId: 2 }],
      moodWeightApplied: true,
      sourceType: 'import'
    })
  })
})
