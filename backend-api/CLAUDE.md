[根目录](../CLAUDE.md) > **backend-api**

# backend-api 后端 API 模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：续扫后端模块；补充 Vitest 配置与 `backend-api/tests/**`，深读 auth/mood/share/user controller 与 wechat/map/rag 占位服务，更新测试现状、契约缺口和下一步建议。
- 2026-04-29T12:13:34+08:00：断点续扫后端模块；补扫路线、景点、豆子 controller/model、鉴权中间件、豆子规则、GPS 规则与 schema。
- 2026-04-27T15:21:03+08:00：初始化后端模块 Claude 上下文；扫描启动入口、路由、OpenAPI、数据库 schema、调度器与关键工具。

## 模块职责

`backend-api/` 是口袋旅行搭子的 Node.js Koa 后端服务，负责：

- 微信登录与 JWT 鉴权。
- 情绪地图画像提交、查询和快速调整。
- 路线生成、链接导入、路线列表/详情/删除。
- 景点列表、详情、收藏、打卡、评论。
- 豆子余额、流水、每周发放调度。
- 分享码、路线/景点分享图接口。
- OpenAPI 与 Swagger UI 文档服务。
- 后端业务规则与模型层 Vitest 测试。

## 入口与启动

关键入口：

- `backend-api/src/app.js`：Koa app 初始化，中间件、路由、数据库初始化、调度器启动。
- `backend-api/src/routes/index.js`：聚合所有业务路由，并暴露 `/health`。
- `backend-api/src/models/db.js`：PostgreSQL 连接、建库、建表和 MySQL 风格占位符兼容。
- `backend-api/src/models/schema.sql`：数据库 schema。
- `backend-api/vitest.config.js`：后端 Vitest/coverage 配置。

开发命令：

```bash
cd backend-api
npm run dev
npm start
npm run lint
npm run test
npm run test:coverage
```

## 对外接口

路由挂载情况：

- `GET /health`
- `POST /api/v1/auth/wechat/login`
- `POST /api/v1/auth/login`
- `POST /api/v1/mood-map/submit`
- `GET /api/v1/mood-map/profile`
- `PATCH /api/v1/mood-map/quick-adjust`
- `POST /api/v1/routes/generate`
- `POST /api/v1/routes`
- `POST /api/v1/routes/import-link`
- `GET /api/v1/routes`
- `GET /api/v1/routes/:routeId`
- `DELETE /api/v1/routes/:routeId`
- `GET /api/v1/spots`
- `GET /api/v1/spots/:spotId`
- `POST /api/v1/spots/:spotId/favorite`
- `POST /api/v1/spots/:spotId/checkins`
- `POST /api/v1/spots/:spotId/comments`
- `GET /api/v1/spots/:spotId/comments`
- `GET /api/v1/beans/balance`
- `GET /api/v1/beans/logs`
- `GET /api/v1/share/:shareCode`
- `POST /api/v1/share/route-poster`
- `POST /api/v1/share/spot-poster`
- `POST /api/v1/share/route`
- `GET /openapi.json`
- `GET /docs`

待核对契约：前端 `comments-all.vue` 调用 `POST /api/v1/spots/:spotId/comments/:commentId/like`，但本次扫描的路由清单未包含该接口；`spotModel.js` 存在 `incrementCommentLike()`，建议补齐 route/controller 或调整前端。

接口文档：

- `backend-api/docs/openapi.json`
- `backend-api/docs/postman_collection.json`
- 根文档 `docs/API.md`

## 关键依赖与配置

`backend-api/package.json` 显示：

- 框架与中间件：`koa`、`koa-router`、`koa-bodyparser`、`@koa/cors`、`koa-helmet`、`koa-static`。
- 鉴权与配置：`jsonwebtoken`、`dotenv`。
- 数据库：`pg`。
- 调度：`node-cron`。
- 文档：`swagger-ui-koa`。
- 工具：`uuid`。
- 测试：`vitest`、`@vitest/coverage-v8`（未引入 `supertest`，controller 测试走 mock DB）。

运行环境变量：

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ALLOW_START_WITHOUT_DB`
- `NODE_ENV`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `WECHAT_MOCK`
- 微信真实接口相关 appid/secret 尚未在占位服务中完整落地。

## 数据模型

`backend-api/src/models/schema.sql` 定义主要表：

- `users`：微信用户基础信息。
- `bean_accounts`：豆子账户余额。
- `bean_logs`：豆子流水。
- `mood_profiles`：情绪问答与情绪标签 JSON。
- `routes`：用户路线，详情使用 JSONB。
- `spots`：景点基础信息，详情使用 JSONB。
- `checkins`：打卡记录，含距离、照片、干货标签。
- `comments`：景点评论，含评分、图片、点赞数。
- `spot_favorites`：用户景点收藏，用户与景点唯一。
- `share_records`：分享记录与分享码。

数据库层特征：

- 启动时读取 `schema.sql` 自动确保表存在。
- 通过 `normalizeSql` 将 `?` 转换为 PostgreSQL `$1`、`$2` 占位符，兼容部分 MySQL 风格模型代码。
- `getConnection()` 提供事务方法 `beginTransaction`、`commit`、`rollback`。

## 关键业务链路扫描摘要

### 鉴权与用户

- `authController.wechatLogin()` 要求 `code`，调用 `code2Session()` 获取 openid。
- 新用户通过 `createUser()` 创建并 `ensureBeanAccount()` 初始化豆子账户。
- JWT 由 `signToken({ userId, openid })` 签发。
- `authMiddleware` 要求 `Authorization: Bearer <token>`，校验失败返回 `10002`。
- `userController.getUserProfile()` 根据 token userId 返回用户基础资料，用户不存在返回 `10001`。

### 微信/地图/RAG adapter

- `utils/wechat.js`：`WECHAT_MOCK=true` 时返回 `mock_openid_*`；非 mock 仍返回随机 `wx_openid_*`，尚未调用微信官方接口。

### 情绪地图

- `moodController.submitMoodMap()` 保存 answers 与提取出的 moodTags。
- 当前 `extractMoodTags()` 是占位规则：读取第 2 题 values 前 3 个，否则返回 `['放松中']`。
- `rewardExpected` 为真时在事务内按 `beanRule.moodUpdateReward` 给豆并写流水。
- 缺口：未看到“每日最多一次情绪更新奖励”的幂等限制，OpenSpec tasks 已列为待办。
- `quickAdjustMood()` 可覆盖 moodTags，但不发奖励。

### 豆子

- 规则在 `backend-api/src/utils/beanRule.js`：上限 200，路线/导入消耗 40，打卡/评论奖励 10，情绪更新奖励 5。
- `backend-api/src/models/beanModel.js`：新用户首次建账默认 100 豆；更新余额经过 `clampBeanBalance()`。
- 周一发豆通过 `grantWeeklyBeansBatch()` 批处理，实际发放大于 0 才写流水。

### 路线

- `generateRoute()` 与 `importRouteByLink()` 均在事务内先校验余额，再创建路线，成功后扣豆并写流水。
- 异常时 rollback，并对生成/解析失败返回含 `consumedBeans: 0` 的业务错误，符合“失败不扣豆”的约束。
- 当前路线详情由 `buildMockRouteDetail()` 生成模拟途经点，`ragUsed: false`，后续需替换真实 RAG/地图策略。

### 景点、GPS、奖励

- `createSpotCheckin()` 使用 Haversine 距离并要求 500 米内，否则抛 `50001`。
- 打卡和评论奖励均按“每日每用户每景点一次”判断，满足条件后在事务内更新豆子并写流水。
- `favoriteSpot()` 使用 `ON CONFLICT DO NOTHING` 保证收藏幂等。
- 待核对：打卡照片最多 3 张、评论个性化排序、点赞接口路由与 controller 尚需补齐。

### 分享

- `generateRoutePoster()` 与 `generateSpotPoster()` 生成 12 位 shareCode，写入 `share_records`，返回 CDN poster 占位 URL 与小程序路径。
- `shareRoute()` 为路线生成分享码与 `/api/v1/share/:shareCode` URL。
- `getSharedContent()` 对无效 shareCode 返回 `{ exist: false }`，有效时返回类型与 targetId。
- 缺口：真实海报、小程序码、spot/route fallback 数据契约与 round-trip 测试仍需补齐。

## 测试与质量

已有质量入口：

- `npm run lint`
- `npm run test`
- `npm run test:coverage`
- `backend-api/scripts/smoke-integration.sh`：API 冒烟脚本。
- `GET /health`：健康检查。
- `GET /docs`、`GET /openapi.json`：文档可用性检查。

Vitest 配置：

- `backend-api/vitest.config.js` 包含 `tests/**/*.{test,spec}.js`。
- 覆盖范围：`src/utils/**/*.js`、`src/models/**/*.js`。
- 显式排除：`src/app.js`、`src/models/db.js`、`src/utils/scheduler.js`、`src/utils/wechat.js`、`src/utils/logger.js`。
- 阈值：statements/branches/functions/lines 均为 100%。

已读测试：

- `backend-api/tests/business-fixtures.test.js`：校验 auth、bean、route、spot、mood、comment、share fixtures 可复用。
- `backend-api/tests/utils-models.test.js`：mock DB 覆盖 response、validation、beanRule、GPS、JWT、authMiddleware、errorMiddleware、bean/mood/route/share/spot/user model 基础行为。

建议优先补齐：

1. Controller 集成测试：auth、mood、route、spot、share、user。
2. 情绪奖励幂等：每日 +5 限制。
3. 路线事务：余额不足、生成失败 rollback、导入非法链接不扣豆。
4. 景点：GPS 500m 边界、照片上限 3、评论排序/点赞、奖励每日每景点一次。
5. 分享：route/spot poster fallback、shareCode 回查、无效 shareCode。

## 常见问题 (FAQ)

### 数据库未启动时服务为何还能启动？

`src/app.js` 中非生产环境或 `ALLOW_START_WITHOUT_DB=true` 时，数据库初始化失败会降级启动。此时仅无需数据库的接口可用，业务接口可能报错。

### OpenAPI 与实际路由不一致怎么办？

实际路由以 `backend-api/src/routes/**` 为准。变更接口时应同步更新 `backend-api/docs/openapi.json`、`docs/API.md`、前端调用、Postman 集合和覆盖矩阵。

### RAG 现在是否接入真实向量库？

尚未。路线 controller 当前使用 `routePlanningService` 的确定性规则生成路线详情，后续需接入真实 POI 检索、RAG、模型调用、失败兜底与内容合规策略。

### 微信登录是否已接真实 code2Session？

尚未。`utils/wechat.js` 当前是 mock/fallback：即使非 `WECHAT_MOCK` 也返回随机 openid。接入真实微信接口时必须保留测试可用 mock 路径。

## 相关文件清单

- `backend-api/package.json`
- `backend-api/vitest.config.js`
- `backend-api/src/app.js`
- `backend-api/src/routes/index.js`
- `backend-api/src/routes/authRoutes.js`
- `backend-api/src/routes/moodRoutes.js`
- `backend-api/src/routes/routeRoutes.js`
- `backend-api/src/routes/spotRoutes.js`
- `backend-api/src/routes/beanRoutes.js`
- `backend-api/src/routes/shareRoutes.js`
- `backend-api/src/routes/userRoutes.js`
- `backend-api/src/controllers/authController.js`
- `backend-api/src/controllers/moodController.js`
- `backend-api/src/controllers/routeController.js`
- `backend-api/src/controllers/spotController.js`
- `backend-api/src/controllers/beanController.js`
- `backend-api/src/controllers/shareController.js`
- `backend-api/src/controllers/userController.js`
- `backend-api/src/models/beanModel.js`
- `backend-api/src/models/moodModel.js`
- `backend-api/src/models/routeModel.js`
- `backend-api/src/models/shareModel.js`
- `backend-api/src/models/spotModel.js`
- `backend-api/src/models/userModel.js`
- `backend-api/src/models/schema.sql`
- `backend-api/src/utils/authMiddleware.js`
- `backend-api/src/utils/beanRule.js`
- `backend-api/src/utils/gps.js`
- `backend-api/src/utils/jwt.js`
- `backend-api/src/utils/wechat.js`
- `backend-api/src/utils/scheduler.js`
- `backend-api/docs/openapi.json`
- `backend-api/scripts/smoke-integration.sh`
- `backend-api/tests/business-fixtures.test.js`
- `backend-api/tests/utils-models.test.js`
- `backend-api/tests/fixtures/business-fixtures.js`

## 扫描覆盖摘要

- 估算文件数：约 45 个源码/配置/文档/测试文件，不含 `node_modules/` 和 lock 文件。
- 已读取/抽取高信号文件：约 35 个，并通过路由文件确认主要接口定义。
- 覆盖率：约 78%。
- 缺口：controller 集成测试不足；微信/地图/RAG/分享图仍为占位；情绪奖励每日幂等、评论点赞路由、评论排序、照片上限仍需核对或补齐。
