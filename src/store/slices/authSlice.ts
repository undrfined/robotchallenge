import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
import type { AppThunkApi } from '../index';
import makeRequest, { ResultType } from '../../api/makeRequest';
import { AuthRequest, LogOutRequest } from '../../api/methods/auth';
import { GetUserRequest } from '../../api/methods/users';
import { ApiUser } from '../../api/types';

type AuthState = {
  user?: ApiUser;
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

export const getUserInfo = createAsyncThunk<
ResultType<GetUserRequest>,
void,
AppThunkApi
>(
  'users/getUserInfo',
  async () => {
    const result = await makeRequest(new GetUserRequest());

    console.log(result);

    return result;
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

    builder.addCase(getUserInfo.fulfilled, (state, action) => {
      state.user = action.payload;
      state.isLoggingIn = false;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.user = undefined;
    });
  },
});

const persistConfig = {
  key: 'auth',
  storage,
};

export default persistReducer(persistConfig, authSlice.reducer);
