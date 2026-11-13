import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

describe('registered frontend page navigation contracts', () => {
  it('keeps route preview and path import destinations registered', () => {
    const pagesJson = JSON.parse(readProjectFile('src/pages.json')) as {
      pages: Array<{ path: string }>
    }
    const pagePaths = pagesJson.pages.map((page) => `/${page.path}`)

    expect(pagePaths).toContain('/pages/route-preview/route-preview')
    expect(pagePaths).toContain('/pages/path/path')
    expect(pagePaths).toContain('/pages/share-generate/share-generate')
  })

  it('opens explore recommendation cards in route preview instead of route detail', () => {
    const explore = readProjectFile('src/pages/explore/explore.vue')

    expect(explore).toContain('goToRoutePreview(card)')
    expect(explore).toContain('/pages/route-preview/route-preview?recommendId=')
    expect(explore).not.toContain('/pages/route-detail/route-detail?recommendId=')
  })

  it('uses storage handoff so explore quick import opens path import panel', () => {
    const explore = readProjectFile('src/pages/explore/explore.vue')
    const path = readProjectFile('src/pages/path/path.vue')

    expect(explore).toContain("uni.setStorageSync('pathOpenImport', '1')")
    expect(explore).toContain("url: '/pages/path/path'")
    expect(path).toContain("uni.getStorageSync('pathOpenImport') === '1'")
    expect(path).toContain("activePanel.value = 'import'")
  })

  it('keeps route preview read-only until explicit adoption and exposes share entry', () => {
    const preview = readProjectFile('src/pages/route-preview/route-preview.vue')

    expect(preview).toContain('预览不会创建个人路线，也不会扣豆')
    expect(preview).toContain('async function adoptPreview()')
    expect(preview).toContain("previewId: preview.value.recommendId")
    expect(preview).toContain('generateRoute(')
    expect(preview).toContain('function generateShare()')
    expect(preview).toContain('/pages/share-generate/share-generate?type=route-preview')
  })

  it('implements seven-question mood flow with skip, submit, profile persistence, and reward feedback', () => {
    const moodQa = readProjectFile('src/pages/mood-qa/mood-qa.vue')

    expect(moodQa.match(/^\s+questionNo: \d,/gm)).toHaveLength(7)
    expect(moodQa).toContain('function skipQuestionnaire()')
    expect(moodQa).toContain("userStore.setMoodTags(['通用推荐'])")
    expect(moodQa).toContain('/api/v1/mood-map/submit')
    expect(moodQa).toContain('userStore.setMoodTags(result.moodTags')
    expect(moodQa).toContain('beanStore.setBalance(result.balance)')
    expect(moodQa).toContain('result.rewardGranted ? `已更新，+${result.rewardBeans}豆`')
  })

  it('supports emotion-aware interest tag recommendations with fallback and API save', () => {
    const tagSetting = readProjectFile('src/pages/tag-setting/tag-setting.vue')

    expect(tagSetting).toContain("const allTags = ['咖啡', '自然', '展览'")
    expect(tagSetting).toContain("userStore.moodTags.length ? userStore.moodTags : ['通用推荐']")
    expect(tagSetting).toContain("mood.includes('安静') || mood.includes('低落')")
    expect(tagSetting).toContain("mood.includes('社交') || mood.includes('庆祝')")
    expect(tagSetting).toContain('function toggleTag(tag: string)')
    expect(tagSetting).toContain('saveInterestTags(')
    expect(tagSetting).toContain("from '@/api'")
    expect(tagSetting).toContain('saveInterestTags(selectedTags.value)')
  })

  it('keeps path route factory, import panel, atmosphere fallback, and month grouping contracts', () => {
    const path = readProjectFile('src/pages/path/path.vue')

    expect(path).toContain('🎲 心情生成')
    expect(path).toContain('🔗 导入链接')
    expect(path).toContain("{ label: '半天', value: 'half_day' }")
    expect(path).toContain("{ label: '2天', value: 'two_day' }")
    expect(path).toContain('支持2至7天')
    expect(path).toContain('const atmosphereOptions = computed')
    expect(path).toContain("return ['节奏舒缓', '充实丰富', '咖啡', '自然', '展览', '轻社交']")
    expect(path).toContain('generateRouteRequest(')
    expect(path).toContain('importRouteByLink(')
    expect(path).toContain('const groupedRoutes = computed')
    expect(path).toContain('`${date.getFullYear()}年${date.getMonth() + 1}月`')
  })
  it('renders route detail map, mood filter, ordered spots, connections, share, and recommendations', () => {
    const routeDetail = readProjectFile('src/pages/route-detail/route-detail.vue')

    expect(routeDetail).toContain('height: 40vh')
    expect(routeDetail).toContain('🔴 热门商圈  🟢 安静治愈  💛 拍照出片')
    expect(routeDetail).toContain('const moodOnly = ref(false)')
    expect(routeDetail).toContain('@tap="moodOnly = !moodOnly"')
    expect(routeDetail).toContain('v-for="(s, i) in spotList"')
    expect(routeDetail).toContain("{{ s.connection || '1.6公里 · 27分钟' }}")
    expect(routeDetail).toContain('/pages/share-generate/share-generate?type=route')
    expect(routeDetail).toContain('const recommendedSpots = computed')
  })

  it('covers NFC loading, stale mood prompt, and spot address navigation', () => {
    const loading = readProjectFile('src/pages/loading/loading.vue')
    const explore = readProjectFile('src/pages/explore/explore.vue')
    const spotDetail = readProjectFile('src/pages/spot-detail/spot-detail.vue')

    expect(loading).toContain('你的旅行搭子正在向你走来')
    expect(loading).toContain('setTimeout')
    expect(loading).toContain('1500')
    expect(loading).toContain("uni.switchTab({ url: '/pages/path/path' })")
    expect(explore).toContain('shouldPromptMoodUpdate')
    // 7 天阈值与文案已收进 utils/mood-map.ts，页面只负责调用
    expect(explore).toContain("from '@/utils/mood-map'")
    expect(explore).toContain('MOOD_REFRESH_DAYS')
    expect(spotDetail).toContain('function openMapNavigation()')
    expect(spotDetail).toContain('uni.openLocation')
    expect(spotDetail).toContain('address-link')
  })

  it('covers profile shortcuts, bean logs, messages, and share page states', () => {
    const profile = readProjectFile('src/pages/profile/profile.vue')
    const beanLog = readProjectFile('src/pages/bean-log/bean-log.vue')
    const message = readProjectFile('src/pages/message/message.vue')
    const share = readProjectFile('src/pages/share-generate/share-generate.vue')

    expect(profile).toContain('豆子余额')
    expect(profile).toContain('bean-progress-fill')
    expect(profile).toContain('情绪管理')
    expect(profile).toContain('兴趣标签')
    expect(profile).toContain('互动消息')
    expect(profile).toContain('豆子明细')
    expect(profile).toContain('with-dot')
    expect(profile).toContain('我的足迹')
    expect(profile).toContain('goMoodQa')
    expect(profile).toContain('@tap="goMoodQa"')
    expect(beanLog).toContain('fetchBeanLogs(')
    expect(beanLog).toContain('formatDate')
    expect(message).toContain('unread: true')
    expect(message).toContain('class="badge"')
    expect(message).not.toContain('/api/v1/notifications')
    expect(message).not.toContain('request(')
    expect(share).toContain('生成分享图')
    expect(share).toContain('保存到相册')
    expect(share).toContain('分享到微信')
    expect(share).toContain('posterUrl')
    expect(share).toContain('shareCode')
    expect(share).toContain('function sharePoster()')
  })

  it('covers spot checkin GPS, photo limit, dry tags, comments, likes, and share entries', () => {
    const spotDetail = readProjectFile('src/pages/spot-detail/spot-detail.vue')
    const checkin = readProjectFile('src/pages/checkin-photo/checkin-photo.vue')
    const commentsAll = readProjectFile('src/pages/comments-all/comments-all.vue')

    expect(spotDetail).toContain('打卡与分享')
    expect(spotDetail).toContain('function goCheckin()')
    expect(spotDetail).toContain('function goShare()')
    expect(spotDetail).toContain('/pages/checkin-photo/checkin-photo?spotId=')
    expect(spotDetail).toContain('/pages/share-generate/share-generate?type=spot')
    expect(spotDetail).toContain('/api/v1/spots/${spotIdRef.value}/comments')
    expect(spotDetail).toContain('/comments/${item.id}/like')
    expect(spotDetail).toContain('topComments')

    expect(checkin).toContain('uni.getLocation')
    expect(checkin).toContain('calculateDistanceMeter')
    expect(checkin).toContain('isWithinDistance(distanceMeter.value)')
    expect(checkin).toContain('你离景点还有点远哦')
    expect(checkin).toContain('count: 3 - photos.value.length')
    expect(checkin).toContain('slice(0, 3)')
    expect(checkin).toContain('请选择干货标签')
    expect(checkin).toContain('dryTags: dryTags.value')
    expect(checkin).toContain('/api/v1/spots/${spotId.value}/checkins')
    expect(checkin).toContain('/pages/share-generate/share-generate?type=spot')

    expect(commentsAll).toContain('/api/v1/spots/${spotId.value}/comments')
    expect(commentsAll).toContain('/comments/${item.id}/like')
    expect(commentsAll).toContain('imageList(item)')
    expect(commentsAll).toContain('按点赞和发布时间排序')
  })
})
