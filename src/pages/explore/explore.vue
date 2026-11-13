<template>
  <view class="explore-page">
    <!-- 顶部状态栏：显示当前心情和豆子余额 -->
    <view class="explore-status">
      <view class="status-row">
        <text class="status-city">📍 上海 · ☀️ 22℃</text>
        <text class="status-bean">🫘 {{ beanBalance }}</text>
      </view>
      <view class="status-row">
        <text class="status-mood">😌 {{ primaryMood }}</text>
        <text v-if="moodUpdateHint" class="status-bean" @tap="goToMoodQa">{{ moodUpdateHint }}</text>
        <text v-else class="status-bean" @tap="goToMoodQa">更新心情</text>
      </view>
    </view>

    <!-- 快捷导入入口：探索页只负责切到路径页，导入表单由路径页承载。 -->
    <view class="import-entry" @tap="onImportTap">
      <text class="import-placeholder">粘贴小红书/抖音链接，一键抄作业...</text>
      <text class="import-btn">导入</text>
    </view>

    <!-- 瀑布流推荐卡片 -->
    <view class="waterfall">
      <view
        v-for="card in recommendCards"
        :key="card.id"
        class="recommend-card"
        @tap="goToRoutePreview(card)"
      >
        <image class="recommend-cover" :src="card.cover" mode="aspectFill" />
        <view class="recommend-body">
          <text class="recommend-title">{{ card.title }}</text>
          <text class="recommend-subtitle">{{ card.subtitle }}</text>
          <text class="recommend-rule">{{ card.recommendationRule }}</text>
          <text class="recommend-gone">👥 {{ card.goneCount }} 人去过</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBeanStore } from '@/store/bean'
import { buildPersonalizedRecommendCards, useRouteStore } from '@/store/route'
import { useUserStore } from '@/store/user'
import { fetchBeanAccount, fetchMoodProfile, fetchUserProfile } from '@/api'
import { request } from '@/utils/request'
import { errorMessage } from '@/utils/feedback'
import { MOOD_REFRESH_DAYS, normalizeMoodTags, shouldPromptMoodUpdate } from '@/utils/mood-map'
import { ensureSession } from '@/utils/session'

const userStore = useUserStore()
const beanStore = useBeanStore()
const routeStore = useRouteStore()
const moodUpdateHint = ref('')

// 从 Pinia 获取情绪标签与豆子余额，满足 PRD 顶部状态栏展示需求。
const primaryMood = computed(() => userStore.primaryMoodText)
const beanBalance = computed(() => beanStore.balance)
const recommendCards = computed(() => routeStore.recommendCards)

onMounted(async () => {
  try {
    // 无 token 或本地过期时间已到：重新走微信静默登录，避免首屏接口批量 10002
    await ensureSession()
    await Promise.all([loadUserProfile(), loadBeanBalance()])
    await loadMoodProfile()
    await loadRoutes()
  } catch (error) {
    uni.showToast({
      title: errorMessage(error, '加载失败'),
      icon: 'none'
    })
  }
})

function goToMoodQa() {
  uni.navigateTo({
    url: '/pages/mood-qa/mood-qa'
  })
}

function onImportTap() {
  uni.setStorageSync('pathOpenImport', '1')
  uni.switchTab({
    url: '/pages/path/path'
  })
}

function goToRoutePreview(card: { id: string | number; title: string; subtitle: string; cover: string }) {
  uni.navigateTo({
    url:
      `/pages/route-preview/route-preview?recommendId=${encodeURIComponent(String(card.id))}` +
      `&title=${encodeURIComponent(card.title)}` +
      `&subtitle=${encodeURIComponent(card.subtitle)}` +
      `&cover=${encodeURIComponent(card.cover)}`
  })
}

async function loadUserProfile() {
  const data = await fetchUserProfile()
  userStore.setProfile({
    nickname: data.nickname ?? userStore.nickname,
    avatar: data.avatarUrl ?? userStore.avatar
  })
}

async function loadBeanBalance() {
  const data = await fetchBeanAccount()
  beanStore.setBalance(data.balance)
}

async function loadMoodProfile() {
  const data = await fetchMoodProfile()
  userStore.setMoodTags(normalizeMoodTags(data.moodTags))
  moodUpdateHint.value = shouldPromptMoodUpdate(data.lastUpdatedAt)
    ? `心情已超过${MOOD_REFRESH_DAYS}天，去更新`
    : ''
}

async function loadRoutes() {
  const data = await request<{
    list: Array<{ id: number; title?: string; subtitle?: string; cover?: string; goneCount?: number; sceneType?: string }>
  }>('/api/v1/routes', {
    method: 'GET'
  })
  routeStore.setRecommendCards(buildPersonalizedRecommendCards(data.list || [], userStore.moodTags, '', '上海 · ☀️ 22℃'))
}
</script>

<style src="./explore.scss" lang="scss" scoped></style>
