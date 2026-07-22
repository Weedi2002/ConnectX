import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/authSlice.js';
import chatReducer from '../redux/chatSlice.js';
import themeReducer from '../redux/themeSlice.js';
import friendReducer from '../redux/friendSlice.js';

function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { auth: authReducer, chat: chatReducer, theme: themeReducer, friend: friendReducer },
      preloadedState,
      middleware: (getDefault) => getDefault({ serializableCheck: false }),
    }),
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export default renderWithProviders;
