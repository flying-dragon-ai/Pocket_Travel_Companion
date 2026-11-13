import { getDb } from './db.js'

export async function findUserByOpenid(openid) {
  const [rows] = await getDb().query('SELECT * FROM users WHERE openid = ? LIMIT 1', [openid])
  return rows[0] || null
}

export async function createUser({ openid, nickname = '旅行搭子', avatarUrl = '' }) {
  const [rows] = await getDb().query(
    'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?) RETURNING id',
    [openid, nickname, avatarUrl]
  )
  return { id: rows[0].id, openid, nickname, avatarUrl }
}

export async function findUserById(userId) {
  const [rows] = await getDb().query(
    'SELECT id, openid, nickname, avatar_url, interest_tags_json, created_at FROM users WHERE id = ? LIMIT 1',
    [userId]
  )
  return rows[0] || null
}

export async function updateUserInterestTags(userId, interestTags) {
  const [rows] = await getDb().query(
    'UPDATE users SET interest_tags_json = ? WHERE id = ? RETURNING id, interest_tags_json',
    [JSON.stringify(interestTags), userId]
  )
  return rows[0] || null
}
