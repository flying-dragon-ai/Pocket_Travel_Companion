import { getDb } from '../models/db.js'

/**
 * 事务包装：统一 getConnection / beginTransaction / commit / rollback / release。
 *
 * 此前 7 处 controller 与 model 各写一遍同样的样板，任一处漏掉 `release()`
 * 就会耗尽连接池，且回滚语义要靠人肉复制。`work` 抛错时回滚并原样抛出，
 * 调用方仍按业务错误处理。
 */
export async function withTransaction(work) {
  const connection = await getDb().getConnection()
  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
