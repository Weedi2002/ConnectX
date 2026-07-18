import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const forgotSchema = z.object({
  body: z.object({ email: z.string().email() }),
});

export const resetSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8).max(72),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({ token: z.string().min(1) }),
});
