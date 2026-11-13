/**
 * JSON 列读写helper。
 *
 * 数据库里的 JSON 列在 pg 驱动下可能以字符串或已解析对象返回，
 * 写入时又要区分「null 保持 null」与「null 落成 {}」两种语义。
 * 此前 controller 里 `toJson` 复制了 5 份，model 里又有 3 个变体，
 * 行为差异只体现在 null 分支上，极易改错一处。
 */

/** 读取方向：DB 值 → 对象。字符串解析失败时返回 fallback。 */
export function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value
}

/** 写入方向：对象 → JSON 字符串。null/undefined 落成 fallback 的序列化结果。 */
export function stringifyJson(value, fallback) {
  return JSON.stringify(value ?? fallback)
}

/** 写入方向：对象 → JSON 字符串，null/undefined 保持 null。 */
export function stringifyJsonOrNull(value) {
  if (value === null || value === undefined) return null
  return typeof value === 'string' ? value : JSON.stringify(value)
}

/** 写入方向：对象 → JSON 字符串，null/undefined 落成 '{}'。 */
export function stringifyJsonOrEmptyObject(value) {
  if (value === null || value === undefined) return '{}'
  return typeof value === 'string' ? value : JSON.stringify(value)
}
