import { User } from '../src/models/User.js';
import { connectTestDB, disconnectTestDB, clearDB } from './setup.js';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearDB();
});

describe('User Model', () => {
  it('should create a new user with hashed password', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.password).not.toBe('password123');
    expect(user.password.length).toBeGreaterThan(10);
  });

  it('should compare passwords correctly', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    const found = await User.findById(user._id).select('+password');
    expect(await found.comparePassword('password123')).toBe(true);
    expect(await found.comparePassword('wrongpassword')).toBe(false);
  });

  it('should sanitize XSS in username', async () => {
    const user = await User.create({
      username: '<script>alert(1)</script>test',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user.username).not.toContain('<script>');
    expect(user.username).not.toContain('</script>');
  });

  it('should sanitize XSS in bio', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      bio: '<img src=x onerror=alert(1)>Hello',
    });

    expect(user.bio).not.toContain('<img');
    expect(user.bio).toBe('Hello');
  });

  it('should enforce unique username', async () => {
    await User.create({
      username: 'testuser',
      email: 'test1@example.com',
      password: 'password123',
    });

    await expect(
      User.create({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow();
  });

  it('should return safe JSON without sensitive fields', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    const safe = user.toSafeJSON();
    expect(safe.password).toBeUndefined();
    expect(safe.emailVerifyToken).toBeUndefined();
    expect(safe.failedLoginAttempts).toBeUndefined();
  });
});
