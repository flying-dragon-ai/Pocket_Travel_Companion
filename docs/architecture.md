# 目录规范与死代码治理

> 本文是目录职责的唯一约定。新增文件前先在这里找到它该去的位置；
> 找不到位置说明设计还没想清楚，不要先写再塞。

## 1. 目录职责

```
src/
├── api/            # 后端接口的唯一入口（services 层）
│   └── index.ts    #   所有 /api/v1/* 调用与响应类型都在这里
├── config/         # 环境配置（API 基址、超时）
│   └── env.ts
├── pages/          # 页面，按页面内聚
│   ├── <page>/
│   │   ├── <page>.vue        # 模板 + 逻辑 + scoped 样式
│   │   └── <page>-factory.ts # 该页专用的纯函数（可选）
│   └── ...
├── store/          # Pinia 全局状态：user / bean / route
├── styles/         # 全局样式：variables / mixins / components
├── utils/          # 跨页面复用的纯逻辑与基础设施
│   ├── request.ts      # HTTP 封装（鉴权注入、错误码、重试）
│   ├── auth.ts         # 登录态读写
│   ├── session.ts      # 会话守卫 ensureSession()
│   ├── error.ts        # errorMessage() / toastError()
│   ├── bean-rule.ts    # 豆子规则常量与纯函数
│   ├── bean-guard.ts   # 豆子消耗前置校验（含弹窗）
│   ├── gps-validate.ts # 距离计算与 500m 校验
│   ├── mood-map.ts     # 情绪画像默认值
│   └── storage.ts      # uni storage 薄封装
├── App.vue         # 应用入口
├── main.ts         # 应用组装（Pinia、全局样式）
├── pages.json      # 页面注册与 tabBar（uni-app 唯一页面清单）
├── manifest.json   # 小程序 appid 与权限
└── env.d.ts        # 环境变量类型声明
```

后端：

```
backend-api/src/
├── routes/         # 路由表，只做路径 → controller 映射
├── controllers/    # 业务编排、事务边界、参数校验
├── models/         # SQL 与 schema.sql
└── utils/          # 纯函数与基础设施
    ├── transaction.js  # withTransaction()，唯一的事务入口
    ├── json.js         # parseJson / stringifyJson*，唯一的 JSON 列读写
    ├── jwt.js          # 签发与校验
    ├── beanRule.js     # 豆子规则（与前端 bean-rule.ts 必须同步）
    ├── gps.js / validate.js / response.js / errors.js
    └── routePlanningService.js
```

## 2. 放置规则

| 要加的东西 | 放哪 | 禁止 |
|---|---|---|
| 新页面 | `src/pages/<name>/<name>.vue` + 在 `src/pages.json` 注册 | 只建文件不注册（页面不可达） |
| 新接口调用 | `src/api/index.ts` 加一个语义化函数 | 页面里拼 `/api/v1/...` 字符串 |
| 跨页面复用的逻辑 | `src/utils/<topic>.ts` | 复制到第二个页面 |
| 页面专用纯函数 | `src/pages/<name>/<name>-factory.ts` | 塞进 `.vue` 的 script 里 |
| 全局状态 | `src/store/<domain>.ts` | 用 storage 当状态管理 |
| 全局样式变量 | `src/styles/variables.scss` | 页面里硬编码色值（新代码） |
| 页面样式 | `.vue` 内 `<style scoped>` 或页面同目录 `*.scss` | 建集中式 `styles/pages/` 目录 |
| 后端事务 | `withTransaction()` | 手写 getConnection/begin/commit/rollback/release |
| 后端 JSON 列 | `utils/json.js` | 各 controller 自己写 `toJson` |

**判断标准**：同一个逻辑出现第二次，就必须抽出去。第一次可以就地写。

## 3. 死代码治理

### 工具

```bash
npm run deadcode:check    # knip，CI 里跑这个
npm run deadcode:report   # 输出 JSON 到 deadcode-report.json
```

配置在 `knip.json`。两个 workspace：根（前端）与 `backend-api`。

### uni-app 的特殊处理

uni-app 的页面通过 `src/pages.json` 的**字符串路径**注册，不是 import。
knip 跟不到这种引用，所以 `src/pages/**/*.vue` 必须显式列进 `entry`，
否则 14 个页面全会被报成孤儿。

同理，以下依赖是运行时 peer，源码里搜不到引用但删了会炸，已加入 `ignoreDependencies`：

| 依赖 | 为什么不能删 |
|---|---|
| `koa-static` | `swagger-ui-koa` 在运行时 `require` 它，删了 `node src/app.js` 直接 MODULE_NOT_FOUND |
| `@vue/compiler-sfc` | SFC 编译链需要，`vue-tsc` 与 vite 插件间接依赖 |
| `@dcloudio/uni-h5` / `uni-mp-weixin` | 按平台构建时才被插件加载 |

### 已知盲区

- **SCSS**：knip 不跟进 `@use` / `@import`，`src/styles/**` 的引用关系靠人工确认。
- **动态 import**：本项目 `auth.ts` 用 `await import('./request')` 打破循环依赖，knip 能识别，但新增动态导入时要留意。
- **字符串路径**：`uni.navigateTo({ url: '/pages/xxx/xxx' })` 这类跳转 knip 看不到，删页面前先 `rg` 一遍路径。

### 删除流程

1. `npm run deadcode:check` 拿到候选
2. 逐个 `rg` 确认：真的没人引用？还是动态/字符串引用？
3. 分批删，每批只处理一类（未使用导出 → 未使用文件 → 未使用依赖）
4. 每批跑完这 5 条再继续：

```bash
git status
npm run type-check
npm run lint
npm run build:mp-weixin
npm run test
```

5. 后端改动额外跑：`cd backend-api && NODE_ENV=test npm run test && NODE_ENV=test npm run lint`

## 4. 为什么不用 features/ 结构

`features/<domain>/{api,components,hooks,store,types}` 适合多团队、多领域的中大型项目。
本项目 14 个页面、3 个 store、1 个 api 模块，按 `pages / api / store / utils` 分层已经职责清晰，
再套 features 只会让每个目录里躺一两个文件，跳转成本上升。

**什么时候该换**：当 `src/pages/` 超过 30 个页面，或出现两个页面共享 5 个以上组件时，
再按领域拆 `features/`。现在不拆。
