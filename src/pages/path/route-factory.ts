export interface RouteGenerateForm {
  city: string
  dayMode: string
  spotPreferences: string[]
}

export interface RouteGeneratePayload extends RouteGenerateForm {
  moodTags: string[]
}

const DAY_MODE_API_VALUES: Record<string, string> = {
  half_day: 'half-day',
  one_day: 'one-day',
  two_day: 'two-day',
  multi_day: 'weekend'
}

export function normalizeDayModeForApi(dayMode: string): string {
  return DAY_MODE_API_VALUES[dayMode] || dayMode
}

export function buildRouteGeneratePayload(form: RouteGenerateForm, moodTags: string[]): RouteGeneratePayload {
  return {
    city: form.city,
    dayMode: normalizeDayModeForApi(form.dayMode),
    spotPreferences: [...form.spotPreferences],
    moodTags: [...moodTags]
  }
}

export function resolveDateRangeText(dayMode: string): string {
  if (dayMode === 'two_day') return '默认选择本周六至周日，可在微信端日期选择器调整，支持2至7天。'
  if (dayMode === 'multi_day') return '请选择2至7天日期范围。'
  return ''
}

export function togglePreferenceValue(list: string[], tag: string): string[] {
  if (list.includes(tag)) return list.filter((item) => item !== tag)
  return [...list, tag]
}
