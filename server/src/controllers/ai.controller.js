import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {
  smartReply as aiSmartReply,
  summarize as aiSummarize,
  translate as aiTranslate,
} from '../services/gemini.service.js';

const SENDER = 'username avatar';

async function assertMember(chatId, userId) {
  const chat = await Chat.findOne({ _id: chatId, members: userId });
  if (!chat) throw ApiError.forbidden('Not a member of this chat');
  return chat;
}

export const smartReply = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  await assertMember(chatId, req.user._id);
  const messages = await Message.find({ chat: chatId, deleted: false })
    .populate('sender', SENDER)
    .sort({ createdAt: -1 })
    .limit(20);
  const suggestions = await aiSmartReply({ messages: messages.reverse() });
  res.json({ suggestions });
});

export const summarize = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  await assertMember(chatId, req.user._id);
  const messages = await Message.find({ chat: chatId, deleted: false })
    .populate('sender', SENDER)
    .sort({ createdAt: -1 })
    .limit(50);
  const summary = await aiSummarize({ messages: messages.reverse() });
  res.json({ summary });
});

export const translate = asyncHandler(async (req, res) => {
  const { text, target } = req.body;
  const translated = await aiTranslate({ text, target });
  res.json({ translated });
});
