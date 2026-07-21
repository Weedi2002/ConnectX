import { Queue, Worker } from 'bullmq';
import { getQueueConnection } from './connection.js';
import { logger } from '../config/logger.js';
import { sendVerificationEmail, sendResetPasswordEmail } from '../services/email.service.js';

export const emailQueue = new Queue('email', { connection: getQueueConnection() });

export function addEmailJob(type, payload) {
  return emailQueue.add(type, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}

export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { type, payload } = job.data;
    if (type === 'verification') {
      await sendVerificationEmail(payload.email, payload.token);
    } else if (type === 'reset-password') {
      await sendResetPasswordEmail(payload.email, payload.token);
    }
  },
  { connection: getQueueConnection().duplicate(), concurrency: 4 },
);

emailWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'email job failed'),
);
