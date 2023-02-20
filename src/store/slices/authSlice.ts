import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AppThunkApi } from '../index';
import makeRequest, { ResultType } from '../../api/makeRequest';
import { AuthRequest } from '../../api/methods/auth';
import { GetUserRequest } from '../../api/methods/users';

type AuthState = {
  token?: string;
  user?: ResultType<GetUserRequest>;
};

const initialState: AuthState = {
  // TODO bs
  token: document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1],
};

export const login = createAsyncThunk<
void,
void,
AppThunkApi
>(
  'auth/addLogs',
  async () => {
    const result = await makeRequest(new AuthRequest());

    window.location.href = result.redirectUrl;
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
  },
});

export default authSlice.reducer;
