import { getDb } from './db.js'
import { stringifyJsonOrNull } from '../utils/json.js'


export async function createShareRecord({ userId, shareType, targetId, shareCode, metadataJson = null, checkinId = null }) {
  const [rows] = await getDb().query(
    `INSERT INTO share_records (user_id, share_type, target_id, share_code, metadata_json, checkin_id)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [userId, shareType, targetId, shareCode, stringifyJsonOrNull(metadataJson), checkinId]
  )
  return rows[0] || null
}

export async function getShareRecordByCode(code) {
  const [rows] = await getDb().query('SELECT * FROM share_records WHERE share_code = ? LIMIT 1', [code])
  return rows[0] || null
}
