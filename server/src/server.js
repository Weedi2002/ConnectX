import http from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { initSentry } from './config/sentry.js';
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { createApp } from './app.js';
import { initSocket } from './sockets/index.js';

async function start() {
  initSentry();

  await connectDB();
  await connectRedis();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = await initSocket(httpServer);
  app.set('io', io);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    httpServer.close();
    await disconnectRedis().catch(() => {});
    await disconnectDB().catch(() => {});
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
