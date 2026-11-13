[根目录](../CLAUDE.md) > **src**

# src 前端小程序模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：续扫前端模块；补充根级 Vitest 测试配置、业务规则测试覆盖、14 个注册页面状态，以及新增 loading、route-preview、checkin-photo、comments-all、tag-setting、message 页面摘要。
- 2026-04-29T12:13:34+08:00：断点续扫前端模块；补扫页面注册、请求封装、豆子/GPS 规则、路线详情、景点详情、占位业务页与 store。
- 2026-04-27T15:21:03+08:00：初始化前端模块 Claude 上下文；扫描入口、页面路由、状态管理、请求封装与核心页面样例。

## 模块职责

`src/` 是口袋旅行搭子的 uni-app 微信小程序前端模块，负责：

- 探索、路径、我的三 Tab 主流程。
- 情绪问答、路线预览/详情、景点详情、打卡拍照、全部评论、豆子明细、互动消息、标签设置、分享图生成等页面。
- Pinia 管理用户、豆子、路线推荐状态。
- 统一 API 请求、微信登录换票、token 持久化与鉴权失败重登。
- UI 样式、页面静态资源与小程序配置。

## 入口与启动

关键入口：

- `src/main.ts`：创建 Vue SSR app，注册 Pinia，加载全局样式 `src/styles/index.scss`。
- `src/App.vue`：全局 App 生命周期与基础页面背景样式。
- `src/pages.json` 与根 `pages.json`：当前均注册 14 个页面，并配置探索、路径、我的三 Tab。
- `src/manifest.json`、根级 `manifest.json`：uni-app/小程序元配置。

开发与质量命令在根 `package.json`：

```bash
npm run dev:h5
npm run dev:mp-weixin
npm run build:h5
npm run build:mp-weixin
npm run type-check
npm run lint
npm run test
npm run test:coverage
```

## 对外接口

前端通过 `src/utils/request.ts` 统一请求后端：

- Base URL：`src/config/env.ts`
  - 开发：`http://127.0.0.1:3000`
  - 生产：`https://api.pocket-travel-companion.com`
- 默认注入 `Authorization: Bearer <token>`。
- 统一识别 `{ code, message, data }` 响应结构。
- 遇业务码 `10002` 且允许重试时，调用 `refreshAuthToken()` 后重试一次。

已在扫描样例中出现的接口：

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/wechat/login`
- `GET /api/v1/user/profile`
- `GET /api/v1/beans/balance`
- `GET /api/v1/beans/logs`
- `POST /api/v1/mood-map/submit`
- `GET /api/v1/mood-map/profile`
- `PATCH /api/v1/mood-map/quick-adjust`
- `GET /api/v1/routes`
- `POST /api/v1/routes/generate`
- `POST /api/v1/routes/import-link`
- `GET /api/v1/routes/:routeId`
- `DELETE /api/v1/routes/:routeId`
- `GET /api/v1/spots`
- `GET /api/v1/spots/:spotId`
- `POST /api/v1/spots/:spotId/favorite`
- `POST /api/v1/spots/:spotId/checkins`
- `POST /api/v1/spots/:spotId/comments`
- `GET /api/v1/spots/:spotId/comments`
- `POST /api/v1/spots/:spotId/comments/:commentId/like`：前端 `comments-all.vue` 已调用，但后端当前路由清单未确认存在，需优先对齐。
- `POST /api/v1/share/route-poster`
- `POST /api/v1/share/spot-poster`
- `POST /api/v1/share/route`
- `GET /api/v1/share/:shareCode`

## 关键依赖与配置

根 `package.json` 显示：

- 运行依赖：`@dcloudio/uni-app`、`@dcloudio/uni-h5`、`@dcloudio/uni-mp-weixin`、`vue`、`pinia`。
- 开发依赖：`@dcloudio/vite-plugin-uni`、`typescript`、`vite`、`vue-tsc`、`eslint`、`sass`、`vitest`、`@vitest/coverage-v8`、`@vue/compiler-sfc`、`cross-env`、`eslint-plugin-vue`、`vue-eslint-parser`。

关键配置文件：

- `src/pages.json`、根 `pages.json`：页面注册与 tabBar。
- `src/config/env.ts`：环境接口域名与超时。
- `vitest.config.ts`：根级前端/质量测试配置，覆盖 `src/utils/**`、`src/store/**`、`src/config/**`。
- `tests/setup.ts`：mock `uni` 全局 API。
- `.eslintrc.cjs`、`.prettierrc`、`.editorconfig`：lint 与格式配置。

## 数据模型

前端本地状态模型集中在 `src/store/`：

- `src/store/user.ts`
  - `openid`、`nickname`、`avatar`、`moodTags`、`token`、`tokenExpireAt`。
  - `primaryMoodText` 派生当前主情绪。
- `src/store/bean.ts`
  - `balance`、`logs`、`maxBalance`、`routeCost`。
  - `addBeans()` 使用上限保护，`consumeRouteBeans()` 仅成功扣费路径更新余额。
- `src/store/route.ts`
  - 当前路线 ID、历史路线 ID、推荐卡片列表。

规则工具：

- `src/utils/bean-rule.ts`
  - 豆子上限 200。
  - 路线生成/导入消耗 40。
  - 打卡/评论奖励 10，情绪更新奖励 5。
  - `consumeBeansOnSuccess()` 用于成功后扣费保护。
- `src/utils/gps-validate.ts`
  - Haversine 计算直线距离。
  - `isWithinDistance(distanceMeter, 500)` 用于 GPS 500 米打卡边界。
- `src/utils/mood-map.ts`
  - 提供默认情绪画像结构，测试中验证默认 tags 为空。

持久化：登录 token/openid/过期时间通过 `uni.getStorageSync` 与本地 storage 工具保存。

## 页面扫描摘要

当前 `src/pages.json` 注册 14 个页面：

- `src/pages/explore/explore.vue`：探索 Tab；包含顶部状态、情绪入口、推荐卡与导入入口，但 PRD 覆盖矩阵仍标记多项 partial/missing。
- `src/pages/path/path.vue`：路径 Tab；偏联调与路线列表/生成入口，PRD 中路线生成工厂、导入半屏、进行中/历史分组仍需补齐。
- `src/pages/profile/profile.vue`：我的 Tab；读取用户、豆子、心情与快捷入口，但四宫格、足迹、设置、未读红点仍不完整。
- `src/pages/mood-qa/mood-qa.vue`：仍需实现 7 题流程、跳过、提交、奖励反馈。
- `src/pages/loading/loading.vue`：NFC/加载动画页，1.5 秒后切换到路径页；当前使用简单形象和文案。
- `src/pages/route-preview/route-preview.vue`：已具备只读预览、分享入口与“采纳灵感”调用 `POST /api/v1/routes/generate` 扣 40 豆生成个人路线；仍需与真实推荐数据和不创建预览约束测试对齐。
- `src/pages/route-detail/route-detail.vue`：根据 `routeId` 加载路线详情，展示来源、创建时间、情绪权重标签和途经点；途经点可跳转景点详情。
- `src/pages/spot-detail/spot-detail.vue`：根据 `spotId` 加载景点详情，展示坐标、天气、人流、结构化详情，并可调用收藏接口。
- `src/pages/checkin-photo/checkin-photo.vue`：打卡拍照页；最多 3 张照片、干货标签、描述 placeholder、GPS 500m 前端校验、发布后跳转分享生成页。
- `src/pages/comments-all/comments-all.vue`：评论列表页；加载全部评论，展示图片、点赞数，并调用评论点赞接口。后端点赞接口需核对/补齐。
- `src/pages/bean-log/bean-log.vue`：豆子明细仍需补齐真实流水列表与状态。
- `src/pages/message/message.vue`：互动消息静态 mock 数据，含未读 badge；缺真实消息数据源。
- `src/pages/tag-setting/tag-setting.vue`：基于当前情绪给出推荐兴趣标签并保存到本地 storage；未对接后端用户画像保存。
- `src/pages/share-generate/share-generate.vue`：分享图生成仍需接入 route/spot poster 数据与保存/分享行为。

历史占位页 `src/pages/me/me.vue` 已于清理中移除（未在 `pages.json` 注册、无任何引用）；「我的」页以 `src/pages/profile/profile.vue` 为准。

## 测试与质量

已有质量入口：

- `npm run type-check`：Vue/TypeScript 类型检查。
- `npm run lint`：对 `src` 下 `.vue,.ts,.tsx` lint。
- `npm run test`：Vitest 前端/质量测试。
- `npm run test:coverage`：V8 覆盖率，配置要求 statements/branches/functions/lines 100%。
- `tests/utils/business-rules.test.ts`：覆盖 API env、豆子规则、GPS、storage、Pinia store、登录会话、请求成功/错误/鉴权重试。
- `tests/quality/acceptance-coverage.test.ts`：覆盖 PRD 74 条验收矩阵、bug CSV 序列化、问题校验、CLI 入口判断。
- 微信开发者工具联调文档：`docs/微信开发者工具联调自测清单.md`。

建议补齐：

1. 页面级 smoke/组件测试：探索、路径、路线预览、路线详情、景点详情、打卡、评论、我的。
2. `mood-qa`：问卷完成、跳过、提交失败、每日奖励提示。
3. `path`：偏好 payload、导入面板、路线生成成功/失败、历史分组。
4. `share-generate`：poster fallback、保存相册失败、分享路径。
5. 前后端契约测试：评论点赞接口、分享图接口、路线采纳与豆子余额同步。

## 常见问题 (FAQ)

### 为什么页面进入时会先调用微信登录？

探索页、路径页、我的页及部分详情页会检测 token 是否存在或过期；无 token 或过期时调用 `wechatLogin()` 走 `uni.login` 换票，避免后续业务接口批量返回 `10002`。

### 开发接口请求失败先看哪里？

依次检查：`src/config/env.ts`、后端 `PORT`、后端是否启动、微信开发者工具合法域名设置、接口路径是否与 `backend-api/src/routes/**` 一致。

### 前端与 API 文档不一致怎么办？

以运行中的后端路由和 `backend-api/docs/openapi.json` 为准，同时同步更新 `docs/API.md`、`scripts/quality/acceptance-coverage.mjs` 与调用页面。

### `comments-all.vue` 的点赞接口为什么要优先核对？

该页面调用 `/api/v1/spots/:spotId/comments/:commentId/like`，但后端当前扫描到的路由清单未包含点赞路由。若不补齐，页面点赞会在联调时失败。

## 相关文件清单

- `src/main.ts`
- `src/App.vue`
- `src/pages.json`
- `src/config/env.ts`
- `src/utils/request.ts`
- `src/utils/auth.ts`
- `src/utils/bean-rule.ts`
- `src/utils/gps-validate.ts`
- `src/utils/mood-map.ts`
- `src/utils/storage.ts`
- `src/store/user.ts`
- `src/store/bean.ts`
- `src/store/route.ts`
- `src/pages/explore/explore.vue`
- `src/pages/path/path.vue`
- `src/pages/profile/profile.vue`
- `src/pages/mood-qa/mood-qa.vue`
- `src/pages/loading/loading.vue`
- `src/pages/route-preview/route-preview.vue`
- `src/pages/route-detail/route-detail.vue`
- `src/pages/spot-detail/spot-detail.vue`
- `src/pages/checkin-photo/checkin-photo.vue`
- `src/pages/comments-all/comments-all.vue`
- `src/pages/bean-log/bean-log.vue`
- `src/pages/message/message.vue`
- `src/pages/tag-setting/tag-setting.vue`
- `src/pages/share-generate/share-generate.vue`
- `tests/setup.ts`
- `tests/utils/business-rules.test.ts`
- `src/styles/**`

## 扫描覆盖摘要

- 估算文件数：约 93 个源码/配置/样式/资源清单文件，不含被忽略依赖与二进制。
- 已读取高信号文件：约 32 个。
- 覆盖率：约 34%。
- 缺口：未逐页深入全部样式与 UI 资源；`mood-qa`、`bean-log`、`share-generate` 仍需实现；页面级自动化测试不足；评论点赞接口存在契约待核对。
