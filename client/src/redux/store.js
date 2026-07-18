import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import chatReducer from './chatSlice.js';
import themeReducer from './themeSlice.js';
import friendReducer from './friendSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    theme: themeReducer,
    friend: friendReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
