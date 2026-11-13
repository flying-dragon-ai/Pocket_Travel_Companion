<template>
  <view class="ptc-page loading-page">
    <view class="buddy-wrap">
      <view class="buddy-shadow" />
      <view class="buddy">🐾</view>
    </view>
    <text class="title">你的旅行搭子正在向你走来...</text>
    <text class="hint">正在进入路径页</text>
  </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
  setTimeout(() => {
    uni.switchTab({ url: '/pages/path/path' })
  }, 1500)
})
</script>

<style scoped lang="scss">
.loading-page {
  align-items: center;
  justify-content: center;
  gap: 28rpx;
  min-height: 100vh;
  background: linear-gradient(180deg, #fff4d7 0%, #f1fff4 100%);
}
.buddy-wrap {
  position: relative;
  width: 260rpx;
  height: 260rpx;
}
.buddy {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background: #ffdf9d;
  text-align: center;
  line-height: 240rpx;
  font-size: 96rpx;
  animation: buddy-hop 1.5s ease-in-out infinite;
  box-shadow: 0 20rpx 45rpx rgba(126, 93, 44, 0.18);
}
.buddy-shadow {
  position: absolute;
  left: 48rpx;
  bottom: 8rpx;
  width: 150rpx;
  height: 28rpx;
  border-radius: 50%;
  background: rgba(74, 55, 33, 0.18);
  animation: buddy-shadow 1.5s ease-in-out infinite;
}
.title {
  color: #2b2118;
  font-size: 34rpx;
  font-weight: 700;
}
.hint {
  color: #6d6a5f;
  font-size: 24rpx;
}
@keyframes buddy-hop {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-42rpx) scale(1.04);
  }
}
@keyframes buddy-shadow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.22;
  }
  50% {
    transform: scale(0.72);
    opacity: 0.12;
  }
}
</style>
