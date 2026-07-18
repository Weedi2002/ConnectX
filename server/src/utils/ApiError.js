export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Bad Request', details) {
    return new ApiError(400, msg, details);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Forbidden') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Not Found') {
    return new ApiError(404, msg);
  }

  static conflict(msg = 'Conflict') {
    return new ApiError(409, msg);
  }

  static tooMany(msg = 'Too Many Requests') {
    return new ApiError(429, msg);
  }
}
