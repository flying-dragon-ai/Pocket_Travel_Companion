import fs from 'node:fs'
import { Pool } from 'pg'
import { logger } from '../utils/logger.js'

let pool

export async function initDb() {
  const dbName = getRequiredEnv('DB_NAME')

  try {
    pool = createPool(dbName)
    await pool.query('SELECT 1')
  } catch (error) {
    await closePool()

    if (error.code !== '3D000') {
      throw error
    }

    await ensureDatabaseExists(dbName)
    pool = createPool(dbName)
    await pool.query('SELECT 1')
  }

  await ensureSchema()
  logger.info('PostgreSQL connected and schema ensured')
}

export function getDb() {
  if (!pool) {
    throw new Error('Database not initialized')
  }
  return {
    query: async (sql, params = []) => {
      const normalized = normalizeSql(sql)
      const result = await pool.query(normalized, params)
      return [result.rows]
    },
    getConnection: async () => {
      const client = await pool.connect()
      return {
        beginTransaction: async () => client.query('BEGIN'),
        commit: async () => client.query('COMMIT'),
        rollback: async () => client.query('ROLLBACK'),
        query: async (sql, params = []) => {
          const normalized = normalizeSql(sql)
          const result = await client.query(normalized, params)
          return [result.rows]
        },
        release: () => client.release()
      }
    }
  }
}

async function ensureSchema() {
  const schemaSql = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf-8')
  await pool.query(schemaSql)
}

async function ensureDatabaseExists(dbName) {
  const bootstrapPool = createPool(process.env.DB_BOOTSTRAP_DATABASE || 'postgres')

  try {
    const check = await bootstrapPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (check.rows.length === 0) {
      await bootstrapPool.query(`CREATE DATABASE "${escapeDatabaseIdentifier(dbName)}"`)
      logger.info(`Database ${dbName} created`)
    }
  } finally {
    await bootstrapPool.end()
  }
}

function createPool(database) {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || undefined,
    database,
    max: 10
  })
}

async function closePool() {
  if (!pool) {
    return
  }

  await pool.end()
  pool = undefined
}

function getRequiredEnv(key) {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} is required`)
  }
  return value
}

function escapeDatabaseIdentifier(value) {
  return value.replace(/"/g, '""')
}

/**
 * 将 MySQL 风格占位符 ? 转换为 PostgreSQL 风格 $1, $2...
 */
function normalizeSql(sql) {
  let index = 0
  return sql.replace(/\?/g, () => `$${++index}`)
}
