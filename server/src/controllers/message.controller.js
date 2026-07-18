import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../services/notification.service.js';

const SENDER = 'username avatar';
const REPLY_POPULATE = {
  path: 'replyTo',
  select: 'content sender attachments deleted',
  populate: { path: 'sender', select: 'username' },
};

async function assertMember(chatId, userId) {
  const chat = await Chat.findOne({ _id: chatId, members: userId });
  if (!chat) throw ApiError.forbidden('Not a member of this chat');
  return chat;
}

function emitToChat(req, chatId, event, payload) {
  req.app.get('io')?.to(`chat:${chatId}`).emit(event, payload);
}

function otherMembers(chat, exceptId) {
  return (chat.members || []).map(String).filter((id) => id !== String(exceptId));
}

async function populateMessage(message) {
  return message.populate([{ path: 'sender', select: SENDER }, REPLY_POPULATE]);
}

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  await assertMember(chatId, req.user._id);

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const before = req.query.before;

  const filter = { chat: chatId, deleted: false };
  if (before) filter.createdAt = { $lt: new Date(before) };

  const messages = await Message.find(filter)
    .populate('sender', SENDER)
    .populate(REPLY_POPULATE)
    .sort({ createdAt: -1 })
    .limit(limit + 1);

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;
  res.json({ messages: page.reverse(), hasMore });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, attachments, replyTo } = req.body;
  if (!content?.trim() && (!attachments || attachments.length === 0)) {
    throw ApiError.badRequest('Message must have content or attachments');
  }
  const chat = await assertMember(chatId, req.user._id);

  if (replyTo) {
    const parent = await Message.findOne({ _id: replyTo, chat: chatId });
    if (!parent) throw ApiError.badRequest('Reply target not found');
  }

  let message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content: content?.trim() || '',
    attachments: attachments || [],
    replyTo: replyTo || undefined,
    readBy: [req.user._id],
  });

  chat.lastMessage = message._id;
  await chat.save();

  message = await populateMessage(message);
  emitToChat(req, chatId, 'message:new', { message });
  notify(req, otherMembers(chat, req.user._id), {
    type: 'message',
    chat: chatId,
    actor: req.user._id,
    payload: { messageId: message._id, content: message.content, sender: message.sender?.username },
  });
  res.status(201).json({ message });
});

export const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) throw ApiError.badRequest('Content is required');

  const message = await Message.findById(req.params.id);
  if (!message || message.deleted) throw ApiError.notFound('Message not found');
  if (String(message.sender) !== String(req.user._id)) {
    throw ApiError.forbidden('Cannot edit this message');
  }

  message.content = content.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const populated = await populateMessage(message);
  emitToChat(req, message.chat, 'message:updated', { message: populated });
  res.json({ message: populated });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) throw ApiError.notFound('Message not found');
  if (String(message.sender) !== String(req.user._id)) {
    throw ApiError.forbidden('Cannot delete this message');
  }
  message.deleted = true;
  message.content = '';
  message.attachments = [];
  message.reactions = [];
  await message.save();

  emitToChat(req, message.chat, 'message:deleted', { messageId: message._id });
  res.json({ message: 'Message deleted' });
});

export const reactMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  if (!emoji) throw ApiError.badRequest('Emoji is required');

  const message = await Message.findById(req.params.id);
  if (!message || message.deleted) throw ApiError.notFound('Message not found');
  await assertMember(message.chat, req.user._id);

  const existing = message.reactions.find(
    (r) => String(r.user) === String(req.user._id) && r.emoji === emoji,
  );
  if (existing) {
    message.reactions = message.reactions.filter(
      (r) => !(String(r.user) === String(req.user._id) && r.emoji === emoji),
    );
  } else {
    message.reactions = message.reactions.filter(
      (r) => String(r.user) !== String(req.user._id),
    );
    message.reactions.push({ user: req.user._id, emoji });
  }
  await message.save();

  const populated = await populateMessage(message);
  emitToChat(req, message.chat, 'message:updated', { message: populated });
  res.json({ message: populated });
});

export const pinMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message || message.deleted) throw ApiError.notFound('Message not found');
  await assertMember(message.chat, req.user._id);

  message.pinned = !message.pinned;
  message.pinnedBy = message.pinned ? req.user._id : undefined;
  message.pinnedAt = message.pinned ? new Date() : undefined;
  await message.save();

  const populated = await populateMessage(message);
  emitToChat(req, message.chat, 'message:updated', { message: populated });
  if (message.pinned) {
    const chat = await Chat.findById(message.chat);
    notify(req, otherMembers(chat, req.user._id), {
      type: 'message_pinned',
      chat: message.chat,
      actor: req.user._id,
      payload: { messageId: message._id, sender: req.user.username, content: message.content },
    });
  }
  res.json({ message: populated });
});

export const getPinned = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  await assertMember(chatId, req.user._id);
  const messages = await Message.find({ chat: chatId, pinned: true, deleted: false })
    .populate('sender', SENDER)
    .sort({ pinnedAt: -1 });
  res.json({ messages });
});

export const bookmarkMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message || message.deleted) throw ApiError.notFound('Message not found');
  await assertMember(message.chat, req.user._id);

  const has = message.bookmarkedBy.some((b) => String(b) === String(req.user._id));
  if (has) {
    message.bookmarkedBy = message.bookmarkedBy.filter(
      (b) => String(b) !== String(req.user._id),
    );
  } else {
    message.bookmarkedBy.push(req.user._id);
  }
  await message.save();
  res.json({ bookmarked: !has, messageId: message._id });
});

export const getBookmarks = asyncHandler(async (req, res) => {
  const messages = await Message.find({ bookmarkedBy: req.user._id, deleted: false })
    .populate('sender', SENDER)
    .populate('chat', 'name isGroup members')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ messages });
});

export const forwardMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const source = await Message.findById(req.params.id);
  if (!source || source.deleted) throw ApiError.notFound('Message not found');
  await assertMember(source.chat, req.user._id);
  const target = await assertMember(chatId, req.user._id);

  let message = await Message.create({
    chat: chatId,
    sender: req.user._id,
    content: source.content,
    attachments: source.attachments,
    forwardedFrom: source.sender,
    readBy: [req.user._id],
  });

  target.lastMessage = message._id;
  await target.save();

  message = await populateMessage(message);
  emitToChat(req, chatId, 'message:new', { message });
  notify(req, otherMembers(target, req.user._id), {
    type: 'message',
    chat: chatId,
    actor: req.user._id,
    payload: { messageId: message._id, content: message.content, sender: message.sender?.username },
  });
  res.status(201).json({ message });
});

export const markRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  await assertMember(chatId, req.user._id);
  await Message.updateMany(
    { chat: chatId, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id }, $set: { status: 'read' } },
  );
  emitToChat(req, chatId, 'message:read', { chatId, userId: req.user._id });
  res.json({ message: 'Marked as read' });
});
