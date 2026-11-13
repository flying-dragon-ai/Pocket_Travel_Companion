import { v4 as uuidv4 } from 'uuid'

/**
 * 微信 code2Session 占位实现：
 * - WECHAT_MOCK=true 时返回模拟 openid
 * - 生产环境可替换为微信官方接口调用
 */
export async function code2Session(code) {
  if (process.env.WECHAT_MOCK === 'true') {
    return {
      openid: `mock_openid_${code}_${uuidv4().slice(0, 8)}`
    }
  }

  // 这里预留真实微信接口调用（本期占位）
  return {
    openid: `wx_openid_${uuidv4().slice(0, 12)}`
  }
}
