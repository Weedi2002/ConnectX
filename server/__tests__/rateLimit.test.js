import { SocketRateLimiter } from '../src/middleware/socketRateLimit.js';

describe('SocketRateLimiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new SocketRateLimiter({ windowMs: 1000, max: 3 });
  });

  it('should allow requests under the limit', () => {
    expect(limiter.consume('user1', 'typing')).toBe(true);
    expect(limiter.consume('user1', 'typing')).toBe(true);
    expect(limiter.consume('user1', 'typing')).toBe(true);
  });

  it('should block requests over the limit', () => {
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    expect(limiter.consume('user1', 'typing')).toBe(false);
  });

  it('should track different events separately', () => {
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    expect(limiter.consume('user1', 'message:read')).toBe(true);
  });

  it('should track different users separately', () => {
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    expect(limiter.consume('user2', 'typing')).toBe(true);
  });

  it('should reset after window expires', async () => {
    limiter = new SocketRateLimiter({ windowMs: 50, max: 2 });
    limiter.consume('user1', 'typing');
    limiter.consume('user1', 'typing');
    expect(limiter.consume('user1', 'typing')).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(limiter.consume('user1', 'typing')).toBe(true);
  });

  it('should cleanup old entries', () => {
    limiter.consume('user1', 'typing');
    // Simulate old entry by setting start to past
    limiter.hits.set('user1:typing', { start: Date.now() - 5000, count: 1 });
    limiter.cleanup();
    expect(limiter.hits.size).toBe(0);
  });
});
