# Proposal: audit-docs-implementation-coverage

## 背景

用户要求读取 `docs/` 中页面设计与需求文档，对照当前前端页面与后端实现，判断是否覆盖所有页面与需求；未完成项应在后续阶段继续实现，并最终完成测试与 bug CSV 统计。

本阶段是 `/ccg:spec-research` research phase，仅产出约束集合与可验证成功判据，不修改源码、不补实现、不写测试。

## 范围

### In Scope

- 读取并对齐需求来源：`PRD_V1.0.md`、`docs/PRD.md`、`docs/API.md`、`docs/stitch_md/**` 页面设计资源。
- 对照前端页面注册与实现：`src/pages.json`、`src/pages/**/*.vue`、前端 store 与 utils。
- 对照后端接口实现：`backend-api/src/routes/**`、`backend-api/src/controllers/**`、`backend-api/src/models/**`、`backend-api/docs/openapi.json`。
- 梳理已完成、部分完成、缺失、占位/模拟实现。
- 定义后续 bug CSV 字段、测试成功标准与覆盖率口径。

### Out of Scope for Research Phase

- 不修改 `src/` 或 `backend-api/` 源码。
- 不新增测试文件。
- 不运行实施型修复。
- 不承诺真实 100% 业务覆盖率已达成；仅定义后续可执行标准。

## 已发现结构

### 文档与设计

- `PRD_V1.0.md` 是当前主需求文档；`docs/PRD.md` 仅索引根 PRD。
- `docs/API.md` 定义登录、情绪地图、路线生成/导入/列表/详情、景点、打卡、评论、豆子、分享接口与错误码。
- `docs/stitch_md/**` 包含 15 个页面设计切片，包括加载动画、情绪问卷、标签设置、探索、推荐、路径、生成路径、景点详情、评论、打卡拍照、分享海报、我的、豆子明细、互动消息等。
- `docs/stitch_md/DESIGN.md` 内含设计系统、页面结构、业务规则、异常边界与 74 条验收标准。

### 前端

- `src/pages.json` 注册 11 个页面：探索、路径、我的、情绪问答、路线预览、路线详情、景点详情、豆子明细、互动消息、标签设置、分享图生成。
- 三 Tab 已注册：探索、路径、我的。
- 当前多页面仍是骨架或联调用简化页：`mood-qa`、`bean-log`、`tag-setting`、`route-preview`、`message`、`share-generate`、`me`。
- `explore.vue` 已有顶部状态、快捷导入、瀑布流推荐与接口联调，但推荐卡点击进入路线详情而非路线预览；快捷导入是 action sheet/modal，不是 PRD 要求的切换路径页并弹半屏导入。
- `path.vue` 当前偏 API 联调列表页，未实现 PRD 中路线生成工厂、进行中行程卡、历史分组、偏好表单、导入链接半屏等完整交互。
- `profile.vue` 有用户信息、豆子、心情和快捷入口，但未完整实现四宫格、足迹、设置入口、互动消息红点等。

### 后端

- 已有 Koa 分层：routes/controller/model/utils。
- 已实现主要路由：auth、mood-map、routes、spots、beans、share、docs。
- 豆子规则、GPS 500m、路线生成/导入扣费保护、打卡/评论奖励幂等方向已有实现。
- `routeController.js` 当前通过 `buildMockRouteDetail()` 生成模拟路线，`ragUsed: false`。
- `mapService.js`、`ragService.js`、`wechat.js` 仍有占位/模拟逻辑。
- 评论个性化排序、点赞接口、真实分享图、小程序码、真实 RAG/地图距离矩阵、官方 TOP50 冷启动等仍未完整落地。

## 约束集合

### Hard Constraints

1. 项目使用 uni-app / Vue 3 / TypeScript 前端与 Koa / PostgreSQL 后端，必须沿现有分层修改。
2. 修改代码前必须读取 `.context/prefs/coding-style.md` 与 `.context/prefs/workflow.md`；本次已读取。
3. API 响应必须保持 `{ code, message, data }` 结构，并沿用 `docs/API.md` 错误码。
4. 鉴权接口必须使用 Bearer Token；前端请求封装已有 `10002` 重试逻辑，后续不能破坏。
5. 豆子规则是强约束：上限 200、路线/导入消耗 40、打卡/评论奖励 10、情绪更新奖励 5、失败不扣豆。
6. 打卡 GPS 必须限制 500m 内，超距返回/提示对应错误。
7. 前端页面必须以 `src/pages.json` 注册路径为准；新增页面需同步 pages 配置与跳转路径。
8. 后续实现不能依赖真实微信、地图、RAG 服务作为唯一通过路径；缺少密钥和外部配置时必须有可测 mock/fallback。
9. 当前仓库无自动化测试框架；实现 100% 覆盖率需要先引入测试工具与覆盖率采集口径。
10. `/ccg:spec-research` 阶段禁止源码修改；实现必须进入后续 planning/implementation 阶段。

### Soft Constraints

1. 前端应保持 Vue 3 `<script setup>`、Pinia、SCSS 风格。
2. 后端应保持 Router + controller + model + utils 分层。
3. 修改应小步可审查，避免一次性重构全仓。
4. 文档、OpenAPI、前端调用、后端路由变更应同步。
5. 页面还原优先以 PRD 验收标准与 `docs/stitch_md/**/code.html` 为基准，截图用于视觉核对。

## 依赖关系

1. 情绪问答完成度影响：探索页推荐、标签设置页推荐、路径页氛围倾向、路线生成权重。
2. 豆子系统影响：路线生成、导入链接、打卡、评论、情绪更新、豆子明细。
3. 路线生成依赖：偏好表单、情绪画像、RAG/mock 路线、地图/mock 距离矩阵、扣费事务。
4. 景点详情依赖：景点数据、GPS 校验、打卡上传、评论列表/排序、分享图生成。
5. 分享功能依赖：share_records、路线/景点目标、分享码/小程序码生成 fallback、前端分享页。
6. 测试覆盖率依赖：先引入前端与后端测试框架，再定义覆盖率阈值和排除项。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| 需求规模远超一次实现 | 容易产生大改、回归风险 | 后续按页面/业务闭环拆分实施批次 |
| 100% 覆盖率目标不明确 | 无法机械验收 | 在 plan 阶段定义 statement/branch/function/line 覆盖率与排除目录 |
| 多个外部服务仍占位 | 微信/地图/RAG/小程序码无法真实联调 | 保留 mock/fallback，同时隔离 service 层便于替换 |
| 文档与实际 API 不一致 | 前后端联调失败 | 以实际路由为准，同步 `docs/API.md` 与 openapi |
| 页面设计切片多且实现不完整 | UI 还原工作量大 | 优先 PRD 74 条验收标准，再逐页对齐 stitch HTML |
| 外部 codex/gemini 探索失败 | research 信息少 | 已用本会话读取的项目上下文与源码扫描补齐约束；失败原因记录为环境限制 |

## 初步缺口清单

| 分类 | 缺口 |
|---|---|
| 前端页面 | `mood-qa` 未实现 7 题流程、跳过、提交与奖励反馈 |
| 前端页面 | `route-preview` 是骨架，未实现只读预览、采纳扣豆、分享入口 |
| 前端页面 | `path` 未实现路线生成工厂、偏好设置、日期选择、导入链接半屏、进行中/历史分组 |
| 前端页面 | `spot-detail` 需核对/补齐打卡拍照、照片选择、标签、评论、地图导航、分享图 |
| 前端页面 | `bean-log`、`message`、`tag-setting`、`share-generate` 仍为骨架或不完整 |
| 前端交互 | 探索页推荐点击应进入路线预览，而当前进入路线详情 |
| 前端交互 | 探索页快捷导入应切换到路径页并弹出半屏导入，而当前为 action sheet/modal |
| 后端能力 | 路线生成仍为 mock detail，未接真实 RAG/地图排序策略 |
| 后端能力 | 自媒体链接导入仅校验 URL 并生成 mock 路线，未解析内容/POI |
| 后端能力 | 分享图、小程序码、评论点赞、个性化评论排序、TOP50 官方内容预埋不完整 |
| 测试 | 前后端当前无自动化测试框架与覆盖率报告 |
| 质量产物 | bug CSV 尚未生成；需在验证阶段根据测试/审查结果输出 |

## Bug CSV 建议字段

后续验证阶段生成 `bugs.csv`，建议字段：

```csv
id,severity,status,module,file,requirement_id,summary,steps,expected,actual,owner,detected_by,created_at,fixed_at,notes
```

severity 建议枚举：`Critical`、`High`、`Medium`、`Low`、`Info`。
status 建议枚举：`Open`、`In Progress`、`Fixed`、`Won't Fix`、`Deferred`。

## 可验证成功判据

1. 逐条映射 PRD 74 条验收标准，形成需求覆盖矩阵：`requirement_id -> frontend file -> backend endpoint -> test case -> status`。
2. `src/pages.json` 注册页面与 PRD 页面结构一致；所有注册页面不再出现“占位骨架/后续接入”文案。
3. 探索页满足顶部状态、情绪入口、快捷导入跳转路径页、场景化推荐、路线预览入口。
4. 情绪问答页实现 7 题流程、跳过、提交、画像存储、每日 +5 豆奖励。
5. 路径页实现偏好生成、链接导入、进行中行程、历史分组、天气/清单/问一问入口的可用 UI 或明确 fallback。
6. 路线预览页实现只读预览、采纳扣 40 豆、未采纳不生成个人路线。
7. 路线详情页实现地图/途经点/连接条/心情筛选/分享入口的可测行为。
8. 景点详情页实现基础信息、GPS 打卡、照片最多 3 张、干货标签、评论列表、分享入口。
9. 豆子、消息、标签设置、分享生成页均有真实数据流或可测 mock 数据流。
10. 后端接口覆盖 `docs/API.md` 中所有本期接口，错误码与业务规则一致。
11. 路线生成/导入失败不扣豆，成功扣 40；打卡/评论/情绪更新奖励符合每日限制。
12. 前端 `npm run type-check`、`npm run lint` 通过。
13. 后端 `npm run lint` 通过。
14. 引入测试后，前端与后端覆盖率按 plan 阶段定义达到 100% 的目标口径；若存在技术性排除项，必须在覆盖率配置中显式列出并记录原因。
15. 生成 bug CSV，统计 Open/Fixed/Critical/High 等数量，并确保 Critical/High 为 0 后交付。

## 待确认问题

1. “测试覆盖率 100%”的口径是否是 line/statement/function/branch 全部 100%，还是仅关键业务规则 100%？默认建议关键业务规则 100% + 全仓 line threshold 分阶段提高。
2. 真实微信登录、地图 API、RAG、分享图/小程序码是否必须在本期接真实服务？默认建议本期保留 mock/fallback，真实服务作为可插拔适配层。
3. NFC 硬件流程是否需要自动化验证？默认建议以启动参数/场景值模拟验证，真实硬件列入手工验收。
4. 页面视觉是否要求像素级还原 `docs/stitch_md/**/screen.png`？默认建议功能验收优先，关键页面再做视觉 polish。

## 后续建议

Research complete. Run `/ccg:spec-plan` to continue.
