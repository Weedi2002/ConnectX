import { emailQueue, emailWorker } from './email.queue.js';
import { notificationQueue, notificationWorker } from './notification.queue.js';
import { mediaQueue, mediaWorker } from './media.queue.js';
import { logger } from '../config/logger.js';

/**
 * Workers are instantiated on import of the queue modules.
 * initQueues() is a no-op hook kept for symmetry / future warm-up.
 */
export async function initQueues() {
  logger.info('Job queues initialized (email, notification, media)');
}

export async function closeQueues() {
  await Promise.allSettled([
    emailWorker.close(),
    notificationWorker.close(),
    mediaWorker.close(),
    emailQueue.close(),
    notificationQueue.close(),
    mediaQueue.close(),
  ]);
  logger.info('Job queues closed');
}
