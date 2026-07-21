import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex } from '../utils/security.js';
import { uploadBuffer, deleteAsset } from '../services/cloudinary.service.js';

export const searchUsers = asyncHandler(async (req, res) => {
  const q = escapeRegex((req.query.q || '').trim());

  const accepted = await FriendRequest.find({
    status: 'accepted',
    $or: [{ sender: req.user._id }, { recipient: req.user._id }],
  });
  const friendIds = accepted.map((r) =>
    String(r.sender) === String(req.user._id) ? r.recipient : r.sender,
  );

  const pending = await FriendRequest.find({
    status: 'pending',
    $or: [{ sender: req.user._id }, { recipient: req.user._id }],
  });
  const pendingIds = pending.map((r) =>
    String(r.sender) === String(req.user._id) ? r.recipient : r.sender,
  );

  const filter = {
    _id: {
      $ne: req.user._id,
      $nin: [...req.user.blocked, ...friendIds, ...pendingIds],
    },
    blocked: { $ne: req.user._id },
  };
  if (q) {
    filter.$or = [
      { username: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  const users = await User.find(filter).limit(20).select('username avatar bio presence lastSeen');
  res.json({ users });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'username avatar bio status presence lastSeen createdAt',
  );
  if (!user) throw ApiError.notFound('User not found');
  if (req.user.blocked.some((b) => String(b) === String(req.params.id))) {
    throw ApiError.forbidden('You have blocked this user');
  }
  res.json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['username', 'bio', 'status', 'theme'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  }
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

export const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');
  const asset = await uploadBuffer(req.file, 'connectx/avatars');
  if (req.user.avatar?.publicId) {
    await deleteAsset(req.user.avatar.publicId, 'image').catch(() => {});
  }
  req.user.avatar = { url: asset.url, publicId: asset.publicId };
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});
