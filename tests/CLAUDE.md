[根目录](../CLAUDE.md) > **tests**

# tests 根级测试模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：初始化测试模块 Claude 上下文；扫描根级 Vitest 配置、uni mock、业务 fixtures、前端业务规则测试与 PRD 覆盖矩阵测试。

## 模块职责

`tests/` 是根级测试模块，主要覆盖前端 TypeScript 业务规则、Pinia store、请求封装、uni-app 环境 mock，以及 PRD 验收覆盖矩阵和 bugs.csv 生成脚本。

## 入口与启动

根级测试入口：

```bash
npm run test
npm run test:coverage
npm run validate:coverage-matrix
```

关键入口文件：

- `vitest.config.ts`：根级 Vitest 配置。
- `tests/setup.ts`：stub `globalThis.uni`，覆盖导航、弹窗、登录、请求、storage、定位、选图等 API。
- `tests/utils/business-rules.test.ts`：前端业务规则与请求封装测试。
- `tests/quality/acceptance-coverage.test.ts`：PRD 覆盖矩阵与 bugs.csv 工具测试。
- `tests/fixtures/business-fixtures.ts`：跨领域业务 fixtures。

## 对外接口

本模块不对外提供运行时 API。它验证以下内部接口与脚本：

- `src/config/env.ts`
- `src/utils/bean-rule.ts`
- `src/utils/gps-validate.ts`
- `src/utils/mood-map.ts`
- `src/utils/storage.ts`
- `src/utils/auth.ts`
- `src/utils/request.ts`
- `src/store/bean.ts`
- `src/store/route.ts`
- `src/store/user.ts`
- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`

## 关键依赖与配置

- `vitest.config.ts` 设置 `environment: 'node'`。
- include：`tests/**/*.{test,spec}.ts`、`src/**/*.{test,spec}.{ts,tsx}`。
- setupFiles：`tests/setup.ts`。
- alias：`@ -> src`。
- coverage include：`src/utils/**/*.ts`、`src/store/**/*.ts`、`src/config/**/*.ts`。
- coverage exclude：Vue SFC、声明文件、测试文件与 fixtures。
- coverage thresholds：statements/branches/functions/lines 均为 100%。

## 数据模型

`tests/fixtures/business-fixtures.ts` 提供可复用业务 fixtures：

- `authFixtures`：用户、openid、token。
- `beanFixtures`：余额、周一发豆、上限、流水。
- `spotFixtures`：景点、坐标、标签、打卡数据。
- `routeFixtures`：路线预览、途经点、连接距离、生成 payload。
- `moodProfileFixtures`：社交身份、情绪标签、旅行节奏、奖励。
- `commentFixtures`：带图评论、情绪标签、点赞数。
- `shareFixtures`：路线/景点分享码与 poster fallback 数据。

## 测试与质量

已读测试覆盖：

- `tests/utils/business-rules.test.ts`
  - API base URL 与 timeout。
  - 豆子上限、扣费、余额不足异常。
  - GPS 距离与 500m 边界。
  - storage wrapper。
  - Pinia bean/user/route store。
  - 登录会话保存/清理、微信登录 code 成功/失败。
  - `request()` 成功、原始响应、HTTP 错误、业务错误、网络错误、storage token、绝对 URL、10002 鉴权重试。
- `tests/quality/acceptance-coverage.test.ts`
  - PRD-001 至 PRD-074 顺序与状态非 unknown。
  - missing/partial 生成 bug issues。
  - CSV header、逗号/引号转义。
  - severity/status 汇总。
  - 临时目录写入 bugs.csv。
  - 必填字段校验与 CLI 入口判断。

## 常见问题 (FAQ)

### 为什么测试使用 node 环境而不是 jsdom？

当前覆盖重点是业务规则、store 和请求封装，不直接渲染 DOM。uni-app API 通过 `tests/setup.ts` stub，因此 node 环境足够且更轻量。

### 页面级测试在哪里？

当前尚未建立完整页面级 Vue 组件测试。后续如需组件挂载测试，先安装 `@vue/test-utils`（当前未安装），再针对 route-preview、checkin-photo、comments-all、mood-qa、path 等页面逐步补齐。

### 覆盖率为什么排除 `.vue`？

`vitest.config.ts` 注释说明 uni-app SFC 页面由 `vue-tsc`、lint、build 验证；V8 在当前配置下不能可靠 remap 未覆盖 `.vue` 文件。

## 相关文件清单

- `vitest.config.ts`
- `tests/setup.ts`
- `tests/fixtures/business-fixtures.ts`
- `tests/fixtures/business-fixtures.test.ts`
- `tests/utils/business-rules.test.ts`
- `tests/quality/acceptance-coverage.test.ts`
- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`

## 扫描覆盖摘要

- 估算文件数：5 个测试/fixture 文件。
- 已读取高信号文件：5 个。
- 覆盖率：100%。
- 缺口：未运行测试；页面级交互测试与前后端契约测试仍需补齐。
