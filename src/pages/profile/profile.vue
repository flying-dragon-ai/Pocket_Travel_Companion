<template>
  <view class="ptc-page profile-page">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorText" class="hint err">{{ errorText }}</view>
    <view v-else class="profile-body">
      <view class="card user-card">
        <image
          class="avatar"
          :src="userStore.avatar || defaultAvatar"
          mode="aspectFill"
        />
        <view class="user-meta">
          <text class="nickname">{{ userStore.nickname || '旅行搭子' }}</text>
          <text class="openid">OpenID: {{ userStore.openid || '-' }}</text>
        </view>
      </view>

      <view class="card stats-card">
        <view class="stat-item">
          <text class="stat-label">豆子余额</text>
          <text class="stat-value">🫘 {{ beanStore.balance }}</text>
          <view class="bean-progress"><view class="bean-progress-fill" :style="{ width: beanProgress }" /></view>
        </view>
        <view class="stat-item">
          <text class="stat-label">当前心情</text>
          <text class="stat-value">😌 {{ userStore.primaryMoodText }}</text>
          <view class="tag-cloud">
            <text v-for="tag in userStore.moodTags" :key="tag">{{ tag }}</text>
          </view>
        </view>
      </view>

      <view class="card action-card">
        <view class="action-head">
          <text class="action-title">核心功能</text>
          <text class="setting" @tap="goMoodQa">⚙</text>
        </view>
        <view class="grid">
          <view class="grid-item" @tap="goMoodQa">情绪管理</view>
          <view class="grid-item" @tap="goTagSetting">兴趣标签</view>
          <view class="grid-item with-dot" @tap="goMessage">互动消息</view>
          <view class="grid-item" @tap="goBeanLog">豆子明细</view>
        </view>
      </view>

      <view class="card footprint-card">
        <text class="action-title">我的足迹</text>
        <view class="footprint-grid">
          <view class="footprint route">周末疗愈路线</view>
          <view class="footprint photo">林间步道打卡</view>
          <view class="footprint photo">猫咖书店</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { useBeanStore } from '@/store/bean'
import { useUserStore } from '@/store/user'
import { fetchBeanAccount, fetchMoodProfile, fetchUserProfile } from '@/api'
import { BEAN_RULE } from '@/utils/bean-rule'
import { errorMessage } from '@/utils/feedback'
import { normalizeMoodTags } from '@/utils/mood-map'
import { ensureSession } from '@/utils/session'

const userStore = useUserStore()
const beanStore = useBeanStore()
const loading = ref(true)
const errorText = ref('')
const defaultAvatar = 'https://picsum.photos/120/120?profile=avatar'
const beanProgress = computed(
  () => `${Math.min(100, Math.round((beanStore.balance / BEAN_RULE.maxBalance) * 100))}%`
)

onShow(async () => {
  await loadProfilePage()
})

async function loadProfilePage() {
  loading.value = true
  errorText.value = ''
  try {
    // 与探索页一致：进入页面先确保鉴权状态有效
    await ensureSession()
    await Promise.all([loadUserProfile(), loadBeanBalance(), loadMoodProfile()])
  } catch (error) {
    errorText.value = errorMessage(error, '加载失败')
    uni.showToast({ title: errorText.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadUserProfile() {
  const data = await fetchUserProfile()
  userStore.setProfile({
    openid: data.openid ?? userStore.openid,
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
}

function goBeanLog() {
  uni.navigateTo({ url: '/pages/bean-log/bean-log' })
}

function goTagSetting() {
  uni.navigateTo({ url: '/pages/tag-setting/tag-setting' })
}

function goMoodQa() {
  uni.navigateTo({ url: '/pages/mood-qa/mood-qa' })
}

function goMessage() {
  uni.navigateTo({ url: '/pages/message/message' })
}
</script>

<style scoped lang="scss">
.profile-page {
  padding: 24rpx;
}
.hint {
  color: #888;
  font-size: 28rpx;
}
.hint.err {
  color: #c0392b;
}
.profile-body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.card {
  border-radius: 20rpx;
  background: #fff;
  padding: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
}
.user-card {
  display: flex;
  align-items: center;
}
.avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #f5f5f5;
}
.user-meta {
  margin-left: 20rpx;
  min-width: 0;
}
.nickname {
  font-size: 32rpx;
  font-weight: 600;
  display: block;
}
.openid {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #888;
  display: block;
  word-break: break-all;
}
.stats-card {
  display: flex;
  justify-content: space-between;
}
.stat-item {
  min-width: 0;
}
.stat-label {
  font-size: 24rpx;
  color: #888;
  display: block;
}
.stat-value {
  margin-top: 8rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}
.action-title {
  font-size: 28rpx;
  font-weight: 600;
  display: block;
}
.action-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.setting {
  color: #666;
  font-size: 32rpx;
}
.action-link {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #2d8cf0;
}
.bean-progress {
  width: 220rpx;
  height: 12rpx;
  margin-top: 14rpx;
  border-radius: 999rpx;
  background: #f0e7d8;
  overflow: hidden;
}
.bean-progress-fill {
  height: 100%;
  background: #ff7d00;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}
.tag-cloud text {
  border-radius: 999rpx;
  padding: 6rpx 12rpx;
  background: #e8f5e9;
  color: #237a2e;
  font-size: 22rpx;
}
.grid,
.footprint-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 20rpx;
}
.grid-item,
.footprint {
  border-radius: 18rpx;
  background: #f7f8fa;
  padding: 24rpx 16rpx;
  color: #333;
  font-size: 26rpx;
  text-align: center;
  position: relative;
}
.with-dot::after {
  content: '';
  position: absolute;
  top: 12rpx;
  right: 20rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #ff5252;
}
.footprint.route {
  background: #fff3e0;
}
.footprint.photo {
  background: #e3f2fd;
}
</style>
