/**
 * 本地存储统一封装：
 * - 统一管理 key，便于后续做命名空间隔离
 * - 统一返回值，避免上层出现 undefined/null 判断混乱
 */
export function setStorage<T>(key: string, value: T) {
  uni.setStorageSync(key, value)
}

export function getStorage<T>(key: string): T | null {
  const value = uni.getStorageSync(key)
  return value ?? null
}

export function removeStorage(key: string) {
  uni.removeStorageSync(key)
}
