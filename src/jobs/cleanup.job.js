import cron from 'node-cron';
import { BlacklistService } from '#services/blacklist.service';
import { logger } from '#lib/logger';

/**
 * Cron job to clean up expired tokens
 * Runs every day at 2:00 AM
 */
export const tokenCleanupJob = cron.schedule('0 2 * * *', async () => {
  logger.info('Starting token cleanup job...');
  
  try {
    const result = await BlacklistService.cleanupExpiredTokens();
    logger.info({ result }, 'Token cleanup job completed successfully');
  } catch (error) {
    logger.error({ error }, 'Token cleanup job failed');
  }
}, {
  scheduled: false, // Don't start immediately
  timezone: "Europe/Paris"
});

/**
 * Cron job to clean up old login history
 * Runs every week on Sunday at 3:00 AM
 */
export const loginHistoryCleanupJob = cron.schedule('0 3 * * 0', async () => {
  logger.info('Starting login history cleanup job...');
  
  try {
    const count = await BlacklistService.cleanupOldLoginHistory();
    logger.info({ deletedRecords: count }, 'Login history cleanup job completed successfully');
  } catch (error) {
    logger.error({ error }, 'Login history cleanup job failed');
  }
}, {
  scheduled: false,
  timezone: "Europe/Paris"
});

/**
 * Start all cron jobs
 */
export function startJobs() {
  logger.info('Starting cron jobs...');
  tokenCleanupJob.start();
  loginHistoryCleanupJob.start();
  logger.info('Cron jobs started successfully');
}

/**
 * Stop all cron jobs
 */
export function stopJobs() {
  logger.info('Stopping cron jobs...');
  tokenCleanupJob.stop();
  loginHistoryCleanupJob.stop();
  logger.info('Cron jobs stopped');
}

/**
 * Run cleanup manually (for testing or manual execution)
 */
export async function runCleanupManually() {
  logger.info('Running manual cleanup...');
  
  const tokenResult = await BlacklistService.cleanupExpiredTokens();
  const historyCount = await BlacklistService.cleanupOldLoginHistory();
  
  return {
    tokens: tokenResult,
    loginHistoryDeleted: historyCount
  };
}
