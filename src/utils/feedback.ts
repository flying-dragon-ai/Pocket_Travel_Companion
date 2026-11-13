/**
 * 用户可见反馈的统一出口。
 *
 * 页面 catch 分支此前各自写 `e instanceof Error ? e.message : '兜底文案'`（21 处），
 * 成功提示各自写 `uni.showToast({ title, icon: 'success' })`（13 处）。
 * 集中后，文案提取规则与图标选择只维护一份。
 */

/**
 * 提取错误文案：只有 Error 且 message 非空才采用，否则用调用方给的兜底。
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** 错误提示：提取文案后以无图标 toast 呈现。 */
export function toastError(error: unknown, fallback: string): void {
  uni.showToast({ title: errorMessage(error, fallback), icon: 'none' })
}

/** 成功提示：统一 success 图标。 */
export function toastSuccess(title: string): void {
  uni.showToast({ title, icon: 'success' })
}

/** 中性提示：统一 none 图标，用于校验失败等非错误场景。 */
export function toastInfo(title: string): void {
  uni.showToast({ title, icon: 'none' })
}
