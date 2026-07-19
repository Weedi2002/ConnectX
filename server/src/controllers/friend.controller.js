import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function emitToUser(req, userId, event, payload) {
  req.app.get('io')?.to(`user:${userId}`).emit(event, payload);
}

export const sendRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (String(userId) === String(req.user._id)) {
    throw ApiError.badRequest('Cannot send a request to yourself');
  }

  const recipient = await User.findById(userId);
  if (!recipient) throw ApiError.notFound('User not found');
  if (req.user.blocked.some((b) => String(b) === String(userId))) {
    throw ApiError.forbidden('You have blocked this user');
  }
  if (recipient.blocked.some((b) => String(b) === String(req.user._id))) {
    throw ApiError.forbidden('Cannot send a request to this user');
  }

  const existing = await FriendRequest.findOne({
    sender: req.user._id,
    recipient: userId,
  });
  if (existing) throw ApiError.badRequest('Request already sent');

  const reverse = await FriendRequest.findOne({
    sender: userId,
    recipient: req.user._id,
    status: 'pending',
  });
  if (reverse) throw ApiError.badRequest('This user already sent you a request');

  const request = await FriendRequest.create({ sender: req.user._id, recipient: userId });
  const populated = await request.populate('sender', 'username avatar');
  emitToUser(req, userId, 'friend:request', { request: populated });
  res.status(201).json({ request: populated });
});

export const listIncoming = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({ recipient: req.user._id, status: 'pending' })
    .populate('sender', 'username avatar bio presence')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

export const listSent = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({ sender: req.user._id, status: 'pending' })
    .populate('recipient', 'username avatar bio presence')
    .sort({ createdAt: -1 });
  res.json({ requests });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (String(request.recipient) !== String(req.user._id)) {
    throw ApiError.forbidden('Not authorized');
  }
  request.status = 'accepted';
  await request.save();
  emitToUser(req, request.sender, 'friend:accepted', {
    request: { _id: request._id, recipient: req.user._id },
  });
  res.json({ message: 'Accepted', request });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findById(req.params.id);
  if (!request) throw ApiError.notFound('Request not found');
  if (String(request.recipient) !== String(req.user._id)) {
    throw ApiError.forbidden('Not authorized');
  }
  request.status = 'rejected';
  await request.save();
  res.json({ message: 'Rejected' });
});

export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await FriendRequest.findOne({
    _id: req.params.id,
    sender: req.user._id,
    status: 'pending',
  });
  if (!request) throw ApiError.notFound('Request not found');
  await request.deleteOne();
  res.json({ message: 'Cancelled' });
});

export const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (String(userId) === String(req.user._id)) {
    throw ApiError.badRequest('Cannot block yourself');
  }
  const target = await User.findById(userId);
  if (!target) throw ApiError.notFound('User not found');

  const me = await User.findById(req.user._id);
  if (!me.blocked.some((b) => String(b) === String(userId))) {
    me.blocked.push(userId);
    await me.save();
  }

  await FriendRequest.deleteMany({
    $or: [
      { sender: req.user._id, recipient: userId },
      { sender: userId, recipient: req.user._id },
    ],
  });
  emitToUser(req, userId, 'friend:blocked', { by: String(req.user._id) });
  res.json({ message: 'Blocked' });
});

export const listBlocked = asyncHandler(async (req, res) => {
  const me = await User.findById(req.user._id).populate('blocked', 'username avatar');
  res.json({ users: me.blocked });
});

export const unblockUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { blocked: req.params.id } });
  res.json({ message: 'Unblocked' });
});

export const listFriends = asyncHandler(async (req, res) => {
  const requests = await FriendRequest.find({
    status: 'accepted',
    $or: [{ sender: req.user._id }, { recipient: req.user._id }],
  })
    .populate('sender', 'username avatar presence lastSeen bio')
    .populate('recipient', 'username avatar presence lastSeen bio');

  const friends = requests.map((r) =>
    String(r.sender._id) === String(req.user._id) ? r.recipient : r.sender,
  );
  res.json({ friends });
});
