import { redis } from '../config/redis.js';
import { User } from '../models/User.js';
import { logger } from '../config/logger.js';

const PRESENCE_KEY = 'presence:online';

async function broadcastPresence(io, userId, presence, lastSeen) {
  io.emit('presence:update', { userId, presence, lastSeen });
}

export function registerPresence(io, socket) {
  const { userId } = socket;

  const setOnline = async () => {
    try {
      await redis.sadd(PRESENCE_KEY, userId);
      await User.findByIdAndUpdate(userId, { presence: 'online', lastSeen: new Date() });
      await broadcastPresence(io, userId, 'online');
    } catch (err) {
      logger.warn({ err }, 'presence setOnline failed');
    }
  };

  socket.on('presence:set', async (state) => {
    const presence = ['online', 'away', 'busy'].includes(state) ? state : 'online';
    await User.findByIdAndUpdate(userId, { presence });
    await broadcastPresence(io, userId, presence);
  });

  socket.on('presence:list', async (cb) => {
    try {
      const ids = await redis.smembers(PRESENCE_KEY);
      cb?.(ids);
    } catch {
      cb?.([]);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      if (sockets.length === 0) {
        const lastSeen = new Date();
        await redis.srem(PRESENCE_KEY, userId);
        await User.findByIdAndUpdate(userId, { presence: 'offline', lastSeen });
        await broadcastPresence(io, userId, 'offline', lastSeen);
      }
      logger.info({ userId }, 'Socket disconnected');
    } catch (err) {
      logger.warn({ err }, 'presence disconnect failed');
    }
  });

  setOnline();
}
