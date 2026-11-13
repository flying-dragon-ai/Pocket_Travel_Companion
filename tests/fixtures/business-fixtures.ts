export const authFixtures = {
  user: {
    id: 'user-001',
    openid: 'openid-test-001',
    nickname: '周末旅人',
    avatarUrl: 'https://example.test/avatar.png'
  },
  token: 'Bearer test.jwt.token'
}

export const beanFixtures = {
  account: {
    userId: 'user-001',
    balance: 120,
    weeklyGrant: 100,
    cap: 200
  },
  logs: [
    { id: 'bean-log-001', type: 'grant', amount: 100, balanceAfter: 100, reason: 'weekly_grant' },
    { id: 'bean-log-002', type: 'cost', amount: -40, balanceAfter: 60, reason: 'route_generate' },
    { id: 'bean-log-003', type: 'reward', amount: 10, balanceAfter: 70, reason: 'spot_checkin' }
  ]
}

export const spotFixtures = {
  spots: [
    {
      spotId: 'spot-001',
      name: '滨江旧书店',
      lat: 30.2501,
      lng: 120.1651,
      tags: ['治愈', '阅读'],
      images: ['https://example.test/spot-001.jpg']
    },
    {
      spotId: 'spot-002',
      name: '山脚咖啡馆',
      lat: 30.252,
      lng: 120.168,
      tags: ['松弛', '咖啡'],
      images: ['https://example.test/spot-002.jpg']
    }
  ],
  checkin: {
    spotId: 'spot-001',
    distanceMeters: 120,
    photos: ['photo-a.jpg', 'photo-b.jpg'],
    dryTags: ['安静角落', '适合独处'],
    description: '适合慢慢恢复能量。'
  }
}

export const routeFixtures = {
  preview: {
    routeId: 'preview-001',
    title: '松弛半日疗愈线',
    city: '杭州',
    dayMode: 'half-day',
    sourceType: 'recommendation',
    moodWeightApplied: true,
    spots: spotFixtures.spots,
    connections: [
      { fromSpotId: 'spot-001', toSpotId: 'spot-002', distanceMeters: 850, durationMinutes: 12 }
    ]
  },
  generatePayload: {
    dayMode: 'half-day',
    preferences: ['安静', '低体力'],
    playTime: 'afternoon',
    atmosphere: '松弛',
    mustGoSpotIds: ['spot-001']
  }
}

export const moodProfileFixtures = {
  answers: {
    socialIdentity: '独行充电者',
    moodTags: ['疲惫', '想放空'],
    travelPace: 'slow',
    atmospherePreference: 'quiet',
    themeInterests: ['书店', '咖啡'],
    travelGoal: 'recover_energy',
    popularAttitude: 'avoid_hotspots'
  },
  reward: { amount: 5, awarded: true }
}

export const commentFixtures = {
  comments: [
    {
      id: 'comment-001',
      spotId: 'spot-001',
      userId: 'user-001',
      content: '下午人少，坐窗边很舒服。',
      tags: ['安静角落'],
      moodTags: ['想放空'],
      photos: ['comment-001.jpg'],
      likes: 8,
      createdAt: '2026-05-01T08:00:00.000Z'
    },
    {
      id: 'comment-002',
      spotId: 'spot-001',
      userId: 'user-002',
      content: '适合快速打卡。',
      tags: ['热门'],
      moodTags: ['兴奋'],
      photos: [],
      likes: 2,
      createdAt: '2026-05-01T07:00:00.000Z'
    }
  ]
}

export const shareFixtures = {
  routeShare: {
    shareCode: 'route-share-001',
    shareType: 'route',
    targetId: 'route-001',
    posterFallbackData: {
      title: '松弛半日疗愈线',
      subtitle: '2 个点位 · 轻体力'
    }
  },
  spotShare: {
    shareCode: 'spot-share-001',
    shareType: 'spot',
    targetId: 'spot-001',
    posterFallbackData: {
      title: '滨江旧书店',
      subtitle: '安静角落 · 适合独处'
    }
  }
}
