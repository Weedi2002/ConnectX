import mongoose from 'mongoose';
import { sanitize } from '../utils/security.js';

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

chatSchema.pre('save', function (next) {
  if (this.isModified('name')) this.name = sanitize(this.name);
  if (this.isModified('description')) this.description = sanitize(this.description);
  next();
});

export const Chat = mongoose.model('Chat', chatSchema);
