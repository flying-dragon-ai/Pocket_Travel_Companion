<template>
  <view class="ptc-page message-page">
    <text class="ptc-title">互动消息</text>
    <text class="hint">展示打卡、评论和分享相关提醒。</text>

    <view v-for="item in messages" :key="item.id" class="message-card" :class="{ unread: item.unread }">
      <view class="message-head">
        <text class="message-title">{{ item.title }}</text>
        <text v-if="item.unread" class="badge">未读</text>
      </view>
      <text class="message-body">{{ item.body }}</text>
      <text class="message-time">{{ item.time }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
const messages = [
  {
    id: 1,
    title: '豆子到账',
    body: '你今天完成了情绪更新，已获得5豆子。',
    time: '今天 09:20',
    unread: true
  },
  {
    id: 2,
    title: '评论有新点赞',
    body: '你在「林间步道」的评论被同频用户点赞。',
    time: '昨天 20:14',
    unread: true
  },
  {
    id: 3,
    title: '路线分享可查看',
    body: '分享图已生成，好友扫码后可进入对应路线或景点。',
    time: '周三 16:08',
    unread: false
  }
]
</script>

<style scoped lang="scss">
.message-page {
  gap: 22rpx;
  padding: 34rpx 24rpx;
  background: #f6f8fb;
}
.hint,
.message-body,
.message-time {
  color: #6b7280;
  font-size: 24rpx;
  display: block;
}
.message-card {
  border-radius: 28rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(30, 41, 59, 0.06);
}
.message-card.unread {
  border: 2rpx solid #ffb861;
}
.message-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.message-title {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 700;
}
.badge {
  border-radius: 999rpx;
  padding: 6rpx 14rpx;
  background: #ff5252;
  color: #fff;
  font-size: 22rpx;
}
.message-body {
  margin-top: 12rpx;
  color: #374151;
}
.message-time {
  margin-top: 14rpx;
}
</style>
