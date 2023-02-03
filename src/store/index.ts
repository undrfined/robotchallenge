import { configureStore } from '@reduxjs/toolkit';
import games from './slices/gamesSlice';
import categories from './slices/categoriesSlice';

const store = configureStore({
  reducer: {
    games,
    categories,
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
