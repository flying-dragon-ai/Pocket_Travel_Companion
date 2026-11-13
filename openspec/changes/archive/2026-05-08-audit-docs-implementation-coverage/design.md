# Design: audit-docs-implementation-coverage

## 目标

把 `PRD_V1.0.md`、`docs/API.md`、`docs/stitch_md/**` 中的本期需求转成可机械执行的实现计划，补齐当前前端页面、后端接口、测试与 bug CSV 产物缺口。

## 明确约束

1. 本期仍使用现有技术栈：uni-app / Vue 3 / TypeScript / Pinia / SCSS；Koa / ESM / PostgreSQL。
2. 不接入强依赖真实外部服务作为验收前置：微信、地图、RAG、小程序码均保留 mock/fallback，可通过环境变量切换真实适配层。
3. 覆盖率口径固定为：新增测试覆盖所有关键业务不变量；自动化覆盖率目标按 line/statement/function/branch 100% 配置，无法自动化的 NFC 硬件、真实微信分享、真实小程序码列入手工验收与覆盖率排除说明。
4. 视觉还原口径固定为：功能验收优先，关键页面遵循 PRD 文案与 `docs/stitch_md/**/code.html` 结构；不做像素级截图一致性验收。
5. 页面实现不能再出现“占位骨架”“后续接入”等交付态文案；mock/fallback 必须表现为可用业务状态。
6. 后端错误码与响应体必须遵循 `docs/API.md`：`{ code, message, data }`。
7. 任务执行顺序固定为：测试基建 → 后端核心规则 → 前端页面闭环 → 集成/覆盖率 → bug CSV。

## 当前缺口分组

### 前端页面闭环

- 探索页：推荐卡应进入路线预览；快捷导入应跳转路径页并打开导入面板。
- 情绪问答页：实现 7 题、跳过、提交、画像存储、每日 +5 豆反馈。
- 路径页：实现偏好设置、导入链接、进行中卡片、历史分组、路线生成入口。
- 路线预览页：实现只读预览、采纳扣豆、分享入口。
- 路线详情页：补齐地图/途经点/连接条/心情筛选/分享入口。
- 景点详情页：补齐 GPS 打卡、照片最多 3 张、干货标签、评论与分享入口。
- 我的页：补齐四宫格、足迹、设置入口、红点入口。
- 豆子明细、互动消息、标签设置、分享生成页：从骨架升级为可用页面。

### 后端业务闭环

- 路线生成：用 service 层生成稳定 mock/fallback 详情，确保情绪权重、偏好、天数、必去景点参与结果。
- 链接导入：解析 URL，失败不扣豆；成功生成路线并扣 40 豆。
- 豆子：保证上限、发放、扣费保护、奖励幂等。
- 景点：打卡 GPS 500m、评论每日奖励一次、评论排序、点赞接口。
- 分享：路线/景点分享码、分享预览数据、小程序码 fallback。
- 文档：同步 API 文档/OpenAPI 与实际路由。

### 测试与质量产物

- 引入前端 Vitest/@vue/test-utils 或等价可运行测试配置。
- 引入后端 Vitest/Supertest 或等价可运行测试配置。
- 所有核心业务规则具备单元/集成测试。
- 生成 `bugs.csv`，字段固定为：`id,severity,status,module,file,requirement_id,summary,steps,expected,actual,owner,detected_by,created_at,fixed_at,notes`。

## 实现设计

### 1. 测试基建

- 根前端增加测试脚本：`test`、`test:coverage`。
- 后端增加测试脚本：`test`、`test:coverage`。
- 覆盖率报告纳入验证命令；覆盖率排除仅允许配置文件、构建配置、类型声明、无法自动化的原生平台桥接。

### 2. 后端设计

- 保持现有 Router → Controller → Model → Utils 分层。
- 新增或补齐 service 层时，只放可替换外部服务逻辑：route planning、link parsing、share poster、小程序码。
- 豆子变更必须在事务内执行；生成/导入失败必须 rollback。
- 打卡距离使用统一 GPS utility；超过 500m 返回 `50001`。
- 每日一次奖励通过数据库唯一约束或查询判定实现，重复行为允许成功但奖励为 0。

### 3. 前端设计

- 保持 `src/pages.json` 的 11 个页面；不新增页面除非 PRD 明确缺失。
- 页面状态统一：loading、error、empty、ready。
- 请求统一走 `src/utils/request.ts`；鉴权保持现有 token 重试逻辑。
- 跨页状态使用 Pinia store：user、bean、route，避免页面间复制业务状态。
- 导入链接面板由路径页承载，探索页只负责切换 tab 与传递打开意图。

### 4. 数据与接口契约

- 路线详情最小契约：routeId、title、subtitle、city、dayMode、spots、connections、recommendedSpots、moodWeightApplied、sourceType。
- 景点详情最小契约：spotId、name、images、description、openTime、ticketInfo、reservationTip、weather、crowdLevel、address、lat、lng、comments。
- 分享契约：shareCode、shareType、targetId、posterUrl 或 posterFallbackData。
- bug CSV 每次验证覆盖重写，保留固定表头。

## PBT / 不变量

| 编号 | 不变量 | 反例生成策略 |
|---|---|---|
| P1 | 豆子余额始终在 `[0, 200]` | 随机生成奖励/扣费序列，检查余额边界 |
| P2 | 路线生成/导入失败不改变豆子余额 | 随机让生成服务抛错，比较事务前后余额 |
| P3 | 成功生成/导入每次只扣 40 豆 | 随机初始余额 `40..200`，成功后差值必须为 40 |
| P4 | 余额 `<40` 时不能生成/导入路线 | 随机初始余额 `0..39`，断言返回豆子不足且无路线 |
| P5 | GPS 距离 `>500m` 禁止打卡奖励 | 随机生成 501m 以上坐标，断言 code=50001 或无奖励 |
| P6 | GPS 距离 `<=500m` 可进入打卡流程 | 随机生成 0..500m 坐标，断言不触发距离错误 |
| P7 | 同用户同景点同日重复打卡/评论最多奖励一次 | 随机重复次数 N，奖励总额不超过 10 |
| P8 | 情绪更新同日最多奖励 5 豆 | 随机重复提交问卷，奖励总额不超过 5 |
| P9 | 路线预览未采纳前不产生个人路线 | 随机浏览预览，断言路线列表不新增 |
| P10 | 采纳预览成功后产生一条个人路线并扣 40 豆 | 随机预览路线，采纳后列表增加且余额减少 40 |
| P11 | 分享码 round-trip 可解析到原始目标 | 随机 targetType/targetId 生成分享码后查询一致 |
| P12 | 评论排序优先同情绪/同标签带图前 3，再按点赞与时间 | 随机评论集合，检查排序分区与顺序 |
| P13 | 前端照片选择数量不超过 3 | 随机输入 0..10 张，提交 payload 最大 3 张 |
| P14 | 页面注册路径与跳转路径一致 | 随机遍历跳转常量，断言存在于 `pages.json` |
| P15 | API 错误响应始终可被前端展示为用户可读消息 | 随机错误码/消息，断言 request 层抛出 Error(message) |

## 验证命令

- 前端：`npm run type-check`
- 前端：`npm run lint`
- 前端：`npm run test:coverage`
- 后端：`cd backend-api && npm run lint`
- 后端：`cd backend-api && npm run test:coverage`
- OpenSpec：`openspec status --change "audit-docs-implementation-coverage" --json`

## 风险

- 真机能力如 NFC、微信分享、相册保存无法完全自动化，需要手工验收记录。
- 若数据库环境不可用，后端测试需使用 test database 或 mock repository；不得依赖生产配置。
- 100% 覆盖率可能要求拆分复杂页面逻辑到纯函数，以降低 UI 端测试脆弱性。
