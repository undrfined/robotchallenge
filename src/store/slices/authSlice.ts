import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
import type { AppThunkApi } from '../index';
import makeRequest from '../../api/makeRequest';
import { AuthRequest, LogOutRequest } from '../../api/methods/auth';
// TODO fix this
// eslint-disable-next-line import/no-cycle
import { getUserById } from './usersSlice';

type AuthState = {
  isLoggingIn: boolean;
};

const initialState: AuthState = {
  isLoggingIn: false,
};

export const login = createAsyncThunk<
void,
void,
AppThunkApi
>(
  'auth/login',
  async () => {
    const result = await makeRequest(new AuthRequest());

    window.location.href = result.redirectUrl;
  },
);

export const logout = createAsyncThunk<
void,
void,
AppThunkApi
>(
  'auth/logout',
  () => {
    return makeRequest(new LogOutRequest());
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
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false;
      });

    builder.addCase(getUserById.fulfilled, (state, action) => {
      if (action.meta.arg === undefined) state.isLoggingIn = false;
    });
  },
});

const persistConfig = {
  key: 'auth',
  storage,
};

export default persistReducer(persistConfig, authSlice.reducer);
