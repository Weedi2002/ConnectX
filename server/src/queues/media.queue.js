import { Queue, Worker } from 'bullmq';
import sharp from 'sharp';
import { getQueueConnection } from './connection.js';
import { logger } from '../config/logger.js';
import { Message } from '../models/Message.js';
import { uploadBuffer } from '../services/cloudinary.service.js';

export const mediaQueue = new Queue('media', { connection: getQueueConnection() });

export function addMediaJob(attachment, messageId) {
  return mediaQueue.add('process', { attachment, messageId }, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 4000 },
    removeOnComplete: 100,
    removeOnFail: 100,
  });
}

export const mediaWorker = new Worker(
  'media',
  async (job) => {
    const { attachment, messageId } = job.data;
    if (!attachment || attachment.type !== 'image' || !attachment.publicId) return;

    const res = await fetch(attachment.url);
    if (!res.ok) throw new Error(`fetch image failed: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const thumb = await sharp(buffer)
      .resize(320, 320, { fit: 'inside' })
      .webp({ quality: 70 })
      .toBuffer();

    const asset = await uploadBuffer(
      { buffer: thumb, mimetype: 'image/webp', originalname: 'thumb.webp', size: thumb.length },
      'connectx/thumbnails',
    );

    await Message.updateOne(
      { _id: messageId, 'attachments.publicId': attachment.publicId },
      { $set: { 'attachments.$.thumbnail': asset.url } },
    );
  },
  { connection: getQueueConnection().duplicate(), concurrency: 2 },
);

mediaWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'media job failed'),
);
