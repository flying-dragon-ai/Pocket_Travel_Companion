export interface MoodProfile {
  tags: string[]
  updatedAt?: string
}

export const defaultMoodProfile: MoodProfile = {
  tags: []
}

/** 情绪画像超过这个天数就提示用户更新。 */
export const MOOD_REFRESH_DAYS = 7

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * 情绪画像是否该提示更新。
 *
 * 没有记录、时间戳非法、或超过 MOOD_REFRESH_DAYS 天都算「该更新」。
 * 此前这段判断写在 explore.vue 里，用 `7 * 24 * 60 * 60 * 1000` 裸算。
 */
export function shouldPromptMoodUpdate(lastUpdatedAt?: string | null): boolean {
  if (!lastUpdatedAt) return true
  const updatedAt = new Date(lastUpdatedAt).getTime()
  if (Number.isNaN(updatedAt)) return true
  return Date.now() - updatedAt > MOOD_REFRESH_DAYS * MS_PER_DAY
}

/**
 * 后端返回空情绪标签时的兜底文案。
 *
 * explore 与 profile 两个页面此前各写一份 `tags?.length ? tags : ['未设置']`。
 */
export function normalizeMoodTags(tags: string[] | undefined, fallback = '未设置'): string[] {
  return tags?.length ? tags : [fallback]
}
