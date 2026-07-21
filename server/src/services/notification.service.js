import { logger } from '../config/logger.js';
import { addNotificationJob } from '../queues/notification.queue.js';

/**
 * Enqueue a notification job. Real delivery (DB persistence + socket emit)
 * happens asynchronously in the notification worker.
 * @param {object} req - express request (retained for signature compatibility)
 * @param {Array<string>} recipientIds - user ids to notify
 * @param {object} data - { type, chat, actor, payload }
 */
export function notify(req, recipientIds, data) {
  return addNotificationJob(recipientIds, data).catch((err) =>
    logger.error({ err }, 'notify enqueue failed'),
  );
}
