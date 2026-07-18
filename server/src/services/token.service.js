import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';

export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId, { userAgent = '', ip = '' } = {}) {
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    userAgent,
    ip,
    expiresAt,
  });
  return { refreshToken, expiresAt };
}

export async function rotateSession(oldToken, meta) {
  const session = await Session.findOne({ tokenHash: hashToken(oldToken) });
  if (!session || session.expiresAt < new Date()) return null;
  const userId = session.user;
  await session.deleteOne();
  const created = await createSession(userId, meta);
  return { userId, ...created };
}

export async function revokeSession(token) {
  if (!token) return;
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  path: '/api/auth',
});
