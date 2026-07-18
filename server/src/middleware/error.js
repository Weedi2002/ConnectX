import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { isProd } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err instanceof MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 25MB)' : err.message;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already in use`;
  }

  if (status >= 500) logger.error({ err }, 'Server error');

  res.status(status).json({
    error: message,
    ...(details ? { details } : {}),
    ...(isProd ? {} : { stack: status >= 500 ? err.stack : undefined }),
  });
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Not Found' });
}
