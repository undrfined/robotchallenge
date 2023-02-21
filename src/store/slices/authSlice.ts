import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppThunkApi } from '../index';
import makeRequest, { ResultType } from '../../api/makeRequest';
import { AuthRequest, LogOutRequest } from '../../api/methods/auth';
import { GetUserRequest } from '../../api/methods/users';
import { ApiUser } from '../../api/types';

type AuthState = {
  user?: ApiUser;
};

const initialState: AuthState = {
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
    builder.addCase(getUserInfo.fulfilled, (state, action) => {
      state.user = action.payload;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.user = undefined;
    });
  },
});

export default authSlice.reducer;
