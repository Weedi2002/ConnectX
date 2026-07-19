import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api.js';

export const fetchChats = createAsyncThunk('chat/fetchChats', async () => {
  const { data } = await api.get('/chats');
  return data.chats;
});

export const openChat = createAsyncThunk('chat/openChat', async (userId) => {
  const { data } = await api.post('/chats', { userId });
  return data.chat;
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async ({ chatId, before }) => {
  const params = { limit: 30 };
  if (before) params.before = before;
  const { data } = await api.get(`/messages/${chatId}`, { params });
  return { chatId, messages: data.messages, hasMore: data.hasMore, prepend: !!before };
});

export const createGroup = createAsyncThunk('chat/createGroup', async (payload) => {
  const { data } = await api.post('/chats/group', payload);
  return data.chat;
});

export const fetchNotifications = createAsyncThunk('chat/fetchNotifications', async () => {
  const { data } = await api.get('/notifications');
  return data.notifications;
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    chats: [],
    activeChatId: null,
    settingsByChat: {},
    unreadByChat: {},
    notifications: [],
    notificationsLoaded: false,
    messagesByChat: {},
    hasMoreByChat: {},
    typingByChat: {},
    replyToByChat: {},
    loadingChats: false,
    loadingMessages: false,
  },
  reducers: {
    setActiveChat(state, action) {
      state.activeChatId = action.payload;
      if (action.payload) state.unreadByChat[action.payload] = 0;
    },
    addMessage(state, action) {
      const msg = action.payload;
      const chatId = msg.chat;
      if (!state.messagesByChat[chatId]) state.messagesByChat[chatId] = [];
      if (!state.messagesByChat[chatId].some((m) => m._id === msg._id)) {
        state.messagesByChat[chatId].push(msg);
      }
      const chat = state.chats.find((c) => c._id === chatId);
      if (chat) chat.lastMessage = msg;
    },
    removeMessage(state, action) {
      const { messageId } = action.payload;
      for (const id of Object.keys(state.messagesByChat)) {
        state.messagesByChat[id] = state.messagesByChat[id].filter((m) => m._id !== messageId);
      }
    },
    updateMessage(state, action) {
      const msg = action.payload;
      const list = state.messagesByChat[msg.chat];
      if (list) {
        const idx = list.findIndex((m) => m._id === msg._id);
        if (idx !== -1) list[idx] = msg;
      }
    },
    setReplyTo(state, action) {
      const { chatId, message } = action.payload;
      if (message) state.replyToByChat[chatId] = message;
      else delete state.replyToByChat[chatId];
    },
    setTyping(state, action) {
      const { chatId, userId, typing } = action.payload;
      const set = new Set(state.typingByChat[chatId] || []);
      if (typing) set.add(userId);
      else set.delete(userId);
      state.typingByChat[chatId] = [...set];
    },
    setChatSettings(state, action) {
      state.settingsByChat = { ...state.settingsByChat, ...action.payload };
    },
    updateChatSettings(state, action) {
      const { chatId, settings } = action.payload;
      state.settingsByChat[chatId] = settings;
    },
    setUnreadCounts(state, action) {
      state.unreadByChat = action.payload;
    },
    incrementUnread(state, action) {
      const chatId = action.payload;
      state.unreadByChat[chatId] = (state.unreadByChat[chatId] || 0) + 1;
    },
    clearUnread(state, action) {
      const chatId = action.payload;
      if (chatId) state.unreadByChat[chatId] = 0;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
    },
    setNotifications(state, action) {
      state.notifications = action.payload;
      state.notificationsLoaded = true;
    },
    upsertChat(state, action) {
      const chat = action.payload;
      const idx = state.chats.findIndex((c) => c._id === chat._id);
      if (idx === -1) state.chats.unshift(chat);
      else state.chats[idx] = chat;
    },
    removeChat(state, action) {
      const { chatId } = action.payload;
      state.chats = state.chats.filter((c) => c._id !== chatId);
      delete state.messagesByChat[chatId];
      delete state.hasMoreByChat[chatId];
      if (state.activeChatId === chatId) state.activeChatId = null;
    },
    updatePresence(state, action) {
      const { userId, presence, lastSeen } = action.payload;
      state.chats.forEach((chat) => {
        chat.members?.forEach((m) => {
          if (m._id === userId) {
            m.presence = presence;
            if (lastSeen) m.lastSeen = lastSeen;
          }
        });
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loadingChats = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loadingChats = false;
        state.chats = action.payload;
        const map = {};
        action.payload.forEach((c) => {
          if (c.settings) {
            map[c._id] = {
              pinned: !!c.settings.pinned,
              archived: !!c.settings.archived,
              favorite: !!c.settings.favorite,
              muted: !!c.settings.muted,
            };
          }
        });
        state.settingsByChat = map;
      })
      .addCase(fetchChats.rejected, (state) => {
        state.loadingChats = false;
      })
      .addCase(openChat.fulfilled, (state, action) => {
        const chat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === chat._id);
        if (idx === -1) state.chats.unshift(chat);
        state.activeChatId = chat._id;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loadingMessages = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loadingMessages = false;
        const { chatId, messages, hasMore, prepend } = action.payload;
        const existing = state.messagesByChat[chatId] || [];
        state.messagesByChat[chatId] = prepend ? [...messages, ...existing] : messages;
        state.hasMoreByChat[chatId] = hasMore;
      })
      .addCase(fetchMessages.rejected, (state) => {
        state.loadingMessages = false;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        const chat = action.payload;
        const idx = state.chats.findIndex((c) => c._id === chat._id);
        if (idx === -1) state.chats.unshift(chat);
        else state.chats[idx] = chat;
        state.activeChatId = chat._id;
      });
  },
});

export const {
  setActiveChat,
  addMessage,
  removeMessage,
  updateMessage,
  setReplyTo,
  setTyping,
  setChatSettings,
  updateChatSettings,
  setUnreadCounts,
  incrementUnread,
  clearUnread,
  addNotification,
  setNotifications,
  upsertChat,
  removeChat,
  updatePresence,
} = chatSlice.actions;
export default chatSlice.reducer;
