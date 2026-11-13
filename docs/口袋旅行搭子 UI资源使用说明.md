# 口袋旅行搭子 UI资源使用说明

## 1. 全局设计规范说明

- 设计基准宽度：`750`（小程序 `rpx` 适配基准）
- 主色：`#FF7D00`
- 辅助色：
  - 黄：`#FFE066`（浅 `#FFF9E6` / 深 `#E6B800`）
  - 绿：`#99D899`（浅 `#F0F9F0` / 深 `#3D993D`）
- 中性色：`#FFFFFF`、`#F5F5F5`、`#999999`、`#666666`、`#333333`
- 圆角：`8px/24px/64px/9999px`（已转换为 `16rpx/48rpx/128rpx/9999rpx`）
- 间距：`8px/16px/24px/32px/48px`（已转换为 `16rpx/32rpx/48rpx/64rpx/96rpx`）
- 字体：`PingFang SC`，标题 `600/700`，正文 `400`

对应代码文件：

- 全局变量：`src/styles/variables.scss`
- 全局样式入口：`src/styles/index.scss`
- 全局组件样式：`src/styles/components/*.scss`

## 2. 静态资源现状

**当前 `src/static/` 不存在。** 页面里的图标与装饰全部用 emoji 或纯 CSS 实现，
`src/pages.json` 的 tabBar 也没有配置 `iconPath`，因此没有任何切图参与打包。

早期设计过一套 `ui-assets/` 切图（TabBar 三态图标、主按钮三态、17 个页面专属目录），
但从未被代码引用，只会被 `uni build` 原样复制进小程序包。该目录已在仓库瘦身中移除。

### 需要接入切图时

1. 在 `src/static/` 下按 `模块_语义_状态` 命名放置资源（图标 `svg`，位图 `webp`）。
2. TabBar 图标在 `src/pages.json` 的 `tabBar.list[].iconPath` / `selectedIconPath` 中引用。
3. 页面内图片用绝对路径 `/static/...` 引用，并控制单图 `<=200KB`。
4. 建议尺寸：列表缩略图宽 `320rpx` 级，头图/海报图宽 `686rpx` 级。
## 3. SCSS 变量说明与使用方法

核心文件：`src/styles/variables.scss`

- 色彩变量：`$color-primary`、`$color-secondary-yellow`、`$color-secondary-green`、`$color-gray-*`
- 圆角变量：`$radius-sm`、`$radius-md`、`$radius-lg`、`$radius-pill`
- 间距变量：`$space-1` 到 `$space-5`
- 字体变量：`$font-size-*`、`$font-weight-*`
- 阴影变量：`$shadow-card`、`$shadow-soft`

使用示例：

```scss
@use '@/styles/variables.scss' as *;

.demo-card {
  padding: $space-2;
  border-radius: $radius-md;
  background: $color-white;
  box-shadow: $shadow-soft;
}
```

## 4. 页面样式组织方式

页面样式不再集中放在 `src/styles/pages/`（该目录已移除），改为两种就近组织方式：

- 页面内 `<style scoped lang="scss">`：绝大多数页面（`path`、`profile`、`spot-detail`、`mood-qa`、`bean-log`、`message`、`tag-setting`、`share-generate`、`loading`、`checkin-photo`、`comments-all`、`route-preview`、`route-detail`）直接写在 `.vue` 内。
- 页面同目录 `*.scss`：仅 `src/pages/explore/explore.vue` 通过 `<style src="./explore.scss" lang="scss" scoped>` 外置。

全局样式仍由 `src/main.ts` 加载 `src/styles/index.scss`，其中包含 `variables.scss`、`mixins.scss` 与 `components/*.scss`（button、card、input、tabbar、tag）。

## 5. 微信小程序适配注意事项

- 所有尺寸单位统一使用 `rpx`，不使用 `px`
- 页面容器采用 `flex` 布局，避免绝对定位导致机型错位
- 底部栏场景注意 `safe-area-inset-bottom`
- 图片资源优先 `webp`，图标优先 `svg`
- 提交前检查图片体积，单张不超过 `200KB`
