import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { friendsApi } from '../services/api.js';

export const fetchIncoming = createAsyncThunk('friend/fetchIncoming', async () => {
  const { data } = await friendsApi.incoming();
  return data.requests;
});

export const fetchSent = createAsyncThunk('friend/fetchSent', async () => {
  const { data } = await friendsApi.sent();
  return data.requests;
});

export const fetchBlocked = createAsyncThunk('friend/fetchBlocked', async () => {
  const { data } = await friendsApi.blocked();
  return data.users;
});

export const sendRequest = createAsyncThunk('friend/sendRequest', async (userId) => {
  const { data } = await friendsApi.send(userId);
  return data.request;
});

export const acceptRequest = createAsyncThunk('friend/acceptRequest', async (id) => {
  await friendsApi.accept(id);
  return id;
});

export const rejectRequest = createAsyncThunk('friend/rejectRequest', async (id) => {
  await friendsApi.reject(id);
  return id;
});

export const cancelRequest = createAsyncThunk('friend/cancelRequest', async (id) => {
  await friendsApi.cancel(id);
  return id;
});

export const blockUser = createAsyncThunk('friend/blockUser', async (userId) => {
  await friendsApi.block(userId);
  return userId;
});

export const unblockUser = createAsyncThunk('friend/unblockUser', async (id) => {
  await friendsApi.unblock(id);
  return id;
});

export const fetchFriends = createAsyncThunk('friend/fetchFriends', async () => {
  const { data } = await friendsApi.friends();
  return data.friends;
});

const friendSlice = createSlice({
  name: 'friend',
  initialState: {
    incoming: [],
    sent: [],
    friends: [],
    blocked: [],
    loading: false,
    unread: 0,
  },
  reducers: {
    addIncoming(state, action) {
      const exists = state.incoming.some((r) => r._id === action.payload._id);
      if (!exists) state.incoming.unshift(action.payload);
      state.unread = state.incoming.length;
    },
    addSent(state, action) {
      const exists = state.sent.some((r) => r._id === action.payload._id);
      if (!exists) state.sent.unshift(action.payload);
    },
    setUnread(state, action) {
      state.unread = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncoming.fulfilled, (state, action) => {
        state.incoming = action.payload;
        state.unread = action.payload.length;
      })
      .addCase(fetchSent.fulfilled, (state, action) => {
        state.sent = action.payload;
      })
      .addCase(fetchBlocked.fulfilled, (state, action) => {
        state.blocked = action.payload;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload;
      })
      .addCase(sendRequest.fulfilled, (state, action) => {
        const exists = state.sent.some((r) => r._id === action.payload._id);
        if (!exists) state.sent.unshift(action.payload);
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((r) => r._id !== action.payload);
        state.unread = state.incoming.length;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((r) => r._id !== action.payload);
        state.unread = state.incoming.length;
      })
      .addCase(cancelRequest.fulfilled, (state, action) => {
        state.sent = state.sent.filter((r) => r._id !== action.payload);
      })
      .addCase(blockUser.fulfilled, (state, action) => {
        const userId = String(action.payload);
        const blockedUser =
          state.incoming.find((r) => String(r.sender?._id) === userId)?.sender ||
          state.sent.find((r) => String(r.recipient?._id) === userId)?.recipient;
        state.incoming = state.incoming.filter((r) => String(r.sender?._id) !== userId);
        state.unread = state.incoming.length;
        state.sent = state.sent.filter((r) => String(r.recipient?._id) !== userId);
        if (blockedUser && !state.blocked.some((u) => String(u._id) === userId)) {
          state.blocked.push(blockedUser);
        }
      })
      .addCase(unblockUser.fulfilled, (state, action) => {
        state.blocked = state.blocked.filter((u) => u._id !== action.payload);
      });
  },
});

export const { addIncoming, addSent, setUnread } = friendSlice.actions;
export default friendSlice.reducer;
