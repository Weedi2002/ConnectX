import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('theme') || 'dark';

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: stored },
  reducers: {
    setTheme(state, action) {
      state.mode = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.mode);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
