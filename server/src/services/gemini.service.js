import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const MODEL = env.GEMINI_MODEL || 'gemini-2.5-flash';

let client = null;

function getClient() {
  if (!env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return client;
}

export function isConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}

function model() {
  const c = getClient();
  if (!c) throw new ApiError(503, 'AI is not configured (GEMINI_API_KEY missing)');
  return c.getGenerativeModel({ model: MODEL });
}

function formatMessages(messages) {
  return messages
    .filter((m) => m.content && !m.deleted)
    .map((m) => `${m.sender?.username || 'User'}: ${m.content}`)
    .join('\n');
}

async function generate(m, prompt) {
  try {
    return await m.generateContent(prompt);
  } catch (err) {
    if (err?.message?.includes('429') || err?.status === 429) {
      throw new ApiError(
        429,
        'AI quota exceeded. Please try again later or check your Gemini plan.',
      );
    }
    if (err?.status === 403 || err?.message?.includes('API key')) {
      throw new ApiError(503, 'AI request rejected (check GEMINI_API_KEY).');
    }
    const detail = err?.message ? ` (${err.message.split('\n')[0].slice(0, 200)})` : '';
    throw new ApiError(502, `AI request failed. Please try again.${detail}`);
  }
}

export async function smartReply({ messages }) {
  const m = model();
  const history = formatMessages(messages);
  const prompt =
    'You are a helpful chat assistant. Given the recent conversation below, ' +
    'suggest exactly 3 short, natural reply options the user could send next. ' +
    'Return only the 3 replies, each on its own line, with no numbering or extra text.\n\n' +
    `Conversation:\n${history}`;
  const result = await generate(m, prompt);
  const text = result.response.text().trim();
  return text
    .split('\n')
    .map((l) => l.replace(/^[\d.\-*)\\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function summarize({ messages }) {
  const m = model();
  const history = formatMessages(messages);
  const prompt =
    'Summarize the following conversation concisely in 3-5 bullet points. ' +
    'Focus on key topics, decisions, and questions. Return only the summary.\n\n' +
    `Conversation:\n${history}`;
  const result = await generate(m, prompt);
  return result.response.text().trim();
}

export async function translate({ text, target }) {
  const m = model();
  const lang = target || 'English';
  const prompt =
    `Translate the following message into ${lang}. ` +
    'Return only the translated text, with no quotes or extra commentary.\n\n' +
    `Message:\n${text}`;
  const result = await generate(m, prompt);
  return result.response.text().trim();
}
