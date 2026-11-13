[根目录](../CLAUDE.md) > **openspec**

# openspec 规格变更模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：初始化 openspec 模块 Claude 上下文；扫描 `audit-docs-implementation-coverage` 变更 proposal 与任务清单。

## 模块职责

`openspec/` 保存项目需求/实现变更规格。当前主要变更 `audit-docs-implementation-coverage` 用于审计 docs/PRD 与前后端实现覆盖情况，拆分后续实现、测试、文档同步与 bug CSV 交付任务。

## 入口与启动

本模块非运行时模块。当前关键路径：

- `openspec/changes/audit-docs-implementation-coverage/.openspec.yaml`
- `openspec/changes/audit-docs-implementation-coverage/proposal.md`
- `openspec/changes/audit-docs-implementation-coverage/design.md`
- `openspec/changes/audit-docs-implementation-coverage/tasks.md`
- `openspec/changes/audit-docs-implementation-coverage/specs/implementation-coverage/spec.md`

## 对外接口

无运行时 API。它约束后续开发行为与验收标准，并与以下文件协同：

- `PRD_V1.0.md`
- `docs/API.md`
- `docs/stitch_md/**`
- `scripts/quality/acceptance-coverage.mjs`
- `bugs.csv`
- 前端 `src/pages/**`
- 后端 `backend-api/src/**`

## 关键依赖与配置

- Markdown/YAML 文档。
- 任务清单使用 checkbox 标记完成状态。
- 应在实现推进时同步更新 tasks、覆盖矩阵和 bug CSV。

## 数据模型

本模块维护的是规格/任务数据，不是运行时业务数据。当前 tasks 结构按主题拆分：

- 测试与覆盖脚本引入。
- PRD 74 条验收覆盖矩阵与 bug CSV。
- 后端路线规划、扣豆、导入链接、路线详情契约。
- 豆子上限、周一发放、奖励幂等。
- 景点详情、GPS、照片上限、评论排序和点赞。
- 分享码、分享图 fallback 和 round-trip。
- 前端页面占位替换、探索/路径/情绪问卷/路线预览/路线详情/景点详情/我的页完善。
- 文档/OpenAPI 同步和最终验证。

## 测试与质量

- 已完成 tasks 1.x 与 2.x：测试脚本、覆盖率配置、fixtures、PRD 矩阵、bug CSV 生成器。
- 大量 3.x 至 15.x 实现、测试、文档同步任务仍未完成。
- 最终质量任务要求运行前端 type-check/lint/coverage、后端 lint/coverage、OpenSpec 状态验证，并确保 Critical/High bugs 修复后交付。

## 常见问题 (FAQ)

### 这个模块是否可以代替 docs/API.md？

不能。OpenSpec 记录变更意图与任务拆分；实际 API 契约仍需同步 `docs/API.md`、`backend-api/docs/openapi.json` 与后端路由。

### 当前变更是否已完成？

未完成。tasks 显示仅测试/覆盖矩阵/bug CSV 基础设施完成，路线、豆子、景点、分享、前端页面和最终验证仍有大量未勾选项。

## 相关文件清单

- `openspec/changes/audit-docs-implementation-coverage/proposal.md`
- `openspec/changes/audit-docs-implementation-coverage/design.md`
- `openspec/changes/audit-docs-implementation-coverage/tasks.md`
- `openspec/changes/audit-docs-implementation-coverage/specs/implementation-coverage/spec.md`
- `scripts/quality/acceptance-coverage.mjs`
- `bugs.csv`

## 扫描覆盖摘要

- 估算文件数：5 个规格文件。
- 已读取高信号文件：2 个。
- 覆盖率：40%。
- 缺口：未深读 design/spec 细节；后续实施任务应优先读取完整变更规格。
