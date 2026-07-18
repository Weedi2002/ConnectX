import * as Sentry from '@sentry/node';
import { env, isProd } from './env.js';
import { logger } from './logger.js';

export function initSentry() {
  if (!env.SENTRY_DSN) {
    logger.debug('Sentry DSN not set, skipping Sentry init');
    return;
  }
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    enabled: isProd,
    tracesSampleRate: 0.1,
  });
  logger.info('Sentry initialized');
}

export { Sentry };
