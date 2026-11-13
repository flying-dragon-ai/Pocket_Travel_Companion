<template>
  <view class="ptc-page tag-page">
    <view class="header">
      <text class="ptc-title">标签设置</text>
      <text class="hint">标签会影响探索推荐和路线生成。可多选，可随时修改。</text>
    </view>

    <view class="card">
      <text class="section-title">当前情绪</text>
      <view class="tag-row">
        <text v-for="tag in moodTags" :key="tag" class="mood-tag">{{ tag }}</text>
      </view>
    </view>

    <view class="card">
      <text class="section-title">推荐兴趣标签</text>
      <view class="tag-grid">
        <text
          v-for="tag in recommendedTags"
          :key="tag"
          class="tag"
          :class="{ selected: selectedTags.includes(tag) }"
          @tap="toggleTag(tag)"
        >
          {{ tag }}
        </text>
      </view>
    </view>

    <button class="primary-btn" @tap="saveTags">保存标签</button>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { saveInterestTags } from '@/api'
import { toastError, toastSuccess } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

const userStore = useUserStore()
const selectedTags = ref<string[]>(['咖啡', '自然', '拍照出片'])
const allTags = ['咖啡', '自然', '展览', '安静', '轻社交', '美食', '市集', '自习', '亲子', '夜景']

const moodTags = computed(() => userStore.moodTags.length ? userStore.moodTags : ['通用推荐'])
const recommendedTags = computed(() => {
  const mood = moodTags.value.join(',')
  if (mood.includes('安静') || mood.includes('低落')) return ['自然', '安静', '咖啡', '自习', '展览']
  if (mood.includes('社交') || mood.includes('庆祝')) return ['轻社交', '市集', '夜景', '美食', '拍照出片']
  return allTags
})

function toggleTag(tag: string) {
  selectedTags.value = selectedTags.value.includes(tag)
    ? selectedTags.value.filter((item) => item !== tag)
    : [...selectedTags.value, tag]
}


async function saveTags() {
  try {
    await ensureSession()
    await saveInterestTags(selectedTags.value)
    uni.setStorageSync('interestTags', selectedTags.value)
    toastSuccess('标签已保存')
    uni.switchTab({ url: '/pages/profile/profile' })
  } catch (e) {
    toastError(e, '保存失败')
  }
}
</script>

<style scoped lang="scss">
.tag-page {
  gap: 24rpx;
  padding: 34rpx 24rpx;
  background: linear-gradient(180deg, #fff6ee 0%, #f5f7fb 100%);
}
.header,
.card {
  border-radius: 30rpx;
  background: #fff;
  padding: 28rpx;
}
.hint {
  margin-top: 10rpx;
  color: #6d6964;
  font-size: 24rpx;
  display: block;
}
.section-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 700;
}
.tag-row,
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.tag,
.mood-tag {
  border-radius: 999rpx;
  padding: 14rpx 22rpx;
  font-size: 26rpx;
}
.tag {
  background: #f2f3f5;
  color: #444;
}
.tag.selected {
  background: #ff7d00;
  color: #fff;
  font-weight: 700;
}
.mood-tag {
  background: #e9f7e8;
  color: #236823;
}
.primary-btn {
  border-radius: 999rpx;
  background: #ff7d00;
  color: #fff;
  font-size: 28rpx;
}
</style>
