import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true },
);

chatSchema.index({ members: 1, updatedAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
