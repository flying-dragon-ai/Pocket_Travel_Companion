<template>
  <view class="ptc-page bean-page">
    <view class="asset-card">
      <text class="ptc-title">豆子明细</text>
      <text class="balance">🫘 {{ balance }}</text>
      <text class="hint">每周一00:00发放100豆子，余额上限200。</text>
    </view>

    <view class="rule-grid">
      <view v-for="rule in rules" :key="rule.label" class="rule">
        <text class="rule-value">{{ rule.value }}</text>
        <text class="rule-label">{{ rule.label }}</text>
      </view>
    </view>

    <view class="log-card">
      <text class="section-title">最近流水</text>
      <view v-if="loading" class="hint">加载中…</view>
      <view v-else-if="errorText" class="hint err">{{ errorText }}</view>
      <view v-else-if="!logs.length" class="empty">暂无流水，生成路线或打卡后会显示记录。</view>
      <view v-for="item in logs" v-else :key="String(item.id)" class="log-row">
        <view>
          <text class="reason">{{ item.reason }}</text>
          <text class="date">{{ formatDate(item.created_at) }}</text>
        </view>
        <text class="delta" :class="{ plus: item.delta > 0 }">
          {{ item.delta > 0 ? '+' : '' }}{{ item.delta }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useBeanStore } from '@/store/bean'
import { fetchBeanAccount, fetchBeanLogs } from '@/api'
import { BEAN_RULE } from '@/utils/bean-rule'
import { errorMessage } from '@/utils/feedback'
import { ensureSession } from '@/utils/session'

interface BeanLog {
  id: number | string
  delta: number
  reason: string
  created_at: string
}

const beanStore = useBeanStore()
const balance = ref(beanStore.balance)
const logs = ref<BeanLog[]>([])
const loading = ref(false)
const errorText = ref('')

const rules = [
  { label: '生成路线', value: `-${BEAN_RULE.routeGenerationCost}` },
  { label: '导入链接', value: `-${BEAN_RULE.importRouteCost}` },
  { label: '打卡/评论', value: `+${BEAN_RULE.checkinReward}` },
  { label: '更新心情', value: `+${BEAN_RULE.moodUpdateReward}` }
]

onShow(loadLogs)


async function loadLogs() {
  loading.value = true
  errorText.value = ''
  try {
    await ensureSession()
    const [account, data] = await Promise.all([
      fetchBeanAccount(),
      fetchBeanLogs()
    ])
    beanStore.setBalance(account.balance)
    balance.value = account.balance
    logs.value = data.list || []
  } catch (e) {
    errorText.value = errorMessage(e, '加载失败')
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  if (!value) return ''
  return String(value).slice(0, 16).replace('T', ' ')
}
</script>

<style scoped lang="scss">
.bean-page {
  gap: 24rpx;
  padding: 32rpx 24rpx;
  background: #fff8ec;
}
.asset-card,
.log-card {
  border-radius: 32rpx;
  background: #fff;
  padding: 30rpx;
  box-shadow: 0 10rpx 28rpx rgba(141, 110, 99, 0.1);
}
.balance {
  display: block;
  margin: 20rpx 0 8rpx;
  color: #8d4b00;
  font-size: 56rpx;
  font-weight: 800;
}
.hint,
.empty,
.date,
.rule-label {
  color: #766b63;
  font-size: 24rpx;
  display: block;
}
.hint.err {
  color: #c0392b;
}
.rule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}
.rule {
  border-radius: 24rpx;
  background: #fff;
  padding: 24rpx;
}
.rule-value {
  color: #ff7d00;
  font-size: 34rpx;
  font-weight: 800;
  display: block;
}
.section-title {
  display: block;
  margin-bottom: 12rpx;
  font-size: 32rpx;
  font-weight: 700;
}
.log-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f0ece6;
}
.reason {
  display: block;
  color: #2b2118;
  font-size: 28rpx;
  font-weight: 600;
}
.delta {
  color: #c0392b;
  font-size: 30rpx;
  font-weight: 800;
}
.delta.plus {
  color: #16853a;
}
</style>
