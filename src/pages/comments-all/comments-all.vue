<template>
  <view class="ptc-page comments-page">
    <view class="header">
      <text class="ptc-title">全部评论</text>
      <text class="hint">{{ spotName || '按点赞和发布时间排序' }}</text>
    </view>

    <view v-if="loading" class="hint">加载中...</view>
    <view v-else-if="errorText" class="hint err">{{ errorText }}</view>
    <view v-else-if="!comments.length" class="empty">还没有评论，发布第一条现场干货。</view>
    <view v-else class="comment-list">
      <view v-for="item in comments" :key="String(item.id)" class="comment-card">
        <view class="comment-head">
          <text class="rating">{{ starText(item.rating) }}</text>
          <text class="date">{{ formatDate(item.created_at) }}</text>
        </view>
        <text class="content">{{ item.content }}</text>
        <view v-if="imageList(item).length" class="image-grid">
          <image v-for="image in imageList(item)" :key="image" class="comment-image" :src="image" mode="aspectFill" />
        </view>
        <view class="comment-foot">
          <text class="like" @tap="likeComment(item)">点赞 {{ item.like_count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { errorMessage, toastError } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface SpotComment {
  id: number | string
  rating: number
  content: string
  images_json?: string[] | string | null
  like_count: number
  created_at: string
}

const spotId = ref('')
const spotName = ref('')
const comments = ref<SpotComment[]>([])
const loading = ref(false)
const errorText = ref('')

onLoad((options) => {
  spotId.value = String(options?.spotId || '')
  spotName.value = String(options?.spotName || '')
})

onShow(() => {
  if (spotId.value) {
    loadComments()
  }
})


async function loadComments() {
  loading.value = true
  errorText.value = ''
  try {
    await ensureSession()
    const data = await request<{ list: SpotComment[] }>(`/api/v1/spots/${spotId.value}/comments`, {
      method: 'GET'
    })
    comments.value = data.list || []
  } catch (e) {
    errorText.value = errorMessage(e, '评论加载失败')
  } finally {
    loading.value = false
  }
}

async function likeComment(item: SpotComment) {
  try {
    await ensureSession()
    const result = await request<{ likeCount: number }>(
      `/api/v1/spots/${spotId.value}/comments/${item.id}/like`,
      { method: 'POST', data: {} }
    )
    item.like_count = result.likeCount
  } catch (e) {
    toastError(e, '点赞失败')
  }
}

function imageList(item: SpotComment) {
  const raw = item.images_json
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function starText(rating: number) {
  const count = Math.max(1, Math.min(5, Math.round(Number(rating) || 1)))
  return '★★★★★'.slice(0, count)
}

function formatDate(value: string) {
  if (!value) return ''
  return value.slice(0, 16).replace('T', ' ')
}
</script>

<style scoped lang="scss">
.comments-page {
  gap: 22rpx;
  padding: 34rpx 24rpx 80rpx;
  background: #f6f8fb;
}
.header,
.comment-card {
  border-radius: 28rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 10rpx 28rpx rgba(30, 41, 59, 0.06);
}
.hint,
.empty,
.date {
  color: #6b7280;
  font-size: 24rpx;
}
.err {
  color: #c0392b;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.comment-head,
.comment-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.rating {
  color: #ff9f1a;
  font-size: 26rpx;
}
.content {
  margin-top: 14rpx;
  display: block;
  color: #1f2937;
  font-size: 28rpx;
  line-height: 1.5;
}
.image-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}
.comment-image {
  width: 100%;
  height: 150rpx;
  border-radius: 16rpx;
  background: #edf2f7;
}
.like {
  margin-top: 16rpx;
  border-radius: 999rpx;
  padding: 10rpx 18rpx;
  background: #fff3e3;
  color: #a24b00;
  font-size: 24rpx;
}
</style>
