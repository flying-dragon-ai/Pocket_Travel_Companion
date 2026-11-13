import { BizError } from './errors.js'

export function requireFields(payload, fields) {
  for (const field of fields) {
    const value = payload[field]
    if (value === undefined || value === null || value === '') {
      throw new BizError(10001, `参数错误: ${field} 必填`)
    }
  }
}
