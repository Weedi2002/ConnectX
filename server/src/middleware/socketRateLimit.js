/**
 * Simple in-memory rate limiter for Socket.IO events.
 * Tracks events per user per event type with a sliding window.
 */
export class SocketRateLimiter {
  constructor({ windowMs = 10_000, max = 10 } = {}) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }

  _key(userId, event) {
    return `${userId}:${event}`;
  }

  consume(userId, event) {
    const key = this._key(userId, event);
    const now = Date.now();
    let entry = this.hits.get(key);
    if (!entry || now - entry.start > this.windowMs) {
      entry = { start: now, count: 0 };
      this.hits.set(key, entry);
    }
    entry.count++;
    return entry.count <= this.max;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.hits) {
      if (now - entry.start > this.windowMs * 2) this.hits.delete(key);
    }
  }
}
