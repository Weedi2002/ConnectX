import mongoose from 'mongoose';

const chatSettingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    pinned: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    muted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

chatSettingsSchema.index({ user: 1, chat: 1 }, { unique: true });

export const ChatSettings = mongoose.model('ChatSettings', chatSettingsSchema);
