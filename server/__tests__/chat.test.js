import request from 'supertest';
import { createApp } from '../src/app.js';
import { Chat } from '../src/models/Chat.js';
import { FriendRequest } from '../src/models/FriendRequest.js';
import { connectTestDB, disconnectTestDB } from './setup.js';

let app;
let user1, user2, token1, token2;

beforeAll(async () => {
  await connectTestDB();
  app = createApp();

  const res1 = await request(app)
    .post('/api/auth/register')
    .send({ username: 'user1', email: 'user1@test.com', password: 'Password123!' });
  user1 = res1.body.user;
  token1 = res1.body.accessToken;

  const res2 = await request(app)
    .post('/api/auth/register')
    .send({ username: 'user2', email: 'user2@test.com', password: 'Password123!' });
  user2 = res2.body.user;

  const login2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'user2@test.com', password: 'Password123!' });
  token2 = login2.body.accessToken;

  await request(app)
    .post('/api/friends')
    .set('Authorization', `Bearer ${token1}`)
    .send({ userId: user2._id });

  const pending = await FriendRequest.findOne({ sender: user1._id, recipient: user2._id });
  await request(app)
    .post(`/api/friends/${pending._id}/accept`)
    .set('Authorization', `Bearer ${token2}`);
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await Chat.deleteMany({});
});

describe('Chat Endpoints', () => {
  describe('POST /api/chats', () => {
    it('should create a 1-to-1 chat', async () => {
      const res = await request(app)
        .post('/api/chats')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.body.chat).toBeDefined();
    });
  });

  describe('POST /api/chats/group', () => {
    it('should create a group chat', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Test Group', memberIds: [user1._id, user2._id] });

      expect(res.status).toBe(201);
      expect(res.body.chat.isGroup).toBe(true);
      expect(res.body.chat.name).toBe('Test Group');
      expect(res.body.chat.members.length).toBe(2);
    });

    it('should sanitize XSS in group name', async () => {
      const res = await request(app)
        .post('/api/chats/group')
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: '<script>alert(1)</script>Group', memberIds: [user1._id, user2._id] });

      expect(res.status).toBe(201);
      expect(res.body.chat.name).not.toContain('<script>');
    });
  });

  describe('GET /api/chats', () => {
    it('should return user chats', async () => {
      const res = await request(app).get('/api/chats').set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/chats/search', () => {
    it('should search users with escaped regex', async () => {
      const res = await request(app)
        .get('/api/chats/search?q=user2')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
    });

    it('should handle malicious regex without crashing', async () => {
      const res = await request(app)
        .get('/api/chats/search?q=(a%2B)%2B%24')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
    });
  });
});
