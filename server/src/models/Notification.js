import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['message', 'added_to_group', 'group_updated', 'member_left', 'message_pinned'],
      required: true,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
