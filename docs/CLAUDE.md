[根目录](../CLAUDE.md) > **docs**

# docs 文档与设计资源模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：续扫文档模块；结合新增 PRD 覆盖矩阵与 OpenSpec 任务，更新文档模块在需求验收、bugs.csv 与 UI 设计切片中的角色。
- 2026-04-29T12:13:34+08:00：断点续扫文档模块；补读 API 文档与微信联调自测清单，更新接口契约、冒烟路径与覆盖率。
- 2026-04-27T15:21:03+08:00：初始化文档模块 Claude 上下文；清点 API、PRD、设计规范、联调清单与 stitch_md 设计切片。

## 模块职责

`docs/` 保存产品、接口、设计与联调资料，是需求理解、前后端对齐和 PRD 验收覆盖矩阵的主要参考来源。

## 入口与启动

本模块非运行时模块，无启动入口。关键阅读顺序建议：

1. `PRD_V1.0.md`：理解业务目标、功能边界与验收口径（唯一权威 PRD）。
2. `docs/API.md`：理解接口契约、错误码和业务规则。
3. `docs/stitch_md/DESIGN.md`：理解设计系统、页面结构和 74 条验收标准来源。
4. `docs/口袋旅行搭子 UI资源使用说明.md`：理解视觉规范与资源使用。
5. `docs/微信开发者工具联调自测清单.md`：理解小程序联调与验收流程。
6. `docs/stitch_md/**/code.html`：页面级 HTML 原型（设计源）；`screen.webp` 仅保留 README 首屏用到的 3 张。
7. `scripts/quality/acceptance-coverage.mjs`：将 PRD 验收标准映射到 frontend/backend/test/status。
8. `openspec/changes/audit-docs-implementation-coverage/tasks.md`：查看实现缺口拆分。

## 对外接口

文档模块自身不提供 API，但与后端文档存在映射：

- `docs/API.md`
- `backend-api/docs/openapi.json`
- `backend-api/docs/postman_collection.json`
- 后端运行时 `GET /docs` 与 `GET /openapi.json`

`docs/API.md` 当前记录了：

- Bearer Token 鉴权。
- 通用响应 `{ code, message, data }`。
- 错误码：`10001` 参数错误、`10002` 鉴权失败、`20001` 豆子不足、`40001/40002` 路线生成或链接解析失败、`50001` GPS 超距、`90000` 系统异常。
- 登录、情绪地图、路线生成/导入/列表/详情、景点详情、打卡、评论、豆子、分享图等接口。
- 豆子上限 200、周一发 100、路线消耗 40、生成失败不扣豆、GPS 500 米限制、情绪标签权重优先等规则。

需持续同步的契约：

- 前端评论点赞调用与后端路由/OpenAPI/API 文档是否一致。
- 情绪更新每日 +5 豆奖励幂等规则是否在文档、后端、测试中一致。
- 分享图与小程序码接口当前为 fallback 占位，文档需标注真实服务接入状态。

## 关键依赖与配置

无代码依赖。主要文件类型：Markdown、HTML、PNG 截图、设计资源说明。

相关质量资产不在 `docs/` 内，但依赖文档内容：

- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`
- `bugs.csv`
- `openspec/changes/audit-docs-implementation-coverage/**`

## 数据模型

无运行时数据模型。业务数据模型请参考：

- `backend-api/src/models/schema.sql`
- `docs/API.md`
- `PRD_V1.0.md`
- `scripts/quality/acceptance-coverage.mjs` 中的 PRD-001 至 PRD-074 映射。

## 测试与质量

非代码模块，无自身自动化测试。质量关注点：

- API 文档是否与后端路由同步。
- PRD 规则是否与前后端实现同步。
- 设计稿截图/HTML 是否与当前页面实现同步。
- 微信联调清单是否覆盖登录、NFC、定位、分享、豆子、路线生成等关键路径。
- 覆盖矩阵是否准确标记 `covered`、`partial`、`missing`、`manual` 状态。

`docs/微信开发者工具联调自测清单.md` 当前覆盖：

- 启动后端与前端 mp-weixin 编译。
- 微信开发者工具开发环境域名/TLS 放行设置。
- 登录、豆子余额、情绪标签、路线列表、链接导入、路线详情、景点列表、分享功能。
- 后端 `scripts/smoke-integration.sh` 冒烟脚本路径。
- 常见错误：`10002`、网络错误、豆子不足、数据库异常、新用户豆子。

## 常见问题 (FAQ)

### API 应以 docs/API.md 还是 openapi.json 为准？

开发时应以实际后端路由和 `backend-api/docs/openapi.json` 为准，并同步维护 `docs/API.md`，避免前端按旧文档接入。

### stitch_md 下的 screen.webp 是否需要扫描？

本次按二进制/大文件规则只记录路径，不读取图片内容。需要 UI 还原或视觉审查时可按页面单独读取对应截图。

### PRD 74 条验收标准在哪里维护？

当前机械化矩阵在 `scripts/quality/acceptance-coverage.mjs`，测试在 `tests/quality/acceptance-coverage.test.ts`，缺陷 CSV 由 `scripts/quality/validate-coverage.mjs` 输出到 `bugs.csv`。

## 相关文件清单

- `PRD_V1.0.md`
- `docs/API.md`
- `docs/stitch_md/DESIGN.md`
- `docs/口袋旅行搭子 UI资源使用说明.md`
- `docs/微信开发者工具联调自测清单.md`
- `docs/stitch_md/*/code.html`
- `docs/stitch_md/*/screen.webp`（仅 04 / 06 / 11 三页保留）
- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`
- `openspec/changes/audit-docs-implementation-coverage/tasks.md`

## 扫描覆盖摘要

- 估算文件数：约 35 个文档/设计文件，不含图片二进制内容。
- 已读取/抽取高信号文件：约 6 个，清点全部路径，并结合覆盖矩阵与 OpenSpec 任务补充上下文。
- 覆盖率：约 17%。
- 缺口：未逐页读取所有 HTML 原型和截图；后续 UI 任务建议按目标页面补扫，并同步覆盖矩阵状态。
