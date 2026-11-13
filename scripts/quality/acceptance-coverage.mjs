export const BUG_CSV_HEADER = [
  'id',
  'severity',
  'status',
  'module',
  'file',
  'requirement_id',
  'summary',
  'steps',
  'expected',
  'actual',
  'owner',
  'detected_by',
  'created_at',
  'fixed_at',
  'notes'
]

export const BUG_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Info']
export const BUG_STATUSES = ['Open', 'In Progress', 'Fixed', "Won't Fix", 'Deferred']

export const acceptanceCoverageMatrix = [
  {
    requirement_id: 'PRD-001',
    summary: '底部导航栏固定显示「探索」「路径」「我的」三个Tab',
    frontend_files: ['src/pages.json'],
    backend_endpoints: [],
    test_cases: ['tests/fixtures/business-fixtures.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-002',
    summary: '探索页顶部第一行显示定位城市、天气和豆子余额',
    frontend_files: ['src/pages/explore/explore.vue'],
    backend_endpoints: ['/api/v1/beans/balance'],
    test_cases: [],
    status: 'partial'
  },
  {
    requirement_id: 'PRD-003',
    summary: '探索页顶部第二行显示当前心情和条件化情绪问答入口',
    frontend_files: ['src/pages/explore/explore.vue'],
    backend_endpoints: ['/api/v1/mood-map/profile'],
    test_cases: [],
    status: 'partial'
  },
  {
    requirement_id: 'PRD-004',
    summary: '探索页快捷导入条切换至路径页并弹出导入链接半屏弹窗',
    frontend_files: ['src/pages/explore/explore.vue', 'src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/import-link'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-005',
    summary: '探索页场景化推荐瀑布流结合情绪、身份、天气生成个性化推荐',
    frontend_files: ['src/pages/explore/explore.vue', 'src/store/route.ts'],
    backend_endpoints: ['/api/v1/routes'],
    test_cases: [],
    status: 'partial'
  },
  {
    requirement_id: 'PRD-006',
    summary: '探索页推荐卡片仅显示「xx人去过」',
    frontend_files: ['src/pages/explore/explore.vue'],
    backend_endpoints: [],
    test_cases: [],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-007',
    summary: '探索页推荐卡片点击后进入路线预览页',
    frontend_files: ['src/pages/explore/explore.vue', 'src/pages/route-preview/route-preview.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-008',
    summary: '路线预览页未扣费前不生成个人路线',
    frontend_files: ['src/pages/route-preview/route-preview.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-009',
    summary: '路线预览页右上角分享按钮生成包含小程序链接的分享图',
    frontend_files: ['src/pages/route-preview/route-preview.vue', 'src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/share/route-poster'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/share-contracts.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-010',
    summary: '首次启动展示7个情绪地图问答，可完成或跳过',
    frontend_files: ['src/pages/mood-qa/mood-qa.vue'],
    backend_endpoints: ['/api/v1/mood-map/submit'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-011',
    summary: '跳过问答后可直接使用基础功能',
    frontend_files: ['src/pages/mood-qa/mood-qa.vue', 'src/pages/explore/explore.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-012',
    summary: '问答结果正确存储为用户画像核心字段',
    frontend_files: ['src/pages/mood-qa/mood-qa.vue', 'src/store/user.ts'],
    backend_endpoints: ['/api/v1/mood-map/submit', '/api/v1/mood-map/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/bean-invariants.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-013',
    summary: '我的页支持完整重测和快速调整情绪地图',
    frontend_files: ['src/pages/profile/profile.vue', 'src/pages/mood-qa/mood-qa.vue'],
    backend_endpoints: ['/api/v1/mood-map/quick-adjust'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/bean-invariants.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-014',
    summary: '更新情绪地图每天最多获得5豆子',
    frontend_files: ['src/pages/mood-qa/mood-qa.vue'],
    backend_endpoints: ['/api/v1/mood-map/submit'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/bean-invariants.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-015',
    summary: '情绪地图与探索页场景化推荐规则联动',
    frontend_files: ['src/pages/explore/explore.vue', 'src/store/user.ts', 'src/store/route.ts'],
    backend_endpoints: ['/api/v1/mood-map/profile', '/api/v1/routes'],
    test_cases: [],
    status: 'partial'
  },
  {
    requirement_id: 'PRD-016',
    summary: '标签设置页根据情绪标签智能推荐相关景点标签',
    frontend_files: ['src/pages/tag-setting/tag-setting.vue'],
    backend_endpoints: ['/api/v1/mood-map/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-017',
    summary: '跳过情绪问答时标签设置展示全部景点标签',
    frontend_files: ['src/pages/tag-setting/tag-setting.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-018',
    summary: '兴趣标签可多选、保存和修改',
    frontend_files: ['src/pages/tag-setting/tag-setting.vue'],
    backend_endpoints: ['/api/v1/user/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-019',
    summary: '路径页头部操作区包含心情生成和导入链接按钮',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-020',
    summary: 'NFC 玩偶拉起小程序并播放加载动画后进入路径页',
    frontend_files: ['src/pages/loading/loading.vue', 'src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-021',
    summary: 'NFC 加载动画文案、形象和 1.5 秒时长符合要求',
    frontend_files: ['src/pages/loading/loading.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-022',
    summary: 'NFC 玩偶形象符合文旅主题规则',
    frontend_files: ['src/pages/loading/loading.vue', 'docs/stitch_md/01-加载动画页/code.html'],
    backend_endpoints: [],
    test_cases: [],
    status: 'manual'
  },
  {
    requirement_id: 'PRD-023',
    summary: '路径页进行中行程卡显示旅行中、日期、地点数、进度和三个按钮',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-024',
    summary: '路径页历史行程按月份分组折叠',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-025',
    summary: '偏好设置表单行程天数包含半天、1天、2天、更多和日期选择器',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-026',
    summary: '日期选择器支持2至7天行程',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-027',
    summary: '氛围倾向选项根据社交身份和情绪动态变化',
    frontend_files: ['src/pages/path/path.vue', 'src/store/user.ts'],
    backend_endpoints: ['/api/v1/mood-map/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-028',
    summary: '氛围倾向无匹配画像时回退通用选项',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-029',
    summary: '偏好设置和导入链接界面支持顶部 Tab 切换并显示豆子余额与消耗提示',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/beans/balance'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-030',
    summary: '用户可通过偏好设置表单生成路线并消耗40豆子',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-031',
    summary: '用户可粘贴自媒体链接一键导入生成路线并消耗40豆子',
    frontend_files: ['src/pages/path/path.vue', 'src/pages/explore/explore.vue'],
    backend_endpoints: ['/api/v1/routes/import-link'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-032',
    summary: '自媒体链接导入正确解析链接内容、提取景点并生成路线',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/import-link'],
    test_cases: ['backend-api/tests/utils-models.test.js', 'tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-033',
    summary: '生成路线包含途径点序列和每个景点详细信息',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/generate', '/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-034',
    summary: '路线详情页地图总览占约40%高度且可下拉放大',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-035',
    summary: '路线详情页地图使用语义颜色图钉标记景点',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-036',
    summary: '路线详情页支持只看适合我心情的景点筛选',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-037',
    summary: '路线详情页右上角分享按钮生成包含小程序链接的分享图',
    frontend_files: ['src/pages/route-detail/route-detail.vue', 'src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/share/route-poster'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/share-contracts.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-038',
    summary: '路线详情页下半屏途径点卡片流可滑动抽屉',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-039',
    summary: '路线详情页景点卡片之间显示距离与步行时间连接条',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-040',
    summary: '路线详情页景点卡片包含序号、名称、描述、建议时长和缩略图',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-041',
    summary: '路线详情页末尾展示推荐地点模块',
    frontend_files: ['src/pages/route-detail/route-detail.vue'],
    backend_endpoints: ['/api/v1/routes/{routeId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-042',
    summary: '景点详情页基础信息含头图、介绍、开放时间、门票、预约、天气和人流',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}'],
    test_cases: ['backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-043',
    summary: '景点详情页点击地址可调起第三方地图导航',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-044',
    summary: '景点详情页底部常驻打卡拍照按钮',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-045',
    summary: '打卡上传前 GPS 校验，超过500米提示并禁止上传',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue', 'src/pages/checkin-photo/checkin-photo.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}/checkins'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-046',
    summary: '打卡上传支持最多3张图片、必选干货标签和描述',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue', 'src/pages/checkin-photo/checkin-photo.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}/checkins'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-047',
    summary: '打卡发布成功获得10豆子并自动生成分享图',
    frontend_files: ['src/pages/checkin-photo/checkin-photo.vue', 'src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}/checkins', '/api/v1/share/spot-poster'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/share-contracts.test.js', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-048',
    summary: '分享图包含用户照片、景点名、旅行搭子形象和小程序码',
    frontend_files: ['src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/share/spot-poster'],
    test_cases: ['backend-api/tests/share-contracts.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-049',
    summary: '分享图可保存相册或分享到微信',
    frontend_files: ['src/pages/share-generate/share-generate.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-050',
    summary: '其他用户扫码可查看对应景点详情或路线',
    frontend_files: ['src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/share/{shareCode}'],
    test_cases: ['backend-api/tests/share-contracts.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-051',
    summary: '景点评论区置顶同标签/同情绪且带图的前3条评论',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue', 'src/pages/comments-all/comments-all.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}/comments'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-052',
    summary: '用户可点赞评论且点赞影响排序',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue', 'src/pages/comments-all/comments-all.vue'],
    backend_endpoints: ['/api/v1/spots/{spotId}/comments/{commentId}/like'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-053',
    summary: '我的页头部资产卡显示头像、昵称、情绪标签云、豆子余额和进度条',
    frontend_files: ['src/pages/profile/profile.vue'],
    backend_endpoints: ['/api/v1/user/profile', '/api/v1/beans/balance', '/api/v1/mood-map/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-054',
    summary: '我的页四宫格包含情绪管理、兴趣标签、互动消息、豆子明细',
    frontend_files: ['src/pages/profile/profile.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-055',
    summary: '我的页互动消息有未读红点',
    frontend_files: ['src/pages/profile/profile.vue', 'src/pages/message/message.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-056',
    summary: '我的页我的足迹混合陈列历史路线卡片和打卡相册网格',
    frontend_files: ['src/pages/profile/profile.vue'],
    backend_endpoints: ['/api/v1/routes', '/api/v1/spots'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-057',
    summary: '我的页右上角设置齿轮收纳低频功能',
    frontend_files: ['src/pages/profile/profile.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-058',
    summary: '豆子系统发放、上限、扣费、奖励规则正常运行',
    frontend_files: ['src/store/bean.ts'],
    backend_endpoints: ['/api/v1/beans/balance', '/api/v1/beans/logs'],
    test_cases: [
      'tests/fixtures/business-fixtures.test.ts',
      'tests/utils/business-rules.test.ts',
      'backend-api/tests/bean-invariants.test.js',
      'backend-api/tests/utils-models.test.js'
    ],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-059',
    summary: '豆子不足时无法生成路线并提示获取方式',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/business-rules.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-060',
    summary: '生成路线或导入链接失败不扣豆',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate', '/api/v1/routes/import-link'],
    test_cases: ['backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-061',
    summary: '用户登录功能正常，支持微信授权登录与账号密码登录',
    frontend_files: ['src/utils/auth.ts'],
    backend_endpoints: ['/api/v1/auth/wechat/login', '/api/v1/auth/login'],
    test_cases: ['tests/utils/business-rules.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-062',
    summary: '系统通过 RAG 能力生成个性化路线规划',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-063',
    summary: '生成路线与用户兴趣标签、情绪标签高度相关',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-064',
    summary: '情绪标签正确影响推荐逻辑',
    frontend_files: ['src/pages/explore/explore.vue', 'src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-065',
    summary: '跳过情绪问答时可基于用户直接输入生成路线',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: ['/api/v1/routes/generate'],
    test_cases: ['tests/utils/page-navigation.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-066',
    summary: '超过7天未更新情绪时探索页顶部提示更新心情',
    frontend_files: ['src/pages/explore/explore.vue'],
    backend_endpoints: ['/api/v1/mood-map/profile'],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-067',
    summary: '所有异常情况按异常与边界情况表处理',
    frontend_files: ['src/utils/request.ts'],
    backend_endpoints: ['docs/API.md status codes'],
    test_cases: ['tests/utils/business-rules.test.ts', 'backend-api/tests/utils-models.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-068',
    summary: 'TOP50 热门景点预埋官方高质量带图评论',
    frontend_files: [],
    backend_endpoints: ['/api/v1/spots', '/api/v1/spots/{spotId}/comments'],
    test_cases: ['backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-069',
    summary: '打卡发布页输入框 placeholder 展示示例文案',
    frontend_files: ['src/pages/spot-detail/spot-detail.vue', 'src/pages/checkin-photo/checkin-photo.vue'],
    backend_endpoints: [],
    test_cases: ['backend-api/tests/spot-interactions.test.js'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-070',
    summary: 'NFC 离线时正常拉起小程序并展示离线提示',
    frontend_files: ['src/pages/loading/loading.vue', 'src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: [],
    status: 'manual'
  },
  {
    requirement_id: 'PRD-071',
    summary: 'NFC 未授权时进入授权页后进入路径页并展示加载动画',
    frontend_files: ['src/pages/loading/loading.vue', 'src/utils/auth.ts'],
    backend_endpoints: ['/api/v1/auth/wechat/login'],
    test_cases: [],
    status: 'manual'
  },
  {
    requirement_id: 'PRD-072',
    summary: '氛围倾向无匹配画像时回退展示通用选项',
    frontend_files: ['src/pages/path/path.vue'],
    backend_endpoints: [],
    test_cases: ['tests/utils/page-navigation.test.ts'],
    status: 'covered'
  },
  {
    requirement_id: 'PRD-073',
    summary: '探索页场景化推荐卡片符合对应场景类型文案与推荐规则',
    frontend_files: ['src/pages/explore/explore.vue', 'src/store/route.ts'],
    backend_endpoints: ['/api/v1/routes'],
    test_cases: [],
    status: 'partial'
  },
  {
    requirement_id: 'PRD-074',
    summary: '分享功能正常，分享图包含小程序码且扫码可查看对应内容',
    frontend_files: ['src/pages/share-generate/share-generate.vue'],
    backend_endpoints: ['/api/v1/share/route-poster', '/api/v1/share/spot-poster', '/api/v1/share/{shareCode}'],
    test_cases: ['backend-api/tests/share-contracts.test.js'],
    status: 'covered'
  }
]

function getIssueModule(item) {
  const hasFrontend = item.frontend_files.length > 0
  const hasBackend = item.backend_endpoints.length > 0

  if (hasFrontend && hasBackend) return 'frontend/backend'
  if (hasFrontend) return 'frontend'
  if (hasBackend) return 'backend'
  return 'docs'
}

export function getCoverageIssues(matrix = acceptanceCoverageMatrix, detectedAt = new Date().toISOString()) {
  return matrix
    .filter((item) => ['missing', 'partial'].includes(item.status))
    .map((item, index) => ({
      id: `BUG-${String(index + 1).padStart(3, '0')}`,
      severity: item.status === 'missing' ? 'High' : 'Medium',
      status: 'Open',
      module: getIssueModule(item),
      file: item.frontend_files.join(';'),
      requirement_id: item.requirement_id,
      summary: item.summary,
      steps: 'Run acceptance coverage validation',
      expected: 'Requirement is fully implemented and covered by tests',
      actual: item.status === 'missing' ? 'Requirement implementation is missing' : 'Requirement is only partially implemented or untested',
      owner: 'unassigned',
      detected_by: 'scripts/quality/validate-coverage.mjs',
      created_at: detectedAt,
      fixed_at: '',
      notes: `status=${item.status}`
    }))
}
