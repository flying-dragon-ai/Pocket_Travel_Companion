import { ok } from '../utils/response.js'
import { getBeanBalance } from '../models/beanModel.js'
import { getDb } from '../models/db.js'

export async function getBeanAccount(ctx) {
  const userId = ctx.state.user.userId
  const balance = await getBeanBalance(userId)
  ok(ctx, {
    balance,
    maxBalance: 200,
    nextGrantTime: '每周一 00:00'
  })
}

export async function getBeanLogs(ctx) {
  const userId = ctx.state.user.userId
  const [rows] = await getDb().query(
    'SELECT id, delta, reason, created_at FROM bean_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [userId]
  )
  ok(ctx, { list: rows })
}
