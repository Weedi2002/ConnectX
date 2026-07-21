import { Chat } from '../models/Chat.js';
import { User } from '../models/User.js';
import { ChatSettings } from '../models/ChatSettings.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/security.js';
import { notify } from '../services/notification.service.js';
import { uploadBuffer, deleteAsset } from '../services/cloudinary.service.js';

const POPULATE_MEMBERS = { path: 'members', select: 'username avatar presence lastSeen bio' };
const POPULATE_ADMINS = { path: 'admins', select: 'username avatar' };
const POPULATE_LAST = {
  path: 'lastMessage',
  select: 'content sender createdAt attachments status',
};

async function populateChat(chat) {
  return chat.populate([POPULATE_MEMBERS, POPULATE_ADMINS, POPULATE_LAST]);
}

function isAdmin(chat, userId) {
  return chat.admins.some((a) => String(a) === String(userId));
}

function otherMembers(chat, exceptId) {
  return (chat.members || []).map(String).filter((id) => id !== String(exceptId));
}

function emitToMembers(req, chat, event, payload) {
  const io = req.app.get('io');
  if (!io) return;
  chat.members.forEach((m) => {
    io.to(`user:${String(m._id || m)}`).emit(event, payload);
  });
}

export const getChats = asyncHandler(async (req, res) => {
  const chats = await Chat.aggregate([
    { $match: { members: req.user._id } },
    {
      $lookup: {
        from: 'chatsettings',
        let: { chatId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ['$chat', '$$chatId'] }, { $eq: ['$user', req.user._id] }],
              },
            },
          },
        ],
        as: 'settings',
      },
    },
    {
      $addFields: {
        settings: {
          $cond: [{ $gt: [{ $size: '$settings' }, 0] }, { $arrayElemAt: ['$settings', 0] }, null],
        },
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  const populated = await Chat.populate(chats, [POPULATE_MEMBERS, POPULATE_ADMINS, POPULATE_LAST]);
  res.json({ chats: populated });
});

export const getChatSettings = asyncHandler(async (req, res) => {
  const settings = await ChatSettings.find({ user: req.user._id });
  const map = {};
  settings.forEach((s) => {
    map[String(s.chat)] = {
      pinned: s.pinned,
      archived: s.archived,
      favorite: s.favorite,
      muted: s.muted,
    };
  });
  res.json({ settings: map });
});

export const updateChatSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  if (!['pinned', 'archived', 'favorite', 'muted'].includes(key)) {
    throw ApiError.badRequest('Invalid setting key');
  }
  const chat = await Chat.findOne({ _id: req.params.id, members: req.user._id });
  if (!chat) throw ApiError.forbidden('Not a member of this chat');

  const value = req.body.value === true;
  const setting = await ChatSettings.findOneAndUpdate(
    { user: req.user._id, chat: req.params.id },
    { [key]: value },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const io = req.app.get('io');
  io?.to(`user:${req.user._id}`).emit('chat:settings', {
    chatId: String(chat._id),
    settings: {
      pinned: setting.pinned,
      archived: setting.archived,
      favorite: setting.favorite,
      muted: setting.muted,
    },
  });

  res.json({
    settings: {
      pinned: setting.pinned,
      archived: setting.archived,
      favorite: setting.favorite,
      muted: setting.muted,
    },
  });
});

export const createOrGetChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (userId === String(req.user._id)) throw ApiError.badRequest('Cannot chat with yourself');

  const other = await User.findById(userId);
  if (!other) throw ApiError.notFound('User not found');

  if (req.user.blocked.some((b) => String(b) === String(userId))) {
    throw ApiError.forbidden('You have blocked this user');
  }
  if (other.blocked.some((b) => String(b) === String(req.user._id))) {
    throw ApiError.forbidden('Cannot message this user');
  }

  const friendship = await FriendRequest.findOne({
    status: 'accepted',
    $or: [
      { sender: req.user._id, recipient: userId },
      { sender: userId, recipient: req.user._id },
    ],
  });
  if (!friendship) {
    throw ApiError.forbidden('You can only message friends. Send a friend request first.');
  }

  let chat = await Chat.findOne({
    isGroup: false,
    members: { $all: [req.user._id, userId], $size: 2 },
  });

  if (!chat) {
    chat = await Chat.create({ isGroup: false, members: [req.user._id, userId] });
  }

  chat = await populateChat(chat);
  res.status(201).json({ chat });
});

export const createGroup = asyncHandler(async (req, res) => {
  const { name, description, memberIds } = req.body;
  const members = Array.from(new Set([...(memberIds || []), String(req.user._id)]));
  if (members.length < 2) throw ApiError.badRequest('A group needs at least 2 members');

  const found = await User.countDocuments({ _id: { $in: members } });
  if (found !== members.length) throw ApiError.badRequest('One or more users not found');

  let chat = await Chat.create({
    isGroup: true,
    name,
    description: description || '',
    members,
    admins: [req.user._id],
    createdBy: req.user._id,
  });

  chat = await populateChat(chat);
  emitToMembers(req, chat, 'chat:new', { chat });
  res.status(201).json({ chat });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');

  const { name, description } = req.body;
  if (name !== undefined) chat.name = name;
  if (description !== undefined) chat.description = description;
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  notify(req, otherMembers(chat, req.user._id), {
    type: 'group_updated',
    chat: chat._id,
    actor: req.user._id,
    payload: { chatName: chat.name },
  });
  res.json({ chat: populated });
});

export const updateGroupAvatar = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const asset = await uploadBuffer(req.file, 'connectx/groups');
  if (chat.avatar?.publicId) await deleteAsset(chat.avatar.publicId, 'image').catch(() => {});
  chat.avatar = { url: asset.url, publicId: asset.publicId };
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  res.json({ chat: populated });
});

export const addMembers = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');

  const { memberIds } = req.body;
  const found = await User.countDocuments({ _id: { $in: memberIds } });
  if (found !== memberIds.length) throw ApiError.badRequest('One or more users not found');

  const before = new Set(chat.members.map(String));
  memberIds.forEach((id) => {
    if (!before.has(String(id))) chat.members.push(id);
  });
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:new', { chat: populated });
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  notify(req, memberIds, {
    type: 'added_to_group',
    chat: chat._id,
    actor: req.user._id,
    payload: { chatName: chat.name },
  });
  res.json({ chat: populated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');

  const { userId } = req.params;
  const removedRoom = `user:${userId}`;
  chat.members = chat.members.filter((m) => String(m) !== String(userId));
  chat.admins = chat.admins.filter((a) => String(a) !== String(userId));
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  req.app.get('io')?.to(removedRoom).emit('chat:removed', { chatId: chat._id });
  res.json({ chat: populated });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!chat.members.some((m) => String(m) === String(req.user._id))) {
    throw ApiError.forbidden('Not a member');
  }

  chat.members = chat.members.filter((m) => String(m) !== String(req.user._id));
  chat.admins = chat.admins.filter((a) => String(a) !== String(req.user._id));
  if (chat.members.length > 0 && chat.admins.length === 0) chat.admins.push(chat.members[0]);

  if (chat.members.length === 0) {
    await chat.deleteOne();
  } else {
    await chat.save();
  }

  const populated = chat.members.length > 0 ? await populateChat(chat) : null;
  if (populated) emitToMembers(req, populated, 'chat:updated', { chat: populated });
  req.app.get('io')?.to(`user:${req.user._id}`).emit('chat:removed', { chatId: chat._id });
  notify(req, otherMembers(chat, req.user._id), {
    type: 'member_left',
    chat: chat._id,
    actor: req.user._id,
    payload: { chatName: chat.name, username: req.user.username },
  });
  res.json({ message: 'Left group' });
});

export const promoteAdmin = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');

  const { userId } = req.params;
  if (!chat.members.some((m) => String(m) === String(userId))) {
    throw ApiError.badRequest('User is not a member');
  }
  if (!isAdmin(chat, userId)) chat.admins.push(userId);
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  res.json({ chat: populated });
});

export const demoteAdmin = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat || !chat.isGroup) throw ApiError.notFound('Group not found');
  if (!isAdmin(chat, req.user._id)) throw ApiError.forbidden('Admins only');

  const { userId } = req.params;
  if (chat.admins.length <= 1) throw ApiError.badRequest('Group must have at least one admin');
  chat.admins = chat.admins.filter((a) => String(a) !== String(userId));
  await chat.save();

  const populated = await populateChat(chat);
  emitToMembers(req, populated, 'chat:updated', { chat: populated });
  res.json({ chat: populated });
});

export const search = asyncHandler(async (req, res) => {
  const q = escapeRegex((req.query.q || '').toString().trim());
  if (!q) return res.json({ users: [], groups: [], messages: [] });

  const limit = Math.min(Number(req.query.limit) || 10, 25);
  const type = (req.query.type || 'all').toString();

  const result = { users: [], groups: [], messages: [] };

  if (type === 'all' || type === 'users') {
    result.users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: q, $options: 'i' },
    })
      .select('username avatar presence')
      .limit(limit);
  }

  if (type === 'all' || type === 'groups') {
    result.groups = await Chat.find({
      isGroup: true,
      members: req.user._id,
      name: { $regex: q, $options: 'i' },
    })
      .select('name avatar isGroup members')
      .limit(limit);
  }

  if (type === 'all' || type === 'messages' || type === 'files') {
    const chatIds = await Chat.distinct('_id', { members: req.user._id });
    const filter = { chat: { $in: chatIds }, deleted: false };
    if (type === 'files') {
      filter['attachments.0'] = { $exists: true };
    } else {
      filter.content = { $regex: q, $options: 'i' };
    }
    const messages = await Message.find(filter)
      .populate('sender', 'username avatar')
      .populate('chat', 'name isGroup')
      .sort({ createdAt: -1 })
      .limit(limit);
    result.messages = messages.map((m) => ({
      _id: m._id,
      content: m.content,
      chat: m.chat,
      sender: m.sender,
      createdAt: m.createdAt,
      attachments: m.attachments,
    }));
  }

  res.json(result);
});

export const addRecentSearch = asyncHandler(async (req, res) => {
  const q = (req.body.query || '').toString().trim();
  if (!q) return res.json({ recentSearches: [] });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { recentSearches: { query: q } } },
    { new: true },
  );

  user.recentSearches.unshift({ query: q, at: new Date() });
  user.recentSearches = user.recentSearches.slice(0, 10);
  await user.save();

  res.json({ recentSearches: user.recentSearches });
});

export const getRecentSearches = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('recentSearches');
  res.json({ recentSearches: user.recentSearches || [] });
});

export const clearRecentSearches = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $set: { recentSearches: [] } });
  res.json({ message: 'Cleared' });
});
