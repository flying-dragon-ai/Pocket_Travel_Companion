<template>
  <view class="ptc-page mood-page">
    <view class="header">
      <text class="ptc-title">情绪问答</text>
      <text class="hint">7个问题会生成你的情绪旅行画像。跳过后也可以使用基础功能。</text>
    </view>

    <view class="progress-line">
      <view class="progress-fill" :style="{ width: `${progressPercent}%` }" />
    </view>

    <view class="question-card">
      <text class="question-index">{{ currentIndex + 1 }} / {{ questions.length }}</text>
      <text class="question-title">{{ currentQuestion.title }}</text>
      <text class="question-mode">{{ currentQuestion.multiple ? '可多选' : '单选' }}</text>

      <view class="option-list">
        <text
          v-for="option in currentQuestion.options"
          :key="option"
          class="option"
          :class="{ selected: currentAnswer.includes(option) }"
          @tap="toggleAnswer(option)"
        >
          {{ option }}
        </text>
      </view>
    </view>

    <view class="actions">
      <button class="ghost-btn" @tap="skipQuestionnaire">跳过</button>
      <button class="ghost-btn" :disabled="currentIndex === 0" @tap="prevQuestion">上一步</button>
      <button class="primary-btn" @tap="nextOrSubmit">{{ isLast ? '完成问答' : '下一题' }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBeanStore } from '@/store/bean'
import { useUserStore } from '@/store/user'
import { request } from '@/utils/request'
import { toastError, toastSuccess } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface Question {
  questionNo: number
  field: string
  title: string
  multiple: boolean
  options: string[]
}

const questions: Question[] = [
  {
    questionNo: 1,
    field: 'socialIdentity',
    title: '你通常和谁一起出门？',
    multiple: false,
    options: ['独自一人', '伴侣/对象', '带娃', '朋友/同事', '陌生人']
  },
  {
    questionNo: 2,
    field: 'moodTags',
    title: '你现在的状态/心情是怎样的？',
    multiple: true,
    options: ['工作压力大', '失恋低落', '想庆祝', '想透气', '社交能量高', '只想安静']
  },
  {
    questionNo: 3,
    field: 'travelPace',
    title: '你喜欢的旅行节奏是？',
    multiple: true,
    options: ['特种兵式', '松弛慢逛', '半天轻量', '两天沉浸']
  },
  {
    questionNo: 4,
    field: 'atmospherePreference',
    title: '你偏好的氛围是？',
    multiple: true,
    options: ['安静治愈', '热闹组局', '拍照出片', '烟火气', '文化感']
  },
  {
    questionNo: 5,
    field: 'themeInterests',
    title: '你最感兴趣的主题是？',
    multiple: true,
    options: ['咖啡甜品', '自然徒步', '展览市集', '自习读书', '美食探店']
  },
  {
    questionNo: 6,
    field: 'travelGoal',
    title: '这次出门最想获得什么？',
    multiple: false,
    options: ['被治愈', '拍到好照片', '认识新朋友', '提升效率', '奖励自己']
  },
  {
    questionNo: 7,
    field: 'popularAttitude',
    title: '你怎么看热门景点？',
    multiple: false,
    options: ['可以接受排队', '只去低峰时段', '更喜欢小众点', '热门小众都可以']
  }
]

const beanStore = useBeanStore()
const userStore = useUserStore()
const currentIndex = ref(0)
const answers = ref<Record<number, string[]>>({})
const submitting = ref(false)

const currentQuestion = computed(() => questions[currentIndex.value])
const currentAnswer = computed(() => answers.value[currentQuestion.value.questionNo] || [])
const isLast = computed(() => currentIndex.value === questions.length - 1)
const progressPercent = computed(() => Math.round(((currentIndex.value + 1) / questions.length) * 100))

function toggleAnswer(option: string) {
  const q = currentQuestion.value
  const list = answers.value[q.questionNo] || []
  if (!q.multiple) {
    answers.value = { ...answers.value, [q.questionNo]: [option] }
    return
  }
  answers.value = {
    ...answers.value,
    [q.questionNo]: list.includes(option) ? list.filter((item) => item !== option) : [...list, option]
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value -= 1
}

async function nextOrSubmit() {
  if (!currentAnswer.value.length) {
    uni.showToast({ title: '请选择至少一个选项', icon: 'none' })
    return
  }
  if (!isLast.value) {
    currentIndex.value += 1
    return
  }
  await submitAnswers()
}


async function submitAnswers() {
  if (submitting.value) return
  submitting.value = true
  try {
    await ensureSession()
    const payload = questions.map((q) => ({
      questionNo: q.questionNo,
      field: q.field,
      values: answers.value[q.questionNo] || []
    }))
    const result = await request<{
      moodTags: string[]
      rewardBeans: number
      balance?: number
      rewardGranted: boolean
    }>('/api/v1/mood-map/submit', {
      method: 'POST',
      data: { answers: payload }
    })
    userStore.setMoodTags(result.moodTags?.length ? result.moodTags : ['放松中'])
    if (typeof result.balance === 'number') beanStore.setBalance(result.balance)
    toastSuccess(result.rewardGranted ? `已更新，+${result.rewardBeans}豆` : '已更新心情')
    uni.switchTab({ url: '/pages/explore/explore' })
  } catch (e) {
    toastError(e, '提交失败')
  } finally {
    submitting.value = false
  }
}

function skipQuestionnaire() {
  userStore.setMoodTags(['通用推荐'])
  uni.switchTab({ url: '/pages/explore/explore' })
}
</script>

<style scoped lang="scss">
.mood-page {
  gap: 28rpx;
  padding: 36rpx 28rpx;
  background: linear-gradient(180deg, #eff8ee 0%, #fff8f2 100%);
}
.hint,
.question-mode,
.question-index {
  color: #6f766b;
  font-size: 24rpx;
  display: block;
}
.header {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.progress-line {
  height: 12rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4d9f4d;
}
.question-card {
  border-radius: 36rpx;
  background: #fff;
  padding: 34rpx;
  box-shadow: 0 16rpx 40rpx rgba(50, 83, 52, 0.1);
}
.question-title {
  display: block;
  margin: 14rpx 0 8rpx;
  color: #1e2b1f;
  font-size: 38rpx;
  font-weight: 700;
  line-height: 1.35;
}
.option-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 34rpx;
}
.option {
  border: 2rpx solid #dfe8dc;
  border-radius: 24rpx;
  padding: 22rpx;
  color: #2f3b2f;
  font-size: 28rpx;
  background: #fbfdf8;
}
.option.selected {
  border-color: #4d9f4d;
  background: #eaf8e9;
  color: #236823;
  font-weight: 700;
}
.actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.ghost-btn,
.primary-btn {
  flex: 1;
  margin: 0;
  border-radius: 999rpx;
  font-size: 26rpx;
}
.ghost-btn {
  background: rgba(255, 255, 255, 0.72);
  color: #4b5549;
}
.primary-btn {
  background: #4d9f4d;
  color: #fff;
}
</style>
