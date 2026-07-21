import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { redis } from '../config/redis.js';
import { verifyAccessToken } from '../services/token.service.js';
import { User } from '../models/User.js';
import { Chat } from '../models/Chat.js';
import { registerPresence } from './presence.js';
import { registerChatHandlers } from './chat.handlers.js';
import { setIO } from './realtime.js';

export async function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  try {
    const pubClient = redis.duplicate();
    const subClient = redis.duplicate();
    pubClient.on('error', (err) => logger.warn({ err }, 'Redis pub client error'));
    subClient.on('error', (err) => logger.warn({ err }, 'Redis sub client error'));
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter enabled');
  } catch (err) {
    logger.warn({ err }, 'Redis adapter unavailable, using in-memory adapter');
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select('username avatar');
      if (!user) return next(new Error('Unauthorized'));
      socket.userId = String(user._id);
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info({ userId: socket.userId }, 'Socket connected');

    socket.join(`user:${socket.userId}`);

    const chats = await Chat.find({ members: socket.userId }).select('_id');
    chats.forEach((c) => socket.join(`chat:${c._id}`));

    registerPresence(io, socket);
    registerChatHandlers(io, socket);
  });

  setIO(io);

  return io;
}
