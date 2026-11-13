<template>
  <view class="ptc-page checkin-page">
    <view class="header-card">
      <text class="ptc-title">打卡拍照</text>
      <text class="hint">{{ spotName || '到达景点后发布打卡' }}</text>
      <text v-if="distanceText" class="distance">{{ distanceText }}</text>
    </view>

    <view class="panel">
      <text class="section-title">照片</text>
      <view class="photo-grid">
        <image v-for="photo in photos" :key="photo" class="photo" :src="photo" mode="aspectFill" />
        <view v-if="photos.length < 3" class="photo-add" @tap="choosePhotos">+</view>
      </view>
      <text class="hint">最多3张，可拍照或从相册选择。</text>
    </view>

    <view class="panel">
      <text class="section-title">干货标签</text>
      <view class="tag-grid">
        <text
          v-for="tag in dryTagOptions"
          :key="tag"
          class="tag"
          :class="{ selected: dryTags.includes(tag) }"
          @tap="toggleDryTag(tag)"
        >
          {{ tag }}
        </text>
      </view>
    </view>

    <view class="panel">
      <text class="section-title">描述</text>
      <textarea
        v-model="content"
        class="textarea"
        maxlength="200"
        :placeholder="contentPlaceholder"
      />
      <text class="hint">{{ content.length }}/200</text>
    </view>

    <button class="primary-btn" :disabled="publishing" @tap="publishCheckin">
      {{ publishing ? '发布中...' : '发布打卡' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { calculateDistanceMeter, isWithinDistance } from '@/utils/gps-validate'
import { toastError, toastSuccess } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface SpotDetail {
  id?: number | string
  name?: string
  lat?: number | string
  lng?: number | string
}

const spotId = ref('')
const spotName = ref('')
const spotLat = ref<number | null>(null)
const spotLng = ref<number | null>(null)
const photos = ref<string[]>([])
const dryTags = ref<string[]>([])
const content = ref('')
const publishing = ref(false)
const distanceMeter = ref<number | null>(null)

const dryTagOptions = ['最佳机位', '周边觅食', '便民攻略', '避坑指南']

const contentPlaceholder = computed(() => {
  if (dryTags.value.includes('最佳机位')) return '描述一下机位位置、角度或拍摄时间...'
  if (dryTags.value.includes('周边觅食')) return '写下店名、排队情况或推荐菜...'
  if (dryTags.value.includes('便民攻略')) return '记录寄存、洗手间、亲子设施等信息...'
  if (dryTags.value.includes('避坑指南')) return '提醒后来的人哪些地方需要注意...'
  return '写一点对后来者有帮助的现场信息...'
})

const distanceText = computed(() => {
  if (distanceMeter.value === null) return ''
  return `距离景点约 ${Math.round(distanceMeter.value)} 米`
})

onLoad(async (options) => {
  spotId.value = String(options?.spotId || '')
  spotName.value = String(options?.spotName || '')
  spotLat.value = toNumberOrNull(options?.lat)
  spotLng.value = toNumberOrNull(options?.lng)
  if (spotId.value && (spotLat.value === null || spotLng.value === null || !spotName.value)) {
    await loadSpot(spotId.value)
  }
})


async function loadSpot(id: string) {
  try {
    await ensureSession()
    const data = await request<SpotDetail>(`/api/v1/spots/${id}`, { method: 'GET' })
    spotName.value = data.name || spotName.value
    spotLat.value = toNumberOrNull(data.lat)
    spotLng.value = toNumberOrNull(data.lng)
  } catch (e) {
    toastError(e, '景点加载失败')
  }
}

function toNumberOrNull(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function choosePhotos() {
  uni.chooseImage({
    count: 3 - photos.value.length,
    sourceType: ['camera', 'album'],
    success: (res) => {
      photos.value = [...photos.value, ...res.tempFilePaths].slice(0, 3)
    },
    fail: () => {
      uni.showToast({ title: '未选择照片', icon: 'none' })
    }
  })
}

function toggleDryTag(tag: string) {
  dryTags.value = dryTags.value.includes(tag)
    ? dryTags.value.filter((item) => item !== tag)
    : [...dryTags.value, tag]
}

function getLocation() {
  return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
      fail: reject
    })
  })
}

async function publishCheckin() {
  if (!spotId.value) {
    uni.showToast({ title: '缺少景点信息', icon: 'none' })
    return
  }
  if (!photos.value.length) {
    uni.showToast({ title: '请至少选择1张照片', icon: 'none' })
    return
  }
  if (!dryTags.value.length) {
    uni.showToast({ title: '请选择干货标签', icon: 'none' })
    return
  }

  publishing.value = true
  try {
    await ensureSession()
    const location = await getLocation()
    if (spotLat.value !== null && spotLng.value !== null) {
      distanceMeter.value = calculateDistanceMeter(
        location.latitude,
        location.longitude,
        spotLat.value,
        spotLng.value
      )
      if (!isWithinDistance(distanceMeter.value)) {
        uni.showToast({ title: '你离景点还有点远哦,到达后再打卡吧', icon: 'none' })
        return
      }
    }
    const result = await request<{ rewardBeans: number; rewardGranted: boolean }>(
      `/api/v1/spots/${spotId.value}/checkins`,
      {
        method: 'POST',
        data: {
          lat: location.latitude,
          lng: location.longitude,
          photos: photos.value,
          dryTags: dryTags.value,
          content: content.value.trim()
        }
      }
    )
    toastSuccess(result.rewardGranted ? `打卡成功 +${result.rewardBeans}豆` : '今日已打卡')
    uni.navigateTo({
      url:
        `/pages/share-generate/share-generate?type=spot&spotId=${encodeURIComponent(spotId.value)}` +
        `&title=${encodeURIComponent(spotName.value || '景点打卡')}`
    })
  } catch (e) {
    toastError(e, '发布失败')
  } finally {
    publishing.value = false
  }
}
</script>

<style scoped lang="scss">
.checkin-page {
  gap: 24rpx;
  padding: 32rpx 24rpx 80rpx;
  background: #f6f8fb;
}
.header-card,
.panel {
  border-radius: 28rpx;
  background: #fff;
  padding: 28rpx;
  box-shadow: 0 10rpx 28rpx rgba(30, 41, 59, 0.06);
}
.hint,
.distance {
  margin-top: 10rpx;
  display: block;
  color: #6b7280;
  font-size: 24rpx;
}
.distance {
  color: #1b7f3a;
}
.section-title {
  display: block;
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 700;
}
.photo-grid,
.tag-grid {
  margin-top: 20rpx;
  display: grid;
  gap: 16rpx;
}
.photo-grid {
  grid-template-columns: repeat(3, 1fr);
}
.photo,
.photo-add {
  width: 100%;
  height: 180rpx;
  border-radius: 18rpx;
  background: #edf2f7;
}
.photo-add {
  color: #ff7d00;
  text-align: center;
  line-height: 180rpx;
  font-size: 56rpx;
}
.tag-grid {
  grid-template-columns: repeat(2, 1fr);
}
.tag {
  border: 2rpx solid #e5e7eb;
  border-radius: 999rpx;
  padding: 18rpx 20rpx;
  color: #374151;
  text-align: center;
  font-size: 26rpx;
}
.tag.selected {
  border-color: #ff7d00;
  background: #fff3e3;
  color: #a24b00;
  font-weight: 700;
}
.textarea {
  margin-top: 18rpx;
  box-sizing: border-box;
  width: 100%;
  min-height: 180rpx;
  border-radius: 20rpx;
  background: #f8fafc;
  padding: 20rpx;
  color: #1f2937;
  font-size: 28rpx;
}
.primary-btn {
  margin: 0;
  border-radius: 999rpx;
  background: #ff7d00;
  color: #fff;
}
</style>
