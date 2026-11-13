import { getDb } from './db.js'
import { parseJson } from '../utils/json.js'
import { createNotificationTx } from './notificationModel.js'


function normalizeComment(row) {
  const images = parseJson(row.images_json, [])
  const tags = parseJson(row.tags_json, [])
  const moodTags = parseJson(row.mood_tags_json, [])
  return {
    ...row,
    images: Array.isArray(images) ? images : [],
    tags: Array.isArray(tags) ? tags : [],
    moodTags: Array.isArray(moodTags) ? moodTags : []
  }
}

function matchesProfile(comment, profileTags) {
  if (profileTags.length === 0 || comment.images.length === 0) return false
  const metadata = [...comment.tags, ...comment.moodTags]
  return profileTags.some((tag) => metadata.some((value) => value.includes(tag) || tag.includes(value)))
}

function byLikesAndTime(left, right) {
  const likeDiff = Number(right.like_count || 0) - Number(left.like_count || 0)
  if (likeDiff !== 0) return likeDiff
  return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
}

function sortComments(rows, profileTags) {
  const comments = rows.map(normalizeComment)
  const matching = comments.filter((comment) => matchesProfile(comment, profileTags)).sort(byLikesAndTime)
  const priority = matching.slice(0, 3)
  const priorityIds = new Set(priority.map((comment) => comment.id))
  const remaining = comments.filter((comment) => !priorityIds.has(comment.id)).sort(byLikesAndTime)
  return [...priority, ...remaining]
}


export async function getSpotById(spotId) {
  const [rows] = await getDb().query('SELECT * FROM spots WHERE id = ? LIMIT 1', [spotId])
  return rows[0] || null
}

export async function getSpotList() {
  const [rows] = await getDb().query(
    'SELECT id, name, lat, lng, detail_json, created_at FROM spots ORDER BY id DESC LIMIT 100'
  )
  return rows
}

export async function createCheckin({ userId, spotId, distanceMeter, photos, dryTags, content }) {
  const [rows] = await getDb().query(
    `INSERT INTO checkins (user_id, spot_id, distance_meter, photos_json, dry_tags_json, content)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [userId, spotId, distanceMeter, JSON.stringify(photos), JSON.stringify(dryTags), content || '']
  )
  return rows[0].id
}

export async function countTodayCheckin(userId, spotId) {
  const [rows] = await getDb().query(
    `SELECT COUNT(1) AS c
     FROM checkins
     WHERE user_id = ?
       AND spot_id = ?
       AND created_at >= CURRENT_DATE
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    [userId, spotId]
  )
  return Number(rows[0]?.c || 0)
}

export async function createComment({ userId, spotId, rating, content, images, tags = [], moodTags = [] }) {
  const [rows] = await getDb().query(
    `INSERT INTO comments (user_id, spot_id, rating, content, images_json, tags_json, mood_tags_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [userId, spotId, rating, content, JSON.stringify(images || []), JSON.stringify(tags), JSON.stringify(moodTags)]
  )
  return rows[0].id
}

export async function countTodayComment(userId, spotId) {
  const [rows] = await getDb().query(
    `SELECT COUNT(1) AS c
     FROM comments
     WHERE user_id = ?
       AND spot_id = ?
       AND created_at >= CURRENT_DATE
       AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    [userId, spotId]
  )
  return Number(rows[0]?.c || 0)
}

export async function getComments(spotId, { profileTags = [] } = {}) {
  const [rows] = await getDb().query(
    `SELECT id, user_id, rating, content, images_json, tags_json, mood_tags_json, like_count, created_at
     FROM comments
     WHERE spot_id = ?
     ORDER BY created_at DESC`,
    [spotId]
  )
  return sortComments(rows, profileTags)
}

export async function likeCommentTx(connection, { userId, spotId, commentId }) {
  const [commentRows] = await connection.query(
    `SELECT id, user_id, like_count
     FROM comments
     WHERE id = ? AND spot_id = ?
     LIMIT 1
     FOR UPDATE`,
    [commentId, spotId]
  )
  const comment = commentRows[0]
  if (!comment) return null

  const [likeRows] = await connection.query(
    `INSERT INTO comment_likes (user_id, comment_id)
     VALUES (?, ?)
     ON CONFLICT (comment_id, user_id) DO NOTHING
     RETURNING id`,
    [userId, commentId]
  )
  if (!likeRows[0]) return { like_count: comment.like_count }

  const [updatedRows] = await connection.query(
    `UPDATE comments
     SET like_count = like_count + 1
     WHERE id = ? AND spot_id = ?
     RETURNING like_count`,
    [commentId, spotId]
  )

  if (Number(comment.user_id) !== Number(userId)) {
    await createNotificationTx(connection, {
      recipientUserId: comment.user_id,
      actorUserId: userId,
      notificationType: 'comment_like',
      title: '你的评论收到点赞',
      content: '有人点赞了你的景点评论',
      payload: { spotId, commentId },
      dedupeKey: `comment_like:${commentId}:${userId}`
    })
  }

  return updatedRows[0] || null
}

export async function incrementCommentLike({ spotId, commentId }) {
  const [rows] = await getDb().query(
    `UPDATE comments
     SET like_count = like_count + 1
     WHERE id = ? AND spot_id = ?
     RETURNING like_count`,
    [commentId, spotId]
  )
  return rows[0] || null
}

export async function favoriteSpot(userId, spotId) {
  const [rows] = await getDb().query(
    `INSERT INTO spot_favorites (user_id, spot_id)
     VALUES (?, ?)
     ON CONFLICT (user_id, spot_id) DO NOTHING
     RETURNING id`,
    [userId, spotId]
  )
  return rows[0] || null
}
