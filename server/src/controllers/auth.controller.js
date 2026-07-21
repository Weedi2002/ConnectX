import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  createSession,
  rotateSession,
  revokeSession,
  refreshCookieOptions,
} from '../services/token.service.js';
import { addEmailJob } from '../queues/email.queue.js';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function sessionMeta(req) {
  return { userAgent: req.headers['user-agent'] || '', ip: req.ip };
}

function rawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashRaw(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(res, user, req) {
  const accessToken = signAccessToken(user._id);
  const { refreshToken } = await createSession(user._id, sessionMeta(req));
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
}

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) throw ApiError.conflict('Email or username already in use');

  const verifyToken = rawToken();
  const user = await User.create({
    username,
    email,
    password,
    emailVerifyToken: hashRaw(verifyToken),
    emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await addEmailJob('verification', { email, token: verifyToken });

  const accessToken = await issueTokens(res, user, req);
  res.status(201).json({ user: user.toSafeJSON(), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  if (user.isLocked) {
    throw ApiError.tooMany('Account locked. Try again later.');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized('Invalid credentials');
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  const accessToken = await issueTokens(res, user, req);
  res.json({ user: user.toSafeJSON(), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw ApiError.unauthorized('Missing refresh token');

  const rotated = await rotateSession(token, sessionMeta(req));
  if (!rotated) {
    res.clearCookie('refreshToken', refreshCookieOptions());
    throw ApiError.unauthorized('Invalid or expired session');
  }

  const user = await User.findById(rotated.userId);
  if (!user) throw ApiError.unauthorized('User no longer exists');

  res.cookie('refreshToken', rotated.refreshToken, refreshCookieOptions());
  res.json({ user: user.toSafeJSON(), accessToken: signAccessToken(user._id) });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await revokeSession(token);
  res.clearCookie('refreshToken', refreshCookieOptions());
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerifyToken: hashRaw(token),
    emailVerifyExpires: { $gt: new Date() },
  }).select('+emailVerifyToken +emailVerifyExpires');
  if (!user) throw ApiError.badRequest('Invalid or expired verification token');

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();
  res.json({ message: 'Email verified' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    const token = rawToken();
    user.resetPasswordToken = hashRaw(token);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    await addEmailJob('reset-password', { email, token });
  }
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: hashRaw(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  await Session.deleteMany({ user: user._id });
  res.json({ message: 'Password reset successful' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  const match = await user.comparePassword(currentPassword);
  if (!match) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password changed' });
});
