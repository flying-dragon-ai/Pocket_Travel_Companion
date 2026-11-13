import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 用户状态：
 * - 支撑探索页顶部展示（情绪标签、昵称等）
 * - 支撑后续个性化推荐（moodTags）
 */
export const useUserStore = defineStore('user', () => {
  const openid = ref('')
  const nickname = ref('旅行搭子')
  const avatar = ref('')
  const moodTags = ref<string[]>(['放松中'])
  const token = ref(uni.getStorageSync('token') || '')
  const tokenExpireAt = ref(Number(uni.getStorageSync('tokenExpireAt') || 0))

  const primaryMoodText = computed(() => moodTags.value[0] || '未设置')

  function setProfile(payload: { openid?: string; nickname?: string; avatar?: string }) {
    if (payload.openid !== undefined) openid.value = payload.openid
    if (payload.nickname !== undefined) nickname.value = payload.nickname
    if (payload.avatar !== undefined) avatar.value = payload.avatar
  }

  function setMoodTags(tags: string[]) {
    moodTags.value = tags
  }

  function setAuth(payload: { token: string; expireAt: number }) {
    token.value = payload.token
    tokenExpireAt.value = payload.expireAt
  }

  return {
    openid,
    nickname,
    avatar,
    moodTags,
    token,
    tokenExpireAt,
    primaryMoodText,
    setProfile,
    setMoodTags,
    setAuth
  }
})
