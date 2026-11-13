<template>
  <view class="ptc-page route-detail">
    <view v-if="loading" class="hint">加载中…</view>
    <view v-else-if="errorText" class="hint err">{{ errorText }}</view>
    <view v-else-if="detail" class="body">
      <view class="detail-head">
        <view>
          <text class="route-title">{{ detail.title || '未命名路线' }}</text>
          <text class="route-sub">{{ detail.subtitle || '' }}</text>
        </view>
        <text class="share-btn" @tap="goShare">分享</text>
      </view>
      <view class="map-card">
        <text class="map-title">{{ detail.detail?.city || '上海' }} · 路线总览</text>
        <text class="map-sub">🔴 热门商圈  🟢 安静治愈  💛 拍照出片</text>
      </view>
      <text v-if="metaLine" class="route-meta">{{ metaLine }}</text>
      <view v-if="moodLine" class="tag-row">
        <text class="route-meta">{{ moodLine }}</text>
        <text class="filter-pill" @tap="moodOnly = !moodOnly">{{ moodOnly ? '查看全部景点' : '只看适合我心情的景点' }}</text>
      </view>
      <view v-if="spotList.length" class="spots">
        <text class="section-title">途经点</text>
        <view
          v-for="(s, i) in spotList"
          :key="s.spotId ?? i"
          class="spot-row"
          @tap="goSpotDetail(s)"
        >
          <view class="spot-index">{{ i + 1 }}</view>
          <view class="spot-content">
            <text class="spot-name">{{ s.name || '景点' }}</text>
            <text class="spot-meta">{{ spotMetaLine(s) }}</text>
            <text class="spot-desc">{{ s.suggestion || '按当前心情推荐，适合停留和拍照。' }}</text>
            <text v-if="i < spotList.length - 1" class="connection">
              {{ s.connection || '1.6公里 · 27分钟' }}
            </text>
          </view>
        </view>
        <view v-if="recommendedSpots.length" class="recommend-more">
          <text class="section-title">推荐地点</text>
          <view v-for="s in recommendedSpots" :key="String(s.spotId || s.name)" class="recommend-row">
            <text class="spot-name">{{ s.name || '推荐地点' }}</text>
            <text class="hint">{{ s.suggestion || s.tag || '可按时间灵活增删。' }}</text>
          </view>
        </view>
        <view v-else class="recommend-more">
          <text class="section-title">推荐地点</text>
          <text class="hint">附近还有咖啡、书店和展览空间，可按时间灵活增删。</text>
        </view>
      </view>
      <text v-else class="hint">暂无结构化途经点</text>
    </view>
    <view v-else class="hint">暂无数据</view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { errorMessage } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface RouteSpotItem {
  spotId?: number
  name?: string
  duration?: string
  tag?: string
  suggestion?: string
  connection?: string
}

interface RouteDetailPayload {
  city?: string
  spots?: RouteSpotItem[]
  connections?: Array<{ distanceMeter?: number; durationMinute?: number }>
  recommendedSpots?: RouteSpotItem[]
  moodTags?: string[]
  moodWeightApplied?: boolean
  ragUsed?: boolean
}

/** GET /api/v1/routes/:routeId 实际返回 id 等可能为 string（PG 大整型） */
interface RouteDetailRes {
  id?: number | string
  title?: string
  subtitle?: string
  source_type?: string
  created_at?: string
  detail?: RouteDetailPayload
}

const loading = ref(true)
const errorText = ref('')
const detail = ref<RouteDetailRes | null>(null)
const moodOnly = ref(false)

const spotList = computed(() => {
  const spots = detail.value?.detail?.spots || []
  if (!moodOnly.value) return spots
  const moodTags = detail.value?.detail?.moodTags || []
  if (!moodTags.length) return spots
  return spots.filter((spot) => moodTags.some((tag) => `${spot.tag || ''} ${spot.suggestion || ''}`.includes(tag)))
})

const metaLine = computed(() => {
  const d = detail.value
  if (!d) return ''
  const parts: string[] = []
  if (d.source_type) parts.push(`来源：${d.source_type}`)
  if (d.created_at) parts.push(String(d.created_at).slice(0, 10))
  return parts.join(' · ')
})

const recommendedSpots = computed(() => detail.value?.detail?.recommendedSpots || [])

const moodLine = computed(() => {
  const tags = detail.value?.detail?.moodTags
  if (!tags?.length) return ''
  return `情绪权重：${tags.join('、')}`
})

function spotMetaLine(s: RouteSpotItem) {
  const a = s.duration || '-'
  const b = s.tag || '-'
  return `${a} · ${b}`
}

function goSpotDetail(s: RouteSpotItem) {
  const sid = s.spotId
  if (sid === undefined || sid === null) {
    uni.showToast({ title: '该途经点无景点 ID', icon: 'none' })
    return
  }
  uni.navigateTo({
    url: `/pages/spot-detail/spot-detail?spotId=${sid}`
  })
}

function goShare() {
  const routeId = detail.value?.id ?? ''
  uni.navigateTo({
    url:
      `/pages/share-generate/share-generate?type=route&targetId=${encodeURIComponent(String(routeId))}` +
      `&title=${encodeURIComponent(detail.value?.title || '路线分享')}`
  })
}

onLoad(async (options) => {
  const routeId = String(options?.routeId || '')
  if (!routeId) {
    loading.value = false
    errorText.value = '缺少路线 ID'
    return
  }
  await loadRoute(routeId)
})

async function loadRoute(routeId: string) {
  loading.value = true
  errorText.value = ''
  detail.value = null
  try {
    // 与探索页一致：先保证 token，再拉详情，避免 10002
    await ensureSession()
    const data = await request<RouteDetailRes>(`/api/v1/routes/${routeId}`, {
      method: 'GET'
    })
    if (!data || (!data.title && !data.id)) {
      errorText.value = '路线数据为空'
      return
    }
    detail.value = data
  } catch (e) {
    errorText.value = errorMessage(e, '加载失败')
    uni.showToast({ title: errorText.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.route-detail {
  padding: 24rpx;
}
.hint {
  margin-top: 16rpx;
  color: #888;
  font-size: 28rpx;
}
.hint.err {
  color: #c0392b;
}
.body,
.detail-head,
.tag-row {
  margin-top: 24rpx;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}
.share-btn,
.filter-pill {
  border-radius: 999rpx;
  padding: 10rpx 18rpx;
  background: #2b2118;
  color: #fff;
  font-size: 24rpx;
}
.map-card {
  height: 40vh;
  min-height: 320rpx;
  margin-top: 24rpx;
  border-radius: 28rpx;
  padding: 28rpx;
  box-sizing: border-box;
  background: linear-gradient(135deg, #e8f5e9 0%, #fff3e0 100%);
}
.map-title {
  display: block;
  color: #1f3321;
  font-size: 32rpx;
  font-weight: 700;
}
.map-sub {
  display: block;
  margin-top: 14rpx;
  color: #5a6458;
  font-size: 24rpx;
}
.route-title {
  font-size: 36rpx;
  font-weight: 600;
  display: block;
}
.route-sub {
  margin-top: 12rpx;
  font-size: 28rpx;
  color: #666;
  display: block;
}
.route-meta {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
  display: block;
}
.tag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-title {
  margin-top: 32rpx;
  font-size: 30rpx;
  font-weight: 600;
  display: block;
}
.spots {
  margin-top: 16rpx;
}
.spot-row {
  display: flex;
  gap: 18rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}
.spot-index {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #ff7d00;
  color: #fff;
  text-align: center;
  line-height: 44rpx;
  font-size: 24rpx;
}
.spot-content {
  flex: 1;
}
.spot-name {
  font-size: 30rpx;
  display: block;
}
.spot-meta {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #888;
  display: block;
}
.spot-desc,
.connection {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #666;
  display: block;
}
.connection {
  color: #ff7d00;
}
.recommend-more {
  padding: 20rpx 0;
}
.recommend-row {
  margin-top: 14rpx;
  border-radius: 18rpx;
  background: #f8fafc;
  padding: 18rpx;
}
</style>
