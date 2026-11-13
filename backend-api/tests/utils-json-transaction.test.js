import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  parseJson,
  stringifyJson,
  stringifyJsonOrEmptyObject,
  stringifyJsonOrNull
} from '../src/utils/json.js'
import { withTransaction } from '../src/utils/transaction.js'

const state = {
  connection: null
}

vi.mock('../src/models/db.js', () => ({
  getDb: () => ({ getConnection: async () => state.connection })
}))

describe('json helpers', () => {
  it('parses stored JSON and falls back on null or malformed input', () => {
    expect(parseJson('{"a":1}', {})).toEqual({ a: 1 })
    expect(parseJson('[1,2]', [])).toEqual([1, 2])
    expect(parseJson(null, [])).toEqual([])
    expect(parseJson(undefined, {})).toEqual({})
    expect(parseJson('not-json', { fallback: true })).toEqual({ fallback: true })
    // 驱动已解析过的对象原样返回
    expect(parseJson({ a: 1 }, {})).toEqual({ a: 1 })
  })

  it('serializes with a fallback for nullish values', () => {
    expect(stringifyJson({ a: 1 }, {})).toBe('{"a":1}')
    expect(stringifyJson(null, {})).toBe('{}')
    expect(stringifyJson(undefined, [])).toBe('[]')
  })

  it('keeps null as null when the column allows it', () => {
    expect(stringifyJsonOrNull(null)).toBeNull()
    expect(stringifyJsonOrNull(undefined)).toBeNull()
    expect(stringifyJsonOrNull({ a: 1 })).toBe('{"a":1}')
    expect(stringifyJsonOrNull('{"a":1}')).toBe('{"a":1}')
  })

  it('falls back to an empty object literal', () => {
    expect(stringifyJsonOrEmptyObject(null)).toBe('{}')
    expect(stringifyJsonOrEmptyObject(undefined)).toBe('{}')
    expect(stringifyJsonOrEmptyObject({ a: 1 })).toBe('{"a":1}')
    expect(stringifyJsonOrEmptyObject('{"a":1}')).toBe('{"a":1}')
  })
})

describe('withTransaction', () => {
  beforeEach(() => {
    state.connection = {
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn()
    }
  })

  it('commits and returns the work result', async () => {
    const result = await withTransaction(async () => 'done')

    expect(result).toBe('done')
    expect(state.connection.beginTransaction).toHaveBeenCalledTimes(1)
    expect(state.connection.commit).toHaveBeenCalledTimes(1)
    expect(state.connection.rollback).not.toHaveBeenCalled()
    expect(state.connection.release).toHaveBeenCalledTimes(1)
  })

  it('rolls back, rethrows, and still releases on failure', async () => {
    const boom = new Error('db fail')

    await expect(
      withTransaction(async () => {
        throw boom
      })
    ).rejects.toBe(boom)

    expect(state.connection.commit).not.toHaveBeenCalled()
    expect(state.connection.rollback).toHaveBeenCalledTimes(1)
    expect(state.connection.release).toHaveBeenCalledTimes(1)
  })

  it('passes the connection into the work callback', async () => {
    const seen = await withTransaction(async (connection) => connection)
    expect(seen).toBe(state.connection)
  })
})
