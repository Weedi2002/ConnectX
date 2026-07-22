import request from 'supertest';
import { createApp } from '../src/app.js';
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
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await FriendRequest.deleteMany({});
});

describe('Friend Endpoints', () => {
  describe('POST /api/friends', () => {
    it('should send a friend request', async () => {
      const res = await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      expect(res.status).toBe(201);
    });

    it('should not allow duplicate friend requests', async () => {
      await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      const res = await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/friends/:id/accept', () => {
    it('should accept a friend request', async () => {
      await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      const req = await FriendRequest.findOne({
        sender: user1._id,
        recipient: user2._id,
      });

      const res = await request(app)
        .post(`/api/friends/${req._id}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);

      const updated = await FriendRequest.findById(req._id);
      expect(updated.status).toBe('accepted');
    });
  });

  describe('DELETE /api/friends/:id', () => {
    it('should cancel a pending friend request', async () => {
      await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      const req = await FriendRequest.findOne({
        sender: user1._id,
        recipient: user2._id,
      });

      const res = await request(app)
        .delete(`/api/friends/${req._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);

      const deleted = await FriendRequest.findById(req._id);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/friends/friends', () => {
    it('should list accepted friends', async () => {
      await request(app)
        .post('/api/friends')
        .set('Authorization', `Bearer ${token1}`)
        .send({ userId: user2._id });

      const req = await FriendRequest.findOne({
        sender: user1._id,
        recipient: user2._id,
      });

      await request(app)
        .post(`/api/friends/${req._id}/accept`)
        .set('Authorization', `Bearer ${token2}`);

      const res = await request(app)
        .get('/api/friends/friends')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.friends).toBeDefined();
      expect(res.body.friends.length).toBe(1);
    });
  });
});
