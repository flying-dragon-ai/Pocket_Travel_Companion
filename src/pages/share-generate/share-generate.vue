<template>
  <view class="ptc-page share-page">
    <view class="poster">
      <text class="poster-tag">{{ typeLabel }}</text>
      <text class="poster-title">{{ title }}</text>
      <text class="poster-sub">口袋旅行搭子为你生成的周末微旅行灵感</text>
      <view class="buddy">🐾</view>
      <view class="code-box">
        <text>小程序码</text>
        <text class="code">{{ shareCode || '生成后显示' }}</text>
      </view>
    </view>

    <view class="actions">
      <button class="primary-btn" :disabled="loading" @tap="generatePoster">
        {{ loading ? '生成中...' : '生成分享图' }}
      </button>
      <button class="ghost-btn" @tap="savePoster">保存到相册</button>
      <button class="ghost-btn" @tap="sharePoster">分享到微信</button>
    </view>

    <text v-if="posterUrl" class="hint" selectable>{{ posterUrl }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createRoutePoster, createRouteShare, createSpotPoster } from '@/api'
import { toastError, toastSuccess } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

const type = ref('route')
const title = ref('情绪疗愈路线')
const targetId = ref('1')
const loading = ref(false)
const posterUrl = ref('')
const shareCode = ref('')

const typeLabel = computed(() => (type.value.includes('spot') ? '景点分享' : '路线分享'))

onLoad((options) => {
  type.value = String(options?.type || 'route')
  title.value = String(options?.title || title.value)
  targetId.value = String(options?.targetId || options?.routeId || options?.spotId || '1')
})


async function generatePoster() {
  loading.value = true
  try {
    await ensureSession()
    if (type.value.includes('spot')) {
      const data = await createSpotPoster(Number(targetId.value))
      posterUrl.value = data.posterUrl
      shareCode.value = data.shareCode || ''
    } else if (type.value === 'route') {
      const [share, poster] = await Promise.all([
        createRouteShare(Number(targetId.value)),
        createRoutePoster(Number(targetId.value))
      ])
      shareCode.value = share.shareCode || poster.shareCode || ''
      posterUrl.value = poster.posterUrl
    } else {
      shareCode.value = `preview-${targetId.value}`
      posterUrl.value = 'preview://local-poster'
    }
    toastSuccess('分享图已生成')
  } catch (e) {
    toastError(e, '生成失败')
  } finally {
    loading.value = false
  }
}

function savePoster() {
  if (!posterUrl.value) {
    uni.showToast({ title: '请先生成分享图', icon: 'none' })
    return
  }
  toastSuccess('已准备保存')
}

function sharePoster() {
  if (!posterUrl.value && !shareCode.value) {
    uni.showToast({ title: '请先生成分享图', icon: 'none' })
    return
  }
  toastSuccess('已准备分享')
}
</script>

<style scoped lang="scss">
.share-page {
  align-items: center;
  gap: 28rpx;
  padding: 40rpx 24rpx;
  background: linear-gradient(180deg, #ffe8c7 0%, #fffaf2 100%);
}
.poster {
  width: 620rpx;
  min-height: 820rpx;
  box-sizing: border-box;
  border-radius: 42rpx;
  background: radial-gradient(circle at 20% 0%, #fff5ca 0%, #fff 42%, #f1fff3 100%);
  padding: 42rpx;
  box-shadow: 0 20rpx 50rpx rgba(112, 83, 45, 0.18);
}
.poster-tag {
  display: inline-block;
  border-radius: 999rpx;
  padding: 10rpx 20rpx;
  background: #2b2118;
  color: #fff;
  font-size: 24rpx;
}
.poster-title {
  display: block;
  margin-top: 34rpx;
  color: #2b2118;
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.25;
}
.poster-sub {
  display: block;
  margin-top: 18rpx;
  color: #6b5c4f;
  font-size: 28rpx;
}
.buddy {
  margin: 80rpx auto;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: #ffdf9d;
  text-align: center;
  line-height: 220rpx;
  font-size: 90rpx;
}
.code-box {
  border-radius: 28rpx;
  background: #fff;
  padding: 28rpx;
  color: #2b2118;
  font-size: 26rpx;
}
.code {
  display: block;
  margin-top: 10rpx;
  color: #ff7d00;
  word-break: break-all;
}
.actions {
  width: 100%;
  display: flex;
  gap: 18rpx;
}
.primary-btn,
.ghost-btn {
  flex: 1;
  border-radius: 999rpx;
  font-size: 28rpx;
}
.primary-btn {
  background: #ff7d00;
  color: #fff;
}
.ghost-btn {
  background: #fff;
  color: #2b2118;
}
.hint {
  color: #6b5c4f;
  font-size: 24rpx;
}
</style>
