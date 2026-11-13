[根目录](../CLAUDE.md) > **scripts**

# scripts 质量脚本模块

## 变更记录 (Changelog)

- 2026-05-06T22:03:17+08:00：初始化 scripts 模块 Claude 上下文；扫描 PRD 覆盖矩阵、bug CSV 生成与校验脚本。

## 模块职责

`scripts/` 当前保存项目质量脚本，重点是将 PRD 验收标准映射为可审计覆盖矩阵，并根据 missing/partial 状态生成 `bugs.csv`。

## 入口与启动

根级命令：

```bash
npm run validate:coverage-matrix
```

直接脚本入口：

```bash
node scripts/quality/validate-coverage.mjs
```

关键文件：

- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`

## 对外接口

脚本导出以下对象/函数供测试和 CLI 使用：

- `BUG_CSV_HEADER`
- `BUG_SEVERITIES`
- `BUG_STATUSES`
- `acceptanceCoverageMatrix`
- `getCoverageIssues(matrix, detectedAt)`
- `toBugCsvRows(issues)`
- `validateIssues(issues)`
- `summarizeIssues(issues)`
- `writeBugCsv(issues, targetPath)`
- `runCoverageValidation()`
- `isCliEntrypoint(argv)`

## 关键依赖与配置

- 使用 Node.js ESM 与内置 `fs/promises`、`path`、`url`。
- 输出默认路径为根级 `bugs.csv`。
- `package.json` 通过 `validate:coverage-matrix` 绑定 CLI。
- 测试文件：`tests/quality/acceptance-coverage.test.ts`。

## 数据模型

`acceptanceCoverageMatrix` 当前维护 74 条 PRD 验收标准：

- `requirement_id`：`PRD-001` 至 `PRD-074`。
- `summary`：验收项摘要。
- `frontend_files`：相关前端文件。
- `backend_endpoints`：相关后端接口或文档契约。
- `test_cases`：已有测试用例路径。
- `status`：当前覆盖状态，包含 `covered`、`partial`、`missing`、`manual` 等。

`getCoverageIssues()` 会将 `missing` 变为 High，`partial` 变为 Medium，生成固定 CSV 字段：

```csv
id,severity,status,module,file,requirement_id,summary,steps,expected,actual,owner,detected_by,created_at,fixed_at,notes
```

## 测试与质量

`tests/quality/acceptance-coverage.test.ts` 已覆盖：

- 74 条矩阵长度、ID 连续性和非 unknown 状态。
- issue 生成与字段校验。
- CSV header、逗号和引号转义。
- severity/status 汇总。
- `writeBugCsv()` 临时文件写入。
- 必填字段与 requirement_id 格式校验。
- CLI entrypoint 判断。

## 常见问题 (FAQ)

### 修改需求实现后需要同步哪里？

应同步 `scripts/quality/acceptance-coverage.mjs` 中对应 PRD 项状态、相关文件、接口和测试用例；随后运行 `npm run validate:coverage-matrix` 生成新的 `bugs.csv`。

### created_at 时间从哪里来？

默认 `getCoverageIssues()` 使用 `new Date().toISOString()`；如需确定性时间，测试或调用方应传入 `detectedAt`。

## 相关文件清单

- `scripts/quality/acceptance-coverage.mjs`
- `scripts/quality/validate-coverage.mjs`
- `tests/quality/acceptance-coverage.test.ts`
- `bugs.csv`

## 扫描覆盖摘要

- 估算文件数：2 个脚本文件。
- 已读取高信号文件：2 个。
- 覆盖率：100%。
- 缺口：覆盖矩阵状态需要随实现持续更新；当前仍存在大量 missing/partial 项。
