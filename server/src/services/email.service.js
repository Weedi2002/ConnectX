import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn({ to, subject }, 'SMTP not configured, email not sent (logged only)');
    return;
  }
  await t.sendMail({ from: env.MAIL_FROM, to, subject, html });
}

export function sendVerificationEmail(to, token) {
  const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
  return sendMail({
    to,
    subject: 'Verify your ConnectX account',
    html: `<p>Welcome to ConnectX!</p><p>Verify your email: <a href="${url}">${url}</a></p>`,
  });
}

export function sendResetPasswordEmail(to, token) {
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: 'Reset your ConnectX password',
    html: `<p>Reset your password: <a href="${url}">${url}</a></p><p>This link expires in 1 hour.</p>`,
  });
}
