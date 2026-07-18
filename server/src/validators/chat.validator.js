import { z } from 'zod';

export const createChatSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    chatId: z.string().min(1),
    content: z.string().max(5000).optional().default(''),
    attachments: z.array(z.any()).optional(),
    replyTo: z.string().min(1).optional(),
  }),
});

export const editMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
  }),
});

export const reactMessageSchema = z.object({
  body: z.object({
    emoji: z.string().min(1).max(16),
  }),
});

export const forwardMessageSchema = z.object({
  body: z.object({
    chatId: z.string().min(1),
  }),
});

export const chatSettingSchema = z.object({
  params: z.object({
    key: z.enum(['pinned', 'archived', 'favorite', 'muted']),
  }),
  body: z.object({
    value: z.boolean(),
  }),
});

export const recentSearchSchema = z.object({
  body: z.object({
    query: z.string().min(1).max(100),
  }),
});

export const friendRequestSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const blockUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30).optional(),
    bio: z.string().max(200).optional(),
    status: z.string().max(120).optional(),
    theme: z.enum(['dark', 'light']).optional(),
  }),
});

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60),
    description: z.string().max(300).optional().default(''),
    memberIds: z.array(z.string().min(1)).min(1),
  }),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(60).optional(),
    description: z.string().max(300).optional(),
  }),
});

export const addMembersSchema = z.object({
  body: z.object({
    memberIds: z.array(z.string().min(1)).min(1),
  }),
});
