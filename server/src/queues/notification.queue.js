import { Queue, Worker } from 'bullmq';
import { getQueueConnection } from './connection.js';
import { logger } from '../config/logger.js';
import { Notification } from '../models/Notification.js';
import { getIO } from '../sockets/realtime.js';

export const notificationQueue = new Queue('notification', { connection: getQueueConnection() });

export function addNotificationJob(recipientIds, data) {
  return notificationQueue.add('notify', { recipientIds, data }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 200,
    removeOnFail: 200,
  });
}

export const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { recipientIds, data } = job.data;
    const io = getIO();
    const ids = Array.from(new Set(recipientIds.map(String))).filter(Boolean);
    if (ids.length === 0) return;

    const docs = ids.map((userId) => ({
      user: userId,
      type: data.type,
      chat: data.chat,
      actor: data.actor,
      payload: data.payload || {},
    }));

    const created = await Notification.insertMany(docs);
    created.forEach((n) => {
      io?.to(`user:${n.user}`).emit('notification:new', {
        notification: {
          _id: n._id,
          type: n.type,
          chat: n.chat,
          actor: n.actor,
          payload: n.payload,
          read: false,
          createdAt: n.createdAt,
        },
      });
    });
  },
  { connection: getQueueConnection().duplicate(), concurrency: 8 },
);

notificationWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'notification job failed'),
);
