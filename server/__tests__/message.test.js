import request from 'supertest';
import { createApp } from '../src/app.js';
import { Message } from '../src/models/Message.js';
import { FriendRequest } from '../src/models/FriendRequest.js';
import { connectTestDB, disconnectTestDB } from './setup.js';

let app;
let user1, user2, token1, chat;

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
  const token2 = login2.body.accessToken;

  await request(app)
    .post('/api/friends')
    .set('Authorization', `Bearer ${token1}`)
    .send({ userId: user2._id });

  const pending = await FriendRequest.findOne({ sender: user1._id, recipient: user2._id });
  await request(app)
    .post(`/api/friends/${pending._id}/accept`)
    .set('Authorization', `Bearer ${token2}`);

  const chatRes = await request(app)
    .post('/api/chats')
    .set('Authorization', `Bearer ${token1}`)
    .send({ userId: user2._id });
  chat = chatRes.body.chat;
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await Message.deleteMany({});
});

describe('Message Endpoints', () => {
  describe('POST /api/messages', () => {
    it('should send a message', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: 'Hello!' });

      expect(res.status).toBe(201);
      expect(res.body.message.content).toBe('Hello!');
      expect(res.body.message.chat).toBe(chat._id);
    });

    it('should sanitize XSS in message content', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: '<script>alert(1)</script>Hello' });

      expect(res.status).toBe(201);
      expect(res.body.message.content).not.toContain('<script>');
    });

    it('should reject empty content without attachments', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: '' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/messages/:chatId', () => {
    it('should get messages for a chat', async () => {
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: 'Test message' });

      const res = await request(app)
        .get(`/api/messages/${chat._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.messages).toBeDefined();
      expect(res.body.messages.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /api/messages/:id', () => {
    it('should edit a message', async () => {
      const sendRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: 'Original' });

      const msgId = sendRes.body.message._id;

      const res = await request(app)
        .patch(`/api/messages/${msgId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ content: 'Edited' });

      expect(res.status).toBe(200);
      expect(res.body.message.content).toBe('Edited');
      expect(res.body.message.edited).toBe(true);
    });
  });

  describe('POST /api/messages/:id/react', () => {
    it('should toggle a reaction', async () => {
      const sendRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${token1}`)
        .send({ chatId: chat._id, content: 'React to me' });

      const msgId = sendRes.body.message._id;

      const res = await request(app)
        .post(`/api/messages/${msgId}/react`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);
      expect(res.body.message.reactions.length).toBe(1);
      expect(res.body.message.reactions[0].emoji).toBe('👍');
    });
  });
});
