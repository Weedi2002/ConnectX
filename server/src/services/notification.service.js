import { Notification } from '../models/Notification.js';

/**
 * Persist + emit a notification to one or more recipient users.
 * @param {object} req - express request (for io accessor)
 * @param {Array<string>} recipientIds - user ids to notify
 * @param {object} data - { type, chat, actor, payload }
 */
export async function notify(req, recipientIds, data) {
  const io = req.app.get('io');
  const ids = Array.from(new Set(recipientIds.map(String))).filter(Boolean);
  if (ids.length === 0) return;

  const docs = ids.map((userId) => ({
    user: userId,
    type: data.type,
    chat: data.chat,
    actor: data.actor,
    payload: data.payload || {},
  }));

  try {
    const created = await Notification.insertMany(docs);
    created.forEach((n) => {
      io?.to(`user:${n.user}`).emit('notification:new', {
        notification: {
          _id: n._id,
          type: n.type,
          chat: n.chat,
          actor: n.actor,
          payload: n.payload,
          read: false,
          createdAt: n.createdAt,
        },
      });
    });
  } catch (err) {
    req.app.get('logger')?.error?.({ err }, 'notify failed');
  }
}
