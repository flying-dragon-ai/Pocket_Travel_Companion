import cron from 'node-cron'
import { logger } from './logger.js'
import { grantWeeklyBeansBatch } from '../models/beanModel.js'

export function startSchedulers() {
  // 每周一 00:00 发放豆子（Asia/Shanghai）
  cron.schedule(
    '0 0 * * 1',
    async () => {
      try {
        const result = await grantWeeklyBeansBatch()
        logger.info(`[CRON] Weekly bean grant done, accounts=${result.grantCount}`)
      } catch (error) {
        logger.error('[CRON] Weekly bean grant failed', error)
      }
    },
    {
      timezone: 'Asia/Shanghai'
    }
  )

  logger.info('[CRON] schedulers started')
}
