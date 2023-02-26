import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';
import type { AppThunkApi } from '../index';
import makeRequest, { ResultType } from '../../api/makeRequest';
import { ApiUser } from '../../api/types';
import { GetUserRequest } from '../../api/methods/users';
// TODO fix this
// eslint-disable-next-line import/no-cycle
import { logout } from './authSlice';
import { attachToUserGroup } from './userGroupsSlice';

type UsersState = {
  users: Record<string, ApiUser>,
  currentUserId?: string;
};

const initialState: UsersState = {
  users: {},
};

export const getUserById = createAsyncThunk<
ResultType<GetUserRequest>,
string | undefined,
AppThunkApi
>(
  'users/getUserById',
  async (userId) => {
    return makeRequest(new GetUserRequest(userId));
  },
);

export const usersReducer = createSlice({
  name: 'users',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserById.pending, () => {
        // state.isLoggingIn = true;
      })
      .addCase(getUserById.rejected, () => {
        // state.isLoggingIn = false;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.users[action.payload.id] = action.payload;
        if (!state.currentUserId && action.meta.arg === undefined) {
          state.currentUserId = action.payload.id;
        }
      });

    builder.addCase(logout.fulfilled, (state) => {
      state.currentUserId = undefined;
    });

    builder.addCase(attachToUserGroup.fulfilled, (state, action) => {
      state.users[action.payload.id] = action.payload;
    });
  },
});

const persistConfig = {
  key: 'users',
  storage,
};

export default persistReducer(persistConfig, usersReducer.reducer);
