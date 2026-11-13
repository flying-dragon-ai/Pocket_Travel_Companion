export async function createNotificationTx(connection, payload) {
  const {
    recipientUserId,
    actorUserId = null,
    notificationType,
    title,
    content = '',
    payload: payloadData = {},
    dedupeKey
  } = payload

  const notificationPayload = dedupeKey ? { ...payloadData, dedupeKey } : payloadData

  if (dedupeKey) {
    await connection.query('SELECT pg_advisory_xact_lock(hashtext(?))', [dedupeKey])
    const [existingRows] = await connection.query(
      `SELECT id
       FROM notifications
       WHERE recipient_user_id = ?
         AND notification_type = ?
         AND payload_json ->> 'dedupeKey' = ?
       LIMIT 1`,
      [recipientUserId, notificationType, dedupeKey]
    )
    if (existingRows[0]) return existingRows[0]
  }

  const [rows] = await connection.query(
    `INSERT INTO notifications (recipient_user_id, actor_user_id, notification_type, title, content, payload_json)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [recipientUserId, actorUserId, notificationType, title, content, JSON.stringify(notificationPayload)]
  )
  return rows[0]
}
