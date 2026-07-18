import { Message } from '../models/Message.js';
import { Chat } from '../models/Chat.js';

export function registerChatHandlers(io, socket) {
  const { userId } = socket;

  socket.on('chat:join', (chatId) => {
    if (chatId) socket.join(`chat:${chatId}`);
  });

  socket.on('chat:leave', (chatId) => {
    if (chatId) socket.leave(`chat:${chatId}`);
  });

  socket.on('typing:start', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:start', { chatId, userId, user: socket.user });
  });

  socket.on('typing:stop', ({ chatId }) => {
    socket.to(`chat:${chatId}`).emit('typing:stop', { chatId, userId });
  });

  socket.on('message:delivered', async ({ chatId }) => {
    if (!chatId) return;
    await Message.updateMany(
      { chat: chatId, sender: { $ne: userId }, status: 'sent' },
      { $set: { status: 'delivered' } },
    );
    socket.to(`chat:${chatId}`).emit('message:delivered', { chatId, userId });
  });

  socket.on('message:read', async ({ chatId }) => {
    if (!chatId) return;
    const chat = await Chat.findOne({ _id: chatId, members: userId }).select('_id');
    if (!chat) return;
    await Message.updateMany(
      { chat: chatId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId }, $set: { status: 'read' } },
    );
    socket.to(`chat:${chatId}`).emit('message:read', { chatId, userId });
  });
}
