<template>
  <view class="ptc-page preview-page">
    <view class="topbar">
      <text class="ptc-title">路线预览</text>
      <text class="share" @tap="generateShare">分享</text>
    </view>

    <image class="cover" :src="preview.cover" mode="aspectFill" />
    <view class="card">
      <text class="scene-tag">#{{ preview.sceneTag }}</text>
      <text class="title">{{ preview.title }}</text>
      <text class="subtitle">{{ preview.subtitle }}</text>
      <text class="hint">预览不会创建个人路线，也不会扣豆。</text>
    </view>

    <view class="timeline">
      <text class="section-title">行程安排</text>
      <view v-for="(spot, index) in preview.spots" :key="spot.name" class="step">
        <text class="step-no">{{ index + 1 }}</text>
        <view class="step-body">
          <text class="spot-name">{{ spot.name }}</text>
          <text class="spot-meta">{{ spot.duration }} · {{ spot.tag }}</text>
          <text class="spot-desc">{{ spot.desc }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <text class="cost">消耗40豆子生成我的路线</text>
      <button class="primary-btn" :disabled="adopting" @tap="adoptPreview">
        {{ adopting ? '生成中...' : '🎲 采纳灵感' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useBeanStore } from '@/store/bean'
import { generateRoute } from '@/api'
import { BEAN_RULE } from '@/utils/bean-rule'
import { guardBeanCost } from '@/utils/bean-guard'
import { toastError, toastSuccess } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface PreviewSpot {
  name: string
  duration: string
  tag: string
  desc: string
}

const beanStore = useBeanStore()
const adopting = ref(false)
const preview = ref({
  recommendId: '',
  title: '把自己还给自己',
  subtitle: '林间散步 → 素斋馆 → 猫咖书店',
  cover: 'https://picsum.photos/720/420?preview=healing',
  sceneTag: '沉浸式疗愈',
  spots: [
    { name: '林间步道', duration: '60分钟', tag: '安静治愈', desc: '先把手机调成勿扰，沿河边慢走。' },
    { name: '素斋小馆', duration: '75分钟', tag: '轻食', desc: '点一份热汤，路线中段补充体力。' },
    { name: '猫咖书店', duration: '90分钟', tag: '白噪音陪伴', desc: '适合独处、阅读和写下今天的心情。' }
  ] as PreviewSpot[]
})

onLoad((options) => {
  preview.value = {
    ...preview.value,
    recommendId: String(options?.recommendId || ''),
    title: String(options?.title || preview.value.title),
    subtitle: String(options?.subtitle || preview.value.subtitle),
    cover: String(options?.cover || preview.value.cover)
  }
})

async function adoptPreview() {
  if (!guardBeanCost(beanStore.balance, BEAN_RULE.routeGenerationCost, '采纳灵感')) return
  adopting.value = true
  try {
    await ensureSession()
    const result = await generateRoute({
      city: '上海',
      dayMode: 'one_day',
      spotPreferences: preview.value.spots.map((item) => item.tag),
      moodTags: [preview.value.sceneTag],
      previewId: preview.value.recommendId
    })
    beanStore.setBalance(result.remainingBeans)
    toastSuccess('已生成路线')
    uni.navigateTo({ url: `/pages/route-detail/route-detail?routeId=${result.routeId}` })
  } catch (e) {
    toastError(e, '采纳失败')
  } finally {
    adopting.value = false
  }
}

function generateShare() {
  uni.navigateTo({
    url:
      `/pages/share-generate/share-generate?type=route-preview` +
      `&title=${encodeURIComponent(preview.value.title)}` +
      `&targetId=${encodeURIComponent(preview.value.recommendId || 'preview')}`
  })
}
</script>

<style scoped lang="scss">
.preview-page {
  padding: 30rpx 24rpx 170rpx;
  gap: 24rpx;
  background: #f6f2ea;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.share {
  border-radius: 999rpx;
  padding: 10rpx 20rpx;
  background: #2b2118;
  color: #fff;
  font-size: 24rpx;
}
.cover {
  height: 360rpx;
  width: 100%;
  border-radius: 36rpx;
  background: #ddd;
}
.card,
.timeline {
  border-radius: 30rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 10rpx 28rpx rgba(43, 33, 24, 0.08);
}
.scene-tag,
.hint,
.spot-meta,
.spot-desc,
.cost {
  color: #74685f;
  font-size: 24rpx;
  display: block;
}
.title {
  display: block;
  margin-top: 10rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: #2b2118;
}
.subtitle {
  display: block;
  margin: 12rpx 0;
  color: #51473f;
  font-size: 28rpx;
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  margin-bottom: 18rpx;
}
.step {
  display: flex;
  gap: 18rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0ece6;
}
.step-no {
  width: 46rpx;
  height: 46rpx;
  border-radius: 50%;
  background: #ff7d00;
  color: #fff;
  text-align: center;
  line-height: 46rpx;
  font-size: 24rpx;
}
.step-body {
  flex: 1;
}
.spot-name {
  display: block;
  color: #2b2118;
  font-size: 30rpx;
  font-weight: 700;
}
.spot-desc {
  margin-top: 8rpx;
  color: #51473f;
}
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 24rpx 40rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8rpx 28rpx rgba(0, 0, 0, 0.08);
}
.cost {
  flex: 1;
}
.primary-btn {
  margin: 0;
  border-radius: 999rpx;
  background: #ff7d00;
  color: #fff;
  font-size: 28rpx;
}
</style>
