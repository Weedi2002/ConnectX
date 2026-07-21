import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sanitize } from '../utils/security.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    bio: { type: String, default: '', maxlength: 200 },
    status: { type: String, default: 'Hey there! I am using ConnectX.' },
    presence: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline',
    },
    lastSeen: { type: Date, default: Date.now },
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },

    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },

    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    blocked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    recentSearches: [
      {
        query: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

userSchema.index({ blocked: 1 });

userSchema.index({ username: 'text', email: 'text' });

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  if (this.isModified('username')) this.username = sanitize(this.username);
  if (this.isModified('bio')) this.bio = sanitize(this.bio);
  if (this.isModified('status')) this.status = sanitize(this.status);
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerifyToken;
  delete obj.emailVerifyExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  return obj;
};

export const User = mongoose.model('User', userSchema);
