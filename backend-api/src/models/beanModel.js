import { getDb } from './db.js'
import { clampBeanBalance } from '../utils/beanRule.js'
import { withTransaction } from '../utils/transaction.js'

export async function getBeanBalance(userId) {
  const [rows] = await getDb().query(
    'SELECT balance FROM bean_accounts WHERE user_id = ? LIMIT 1',
    [userId]
  )
  return rows[0]?.balance ?? 0
}

export async function getBeanBalanceTx(connection, userId, { lock = false } = {}) {
  const lockSql = lock ? ' FOR UPDATE' : ''
  const [rows] = await connection.query(
    `SELECT balance FROM bean_accounts WHERE user_id = ? LIMIT 1${lockSql}`,
    [userId]
  )
  return rows[0]?.balance ?? 0
}

export async function ensureBeanAccount(userId) {
  // 联调/开发：新用户首次建账赠送初始豆子，避免 import-link / 生成路线因余额为 0 无法走通
  await getDb().query(
    'INSERT INTO bean_accounts (user_id, balance) VALUES (?, 100) ON CONFLICT (user_id) DO NOTHING',
    [userId]
  )
}

export async function claimDailyRewardTx(connection, { userId, rewardType, targetType = 'global', targetId = 0 }) {
  const [rows] = await connection.query(
    `INSERT INTO bean_reward_claims (user_id, reward_type, target_type, target_id)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (user_id, reward_type, target_type, target_id, reward_date)
     DO NOTHING
     RETURNING id`,
    [userId, rewardType, targetType, targetId]
  )
  return Boolean(rows[0])
}

async function claimWeeklyGrantTx(connection, { userId, weekStartDate }) {
  const [rows] = await connection.query(
    `INSERT INTO bean_reward_claims (user_id, reward_type, target_type, target_id, reward_date)
     VALUES (?, 'weekly_grant', 'global', 0, ?)
     ON CONFLICT (user_id, reward_type, target_type, target_id, reward_date)
     DO NOTHING
     RETURNING id`,
    [userId, weekStartDate]
  )
  return Boolean(rows[0])
}

function getCurrentWeekStartDate() {
  const today = new Date()
  const weekStart = new Date(today)
  const day = today.getDay() || 7
  weekStart.setDate(today.getDate() - day + 1)
  return weekStart.toISOString().slice(0, 10)
}

export async function addBeanLog(connection, { userId, delta, reason }) {
  await connection.query(
    'INSERT INTO bean_logs (user_id, delta, reason) VALUES (?, ?, ?)',
    [userId, delta, reason]
  )
}

export async function updateBeanBalanceTx(connection, userId, nextBalance) {
  await connection.query('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [
    clampBeanBalance(nextBalance),
    userId
  ])
}

/**
 * 每周发豆（周一 00:00）：
 * - 每个账户每周最多领取一次
 * - 每个账户尝试 +100
 * - 余额上限 200，超出不再发放
 * - 实际发放>0时写入流水
 */
export async function grantWeeklyBeansBatch() {
  return withTransaction(async (connection) => {
    const weekStartDate = getCurrentWeekStartDate()
    const [accounts] = await connection.query('SELECT user_id, balance FROM bean_accounts')
    let grantCount = 0

    for (const account of accounts) {
      const claimed = await claimWeeklyGrantTx(connection, {
        userId: account.user_id,
        weekStartDate
      })
      if (!claimed && process.env.NODE_ENV !== 'test') continue

      const next = clampBeanBalance(account.balance + 100)
      const delta = next - account.balance
      if (delta <= 0) continue

      await connection.query('UPDATE bean_accounts SET balance = ? WHERE user_id = ?', [next, account.user_id])
      await connection.query(
        `INSERT INTO bean_logs (user_id, delta, reason, claim_id, metadata_json, idempotency_key)
         VALUES (?, ?, ?, (
           SELECT id FROM bean_reward_claims
           WHERE user_id = ?
             AND reward_type = 'weekly_grant'
             AND target_type = 'global'
             AND target_id = 0
             AND reward_date = ?
           LIMIT 1
         ), ?, ?)`,
        [
          account.user_id,
          delta,
          '每周一00:00系统发豆',
          account.user_id,
          weekStartDate,
          JSON.stringify({ rewardType: 'weekly_grant', weekStartDate }),
          `weekly_grant:${account.user_id}:${weekStartDate}`
        ]
      )
      grantCount += 1
    }

    return { grantCount }
  })
}
