<template>
  <view class="ptc-page spot-detail">
    <view v-if="loading" class="state hint">加载中...</view>
    <view v-else-if="errorText" class="state hint err">{{ errorText }}</view>
    <view v-else-if="spot" class="body">
      <view class="hero-card">
        <view class="cover" />
        <text class="spot-title">{{ spot.name || '未命名景点' }}</text>
        <text class="spot-line">坐标：{{ formatCoord(spot.lat) }}, {{ formatCoord(spot.lng) }}</text>
        <text v-if="spot.address" class="spot-line address-link" @tap="openMapNavigation">地址：{{ spot.address }}</text>
        <text v-if="weatherText" class="spot-line">{{ weatherText }}</text>
        <text v-if="crowdText" class="spot-line">{{ crowdText }}</text>
      </view>

      <view v-if="detailLines.length" class="panel">
        <text class="section-title">基础信息</text>
        <text v-for="(line, i) in detailLines" :key="i" class="detail-line">{{ line }}</text>
      </view>

      <view class="panel">
        <text class="section-title">打卡与分享</text>
        <text class="hint">到达景点 {{ gpsRadius }} 米内可发布打卡，首次打卡奖励 {{ checkinReward }} 豆子。</text>
        <view class="button-row">
          <button class="primary-btn" @tap="goCheckin">📍 打卡拍照</button>
          <button class="ghost-btn" @tap="goShare">分享</button>
        </view>
      </view>

      <view class="panel">
        <view class="section-head">
          <text class="section-title">同好评论</text>
          <text class="link" @tap="goAllComments">全部</text>
        </view>
        <view v-if="topComments.length" class="comment-list">
          <view v-for="item in topComments" :key="String(item.id)" class="comment-card">
            <view class="comment-head">
              <text class="rating">{{ starText(item.rating) }}</text>
              <text class="like" @tap="likeComment(item)">点赞 {{ item.like_count }}</text>
            </view>
            <text class="comment-text">{{ item.content }}</text>
          </view>
        </view>
        <text v-else class="hint">还没有评论，写下第一条现场信息。</text>

        <view class="comment-form">
          <view class="rating-row">
            <text
              v-for="value in [1, 2, 3, 4, 5]"
              :key="value"
              class="star"
              :class="{ active: value <= rating }"
              @tap="rating = value"
            >
              ★
            </text>
          </view>
          <textarea
            v-model="commentContent"
            class="textarea"
            maxlength="200"
            placeholder="比如: 进门左转第三个窗户光线最好，适合拍逆光..."
          />
          <button class="primary-btn" :disabled="commenting" @tap="publishComment">
            {{ commenting ? '发布中...' : '发布评论' }}
          </button>
        </view>
      </view>

      <view class="fav-btn tap-primary" @tap="onFavorite">收藏景点</view>
    </view>
    <view v-else class="state hint">暂无数据</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { favoriteSpot } from '@/api'
import { request } from '@/utils/request'
import { errorMessage, toastError, toastSuccess } from '@/utils/feedback'
import { BEAN_RULE } from '@/utils/bean-rule'
import { GPS_RADIUS_METER } from '@/utils/gps-validate'
import { ensureSession } from '@/utils/session'

interface SpotDetailRes {
  id?: number | string
  name?: string
  lat?: number | string
  lng?: number | string
  detail_json?: Record<string, unknown> | string | null
  address?: string
  created_at?: string
  weather?: { condition?: string; temp?: number }
  crowdLevel?: string
}

interface SpotComment {
  id: number | string
  rating: number
  content: string
  images_json?: string[] | string | null
  like_count: number
  created_at: string
}

const loading = ref(true)
const errorText = ref('')
const spot = ref<SpotDetailRes | null>(null)
const spotIdRef = ref('')
const comments = ref<SpotComment[]>([])
const rating = ref(5)
const commentContent = ref('')
const commenting = ref(false)

// 模板文案里的业务数字，避免和规则常量各写一份
const gpsRadius = GPS_RADIUS_METER
const checkinReward = BEAN_RULE.checkinReward

const weatherText = computed(() => {
  const w = spot.value?.weather
  if (!w) return ''
  return `天气：${w.condition ?? '-'} · ${w.temp ?? '-'}℃`
})

const crowdText = computed(() => {
  const c = spot.value?.crowdLevel
  return c ? `拥挤度：${c}` : ''
})

const detailLines = computed(() => {
  const raw = spot.value?.detail_json
  if (raw == null || raw === '') return []
  if (typeof raw === 'string') {
    try {
      const o = JSON.parse(raw) as Record<string, unknown>
      return flattenDetail(o)
    } catch {
      return [raw]
    }
  }
  if (typeof raw === 'object') return flattenDetail(raw as Record<string, unknown>)
  return []
})

const topComments = computed(() => comments.value.slice(0, 3))

onLoad(async (options) => {
  const spotId = String(options?.spotId ?? options?.id ?? '')
  spotIdRef.value = spotId
  if (!spotId) {
    loading.value = false
    errorText.value = '缺少景点 ID'
    return
  }
  await loadSpot(spotId)
})


async function loadSpot(spotId: string) {
  loading.value = true
  errorText.value = ''
  spot.value = null
  try {
    await ensureSession()
    const [detail] = await Promise.all([
      request<SpotDetailRes>(`/api/v1/spots/${spotId}`, { method: 'GET' }),
      loadComments(spotId)
    ])
    if (!detail || (detail.name === undefined && detail.id === undefined)) {
      errorText.value = '暂无景点数据'
      return
    }
    spot.value = detail
  } catch (e) {
    errorText.value = errorMessage(e, '加载失败')
    uni.showToast({ title: errorText.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function loadComments(spotId: string) {
  const data = await request<{ list: SpotComment[] }>(`/api/v1/spots/${spotId}/comments`, {
    method: 'GET'
  })
  comments.value = data.list || []
}

function flattenDetail(obj: Record<string, unknown>, prefix = ''): string[] {
  const lines: string[] = []
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      lines.push(...flattenDetail(v as Record<string, unknown>, key))
    } else {
      lines.push(`${key}：${String(v)}`)
    }
  }
  return lines
}

function formatCoord(v: number | string | undefined) {
  if (v === undefined || v === '') return '-'
  return String(v)
}

async function onFavorite() {
  const id = spotIdRef.value
  if (!id) return
  try {
    await ensureSession()
    await favoriteSpot(id)
    toastSuccess('收藏成功')
  } catch (e) {
    uni.showToast({
      title: errorMessage(e, '收藏失败'),
      icon: 'none'
    })
  }
}

function openMapNavigation() {
  const current = spot.value
  if (!current || current.lat === undefined || current.lng === undefined) return
  uni.openLocation({
    latitude: Number(current.lat),
    longitude: Number(current.lng),
    name: current.name || '景点',
    address: current.address || ''
  })
}

function goCheckin() {
  const current = spot.value
  if (!current || !spotIdRef.value) return
  uni.navigateTo({
    url:
      `/pages/checkin-photo/checkin-photo?spotId=${encodeURIComponent(spotIdRef.value)}` +
      `&spotName=${encodeURIComponent(current.name || '')}` +
      `&lat=${encodeURIComponent(String(current.lat || ''))}` +
      `&lng=${encodeURIComponent(String(current.lng || ''))}`
  })
}

function goShare() {
  const current = spot.value
  if (!current || !spotIdRef.value) return
  uni.navigateTo({
    url:
      `/pages/share-generate/share-generate?type=spot&spotId=${encodeURIComponent(spotIdRef.value)}` +
      `&title=${encodeURIComponent(current.name || '景点分享')}`
  })
}

function goAllComments() {
  const current = spot.value
  if (!current || !spotIdRef.value) return
  uni.navigateTo({
    url:
      `/pages/comments-all/comments-all?spotId=${encodeURIComponent(spotIdRef.value)}` +
      `&spotName=${encodeURIComponent(current.name || '')}`
  })
}

async function publishComment() {
  const content = commentContent.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  commenting.value = true
  try {
    await ensureSession()
    const result = await request<{ rewardBeans: number; rewardGranted: boolean }>(
      `/api/v1/spots/${spotIdRef.value}/comments`,
      {
        method: 'POST',
        data: { rating: rating.value, content, images: [] }
      }
    )
    toastSuccess(result.rewardGranted ? `评论成功 +${result.rewardBeans}豆` : '今日已评论')
    commentContent.value = ''
    await loadComments(spotIdRef.value)
  } catch (e) {
    toastError(e, '评论失败')
  } finally {
    commenting.value = false
  }
}

async function likeComment(item: SpotComment) {
  try {
    await ensureSession()
    const result = await request<{ likeCount: number }>(
      `/api/v1/spots/${spotIdRef.value}/comments/${item.id}/like`,
      { method: 'POST', data: {} }
    )
    item.like_count = result.likeCount
  } catch (e) {
    toastError(e, '点赞失败')
  }
}

function starText(value: number) {
  const count = Math.max(1, Math.min(5, Math.round(Number(value) || 1)))
  return '★★★★★'.slice(0, count)
}
</script>

<style scoped lang="scss">
.spot-detail {
  gap: 24rpx;
  padding: 24rpx 24rpx 96rpx;
  background: #f6f8fb;
}
.state {
  margin-top: 24rpx;
}
.hint {
  color: #6b7280;
  font-size: 26rpx;
}
.hint.err {
  color: #c0392b;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.hero-card,
.panel {
  border-radius: 28rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 10rpx 28rpx rgba(30, 41, 59, 0.06);
}
.cover {
  height: 280rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #cce9ff 0%, #fff3cf 52%, #d7f8df 100%);
}
.spot-title {
  margin-top: 22rpx;
  font-size: 40rpx;
  font-weight: 800;
  display: block;
}
.spot-line {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #555;
  display: block;
}
.address-link {
  color: #2d8cf0;
  text-decoration: underline;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  display: block;
}
.section-head,
.comment-head,
.button-row,
.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.detail-line {
  font-size: 26rpx;
  color: #666;
  display: block;
  margin-top: 8rpx;
  word-break: break-all;
}
.button-row {
  margin-top: 20rpx;
}
.primary-btn,
.ghost-btn {
  flex: 1;
  margin: 0;
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
  border: 2rpx solid #e5e7eb;
}
.link,
.like {
  border-radius: 999rpx;
  padding: 8rpx 16rpx;
  background: #fff3e3;
  color: #a24b00;
  font-size: 24rpx;
}
.comment-list {
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.comment-card {
  border-radius: 20rpx;
  background: #f8fafc;
  padding: 20rpx;
}
.rating,
.star {
  color: #ff9f1a;
  font-size: 28rpx;
}
.comment-text {
  margin-top: 10rpx;
  display: block;
  color: #1f2937;
  font-size: 26rpx;
  line-height: 1.5;
}
.comment-form {
  margin-top: 22rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.rating-row {
  justify-content: flex-start;
}
.star {
  color: #d1d5db;
  font-size: 42rpx;
}
.star.active {
  color: #ff9f1a;
}
.textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 170rpx;
  border-radius: 20rpx;
  background: #f8fafc;
  padding: 20rpx;
  color: #1f2937;
  font-size: 28rpx;
}
.fav-btn {
  padding: 22rpx 0;
  border-radius: 999rpx;
  background: #07c160;
  color: #fff;
  font-size: 30rpx;
  text-align: center;
}
</style>
