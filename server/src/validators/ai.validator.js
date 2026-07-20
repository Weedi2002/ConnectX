import { z } from 'zod';

export const smartReplySchema = z.object({
  body: z.object({
    chatId: z.string().min(1),
  }),
});

export const summarizeSchema = z.object({
  body: z.object({
    chatId: z.string().min(1),
  }),
});

export const translateSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(5000),
    target: z.string().min(1).max(50).optional(),
  }),
});
