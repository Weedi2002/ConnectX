import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';
import { SocketRateLimiter } from '../middleware/socketRateLimit.js';

const limiter = new SocketRateLimiter({ windowMs: 10_000, max: 15 });

setInterval(() => limiter.cleanup(), 60_000);

function rateLimit(socket, event) {
  if (!limiter.consume(socket.userId, event)) {
    socket.emit('error', { message: 'Rate limit exceeded' });
    return true;
  }
  return false;
}

async function isMember(userId, chatId) {
  if (!chatId) return false;
  const chat = await Chat.findOne({ _id: chatId, members: userId }).select('_id');
  return !!chat;
}

export function registerChatHandlers(io, socket) {
  const { userId } = socket;

  socket.on('chat:join', async (chatId) => {
    if (rateLimit(socket, 'chat:join')) return;
    if (!chatId) return;
    if (!(await isMember(userId, chatId))) return;
    socket.join(`chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId) => {
    if (rateLimit(socket, 'chat:leave')) return;
    if (chatId) socket.leave(`chat:${chatId}`);
  });

  socket.on('typing:start', async ({ chatId }) => {
    if (rateLimit(socket, 'typing')) return;
    if (!(await isMember(userId, chatId))) return;
    socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId, user: socket.user });
  });

  socket.on('typing:stop', ({ chatId }) => {
    if (rateLimit(socket, 'typing')) return;
    socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
  });

  socket.on('message:delivered', async ({ chatId }) => {
    if (rateLimit(socket, 'message:delivered')) return;
    if (!chatId) return;
    if (!(await isMember(userId, chatId))) return;
    await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, status: 'sent' },
      { $set: { status: 'delivered' } },
    );
    socket.to(`chat:${chatId}`).emit('message:delivered', { chatId, userId });
  });

  socket.on('message:read', async ({ chatId }) => {
    if (rateLimit(socket, 'message:read')) return;
    if (!chatId) return;
    if (!(await isMember(userId, chatId))) return;
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId }, $set: { status: 'read' } },
    );
    socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId });
  });
}
