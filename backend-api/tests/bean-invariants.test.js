import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitMoodMap } from '../src/controllers/moodController.js'
import { createSpotCheckin, createSpotComment } from '../src/controllers/spotController.js'
import { grantWeeklyBeansBatch } from '../src/models/beanModel.js'

const state = {
  rows: [],
  connectionRows: [],
  db: null,
  connection: null
}

vi.mock('../src/models/db.js', () => ({
  getDb: () => state.db
}))

describe('bean reward invariants', () => {
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

  it('limits mood update rewards to 5 beans per user per day', async () => {
    state.rows.push([])
    state.connectionRows.push([{ id: 1 }], [{ balance: 100 }], [], [])
    const firstCtx = {
      state: { user: { userId: 7 } },
      request: { body: { answers: [{ questionNo: 2, values: ['放松'] }] } }
    }

    await submitMoodMap(firstCtx)

    expect(firstCtx.body.data).toMatchObject({ rewardBeans: 5, rewardGranted: true })
    expect(state.connection.query).toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [105, 7])

    state.rows.push([])
    state.connectionRows = [[], [{ balance: 105 }]]
    const repeatCtx = {
      state: { user: { userId: 7 } },
      request: { body: { answers: [{ questionNo: 2, values: ['开心'] }] } }
    }

    await submitMoodMap(repeatCtx)

    expect(repeatCtx.body.data).toMatchObject({ rewardBeans: 0, rewardGranted: false })
    expect(state.connection.query).not.toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [110, 7])
  })

  it('keeps checkin rewards idempotent per user spot day', async () => {
    state.rows.push([{ id: 1, lat: 31.2304, lng: 121.4737 }], [{ id: 11 }])
    state.connectionRows.push([{ id: 2 }], [{ balance: 195 }], [], [])
    const firstCtx = {
      state: { user: { userId: 7 } },
      params: { spotId: '1' },
      request: { body: { lat: 31.2304, lng: 121.4737, photos: ['a'], dryTags: ['攻略'], content: '' } }
    }

    await createSpotCheckin(firstCtx)

    expect(firstCtx.body.data).toMatchObject({ rewardBeans: 5, rewardGranted: true })
    expect(state.connection.query).toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [200, 7])

    state.rows.push([{ id: 1, lat: 31.2304, lng: 121.4737 }], [{ id: 12 }])
    state.connectionRows = [[], [{ balance: 200 }]]
    const repeatCtx = {
      state: { user: { userId: 7 } },
      params: { spotId: '1' },
      request: { body: { lat: 31.2304, lng: 121.4737, photos: ['b'], dryTags: ['攻略'], content: '' } }
    }

    await createSpotCheckin(repeatCtx)

    expect(repeatCtx.body.data).toMatchObject({ rewardBeans: 0, rewardGranted: false })
  })


  it('keeps weekly grants idempotent per user week and caps balance at 200', async () => {
    state.connectionRows.push(
      [{ user_id: 7, balance: 150 }, { user_id: 8, balance: 199 }],
      [{ id: 4 }],
      [],
      [],
      [{ id: 5 }],
      [],
      [],
      [{ user_id: 7, balance: 200 }, { user_id: 8, balance: 200 }],
      [],
      []
    )

    const firstResult = await grantWeeklyBeansBatch()

    expect(firstResult).toEqual({ grantCount: 2 })
    expect(state.connection.query).toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [200, 7])
    expect(state.connection.query).toHaveBeenCalledWith('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [200, 8])

    const updateCountAfterFirstRun = state.connection.query.mock.calls.filter(
      ([sql]) => sql === 'UPDATE bean_accounts SET balance = ? WHERE user_id = ?'
    ).length

    const repeatResult = await grantWeeklyBeansBatch()

    expect(repeatResult).toEqual({ grantCount: 0 })
    expect(
      state.connection.query.mock.calls.filter(
        ([sql]) => sql === 'UPDATE bean_accounts SET balance = ? WHERE user_id = ?'
      )
    ).toHaveLength(updateCountAfterFirstRun)
  })
})
