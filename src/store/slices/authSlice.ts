import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
import type { AppThunkApi } from '../index';
import { AuthRequest, LogOutRequest } from '../../api/methods/auth';
// TODO fix this
// eslint-disable-next-line import/no-cycle
import { getUserById } from './usersSlice';
import { api, apiThunk } from '../thunks/apiThunks';

type AuthState = {
  isLoggingIn: boolean;
  isRedirecting: boolean;
};

const initialState: AuthState = {
  isLoggingIn: false,
  isRedirecting: false,
};

export const login = createAsyncThunk<
void,
void,
AppThunkApi
>(
  'auth/login',
  async (_, { dispatch }) => {
    const result = await api(dispatch, new AuthRequest());

    window.location.href = result.redirectUrl;
  },
);

export const logout = createAsyncThunk<
void,
void,
AppThunkApi
>(
  'auth/logout',
  async (_, { dispatch }) => {
    return api(dispatch, new LogOutRequest());
  },
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
        state.isRedirecting = true;
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false;
        state.isRedirecting = false;
      });

    builder.addCase(getUserById.fulfilled, (state, action) => {
      if (action.meta.arg === undefined) state.isLoggingIn = false;
    });

    builder.addCase(apiThunk.rejected, (state, action) => {
      if (action.error.message === 'Unauthorized') {
        state.isLoggingIn = false;
      }
    });
  },
});

const persistConfig = {
  key: 'auth',
  storage,
  blacklist: ['isRedirecting'],
};

export default persistReducer(persistConfig, authSlice.reducer);
