import axios from 'axios';
import { getAccessToken, setAccessToken } from './token.js';

const baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

export { setAccessToken };

export const searchApi = {
  global: (q, type = 'all') => api.get('/chats/search', { params: { q, type } }),
  recent: () => api.get('/chats/search/recent'),
  addRecent: (query) => api.post('/chats/search/recent', { query }),
  clearRecent: () => api.delete('/chats/search/recent'),
};

export const chatSettingsApi = {
  all: () => api.get('/chats/settings'),
  update: (chatId, key, value) => api.put(`/chats/${chatId}/settings/${key}`, { value }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  unread: () => api.get('/notifications/unread'),
  markRead: (id) => api.patch(`/notifications/read/${id}`),
  markAllRead: () => api.patch('/notifications/read'),
  clear: () => api.delete('/notifications'),
};

export const friendsApi = {
  incoming: () => api.get('/friends'),
  sent: () => api.get('/friends/sent'),
  friends: () => api.get('/friends/friends'),
  blocked: () => api.get('/friends/blocked'),
  send: (userId) => api.post('/friends', { userId }),
  accept: (id) => api.post(`/friends/${id}/accept`),
  reject: (id) => api.post(`/friends/${id}/reject`),
  cancel: (id) => api.delete(`/friends/${id}`),
  block: (userId) => api.post('/friends/block', { userId }),
  unblock: (id) => api.delete(`/friends/block/${id}`),
};

export const usersApi = {
  profile: (id) => api.get(`/users/${id}`),
};

export const aiApi = {
  smartReply: (chatId) => api.post('/ai/smart-reply', { chatId }),
  summarize: (chatId) => api.post('/ai/summarize', { chatId }),
  translate: (text, target) => api.post('/ai/translate', { text, target }),
};

let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh').then((r) => r.data.accessToken);
        const token = await refreshing;
        refreshing = null;
        setAccessToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (err) {
        refreshing = null;
        onUnauthorized?.();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  },
);
