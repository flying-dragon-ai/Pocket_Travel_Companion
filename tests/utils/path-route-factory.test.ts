import { describe, expect, it } from 'vitest'
import { buildRouteGeneratePayload, normalizeDayModeForApi, resolveDateRangeText, togglePreferenceValue } from '../../src/pages/path/route-factory'

describe('path route factory logic', () => {
  it('builds route generation payload without mutating form arrays', () => {
    const form = {
      city: '上海',
      dayMode: 'one_day',
      spotPreferences: ['节奏舒缓', '拍照出片']
    }
    const moodTags = ['放松', '安静']

    const payload = buildRouteGeneratePayload(form, moodTags)

    expect(payload).toEqual({
      city: '上海',
      dayMode: 'one-day',
      spotPreferences: ['节奏舒缓', '拍照出片'],
      moodTags: ['放松', '安静']
    })
    expect(payload.spotPreferences).not.toBe(form.spotPreferences)
    expect(payload.moodTags).not.toBe(moodTags)
  })

  it('normalizes day mode values for backend route planning', () => {
    expect(normalizeDayModeForApi('half_day')).toBe('half-day')
    expect(normalizeDayModeForApi('one_day')).toBe('one-day')
    expect(normalizeDayModeForApi('two_day')).toBe('two-day')
    expect(normalizeDayModeForApi('multi_day')).toBe('weekend')
    expect(normalizeDayModeForApi('link-import')).toBe('link-import')
  })

  it('resolves date range helper text for multi-day modes', () => {
    expect(resolveDateRangeText('two_day')).toContain('支持2至7天')
    expect(resolveDateRangeText('multi_day')).toBe('请选择2至7天日期范围。')
    expect(resolveDateRangeText('one_day')).toBe('')
  })

  it('toggles preference values immutably', () => {
    const source = ['咖啡', '自然']

    expect(togglePreferenceValue(source, '咖啡')).toEqual(['自然'])
    expect(togglePreferenceValue(source, '展览')).toEqual(['咖啡', '自然', '展览'])
    expect(source).toEqual(['咖啡', '自然'])
  })
})
