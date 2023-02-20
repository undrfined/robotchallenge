import { configureStore } from '@reduxjs/toolkit';
import games from './slices/gamesSlice';
import categories from './slices/categoriesSlice';
import auth from './slices/authSlice';

const store = configureStore({
  reducer: {
    games,
    categories,
    auth,
  },
  devTools: true,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type AppThunkApi = {
  dispatch: AppDispatch;
  state: RootState;
};

export default store;
