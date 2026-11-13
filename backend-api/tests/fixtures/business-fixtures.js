export const authFixtures = {
  user: {
    id: 'user-001',
    openid: 'openid-test-001',
    nickname: '周末旅人',
    avatar_url: 'https://example.test/avatar.png'
  },
  token: 'Bearer test.jwt.token'
}

export const beanFixtures = {
  account: {
    user_id: 'user-001',
    balance: 120,
    weeklyGrant: 100,
    cap: 200
  },
  logs: [
    { id: 'bean-log-001', type: 'grant', amount: 100, balance_after: 100, reason: 'weekly_grant' },
    { id: 'bean-log-002', type: 'cost', amount: -40, balance_after: 60, reason: 'route_generate' },
    { id: 'bean-log-003', type: 'reward', amount: 10, balance_after: 70, reason: 'spot_checkin' }
  ]
}

export const spotFixtures = {
  spots: [
    {
      id: 'spot-001',
      name: '滨江旧书店',
      latitude: 30.2501,
      longitude: 120.1651,
      tags: ['治愈', '阅读'],
      images: ['https://example.test/spot-001.jpg']
    },
    {
      id: 'spot-002',
      name: '山脚咖啡馆',
      latitude: 30.252,
      longitude: 120.168,
      tags: ['松弛', '咖啡'],
      images: ['https://example.test/spot-002.jpg']
    }
  ],
  checkin: {
    spot_id: 'spot-001',
    distance_meters: 120,
    photos: ['photo-a.jpg', 'photo-b.jpg'],
    dry_tags: ['安静角落', '适合独处'],
    description: '适合慢慢恢复能量。'
  }
}

export const routeFixtures = {
  preview: {
    id: 'preview-001',
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
      spot_id: 'spot-001',
      user_id: 'user-001',
      content: '下午人少，坐窗边很舒服。',
      tags: ['安静角落'],
      mood_tags: ['想放空'],
      photos: ['comment-001.jpg'],
      likes: 8,
      created_at: '2026-05-01T08:00:00.000Z'
    },
    {
      id: 'comment-002',
      spot_id: 'spot-001',
      user_id: 'user-002',
      content: '适合快速打卡。',
      tags: ['热门'],
      mood_tags: ['兴奋'],
      photos: [],
      likes: 2,
      created_at: '2026-05-01T07:00:00.000Z'
    }
  ]
}

export const shareFixtures = {
  routeShare: {
    share_code: 'route-share-001',
    share_type: 'route',
    target_id: 'route-001',
    poster_fallback_data: {
      title: '松弛半日疗愈线',
      subtitle: '2 个点位 · 轻体力'
    }
  },
  spotShare: {
    share_code: 'spot-share-001',
    share_type: 'spot',
    target_id: 'spot-001',
    poster_fallback_data: {
      title: '滨江旧书店',
      subtitle: '安静角落 · 适合独处'
    }
  }
}
