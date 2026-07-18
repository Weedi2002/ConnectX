import { Notification } from '../models/Notification.js';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const notifications = await Notification.find({ user: req.user._id })
    .populate('actor', 'username avatar')
    .populate('chat', 'name avatar isGroup')
    .sort({ createdAt: -1 })
    .limit(limit);

  const unread = await Notification.countDocuments({ user: req.user._id, read: false });
  res.json({ notifications, unread });
});

export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === 'all') {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    return res.json({ message: 'All read' });
  }
  await Notification.findOneAndUpdate({ _id: id, user: req.user._id }, { $set: { read: true } });
  res.json({ message: 'Read' });
});

export const clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ message: 'Cleared' });
});

export const getUnreadCounts = asyncHandler(async (req, res) => {
  const chats = await Chat.find({ members: req.user._id }).select('_id');
  const counts = {};
  await Promise.all(
    chats.map(async (c) => {
      const n = await Message.countDocuments({
        chat: c._id,
        deleted: false,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      });
      if (n > 0) counts[String(c._id)] = n;
    }),
  );
  res.json({ counts });
});
