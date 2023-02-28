import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiUser, ApiUserGroup } from '../../api/types';
import type { AppThunkApi } from '../index';
import type { ParamsType, ResultType } from '../../api/makeRequest';
import { AttachToUserGroup, GetUserGroups, PostUserGroup } from '../../api/methods/userGroups';
import { api } from '../thunks/apiThunks';

type UserGroupsState = {
  userGroups: ApiUserGroup[];
};

const initialState: UserGroupsState = {
  userGroups: [],
};

export const fetchUserGroups = createAsyncThunk<
ResultType<GetUserGroups>,
void,
AppThunkApi
>(
  'userGroups/fetchUserGroups',
  (_, { dispatch }) => {
    return api(dispatch, new GetUserGroups());
  },
);

export const addUserGroup = createAsyncThunk<
ApiUserGroup,
ParamsType<PostUserGroup>,
AppThunkApi
>(
  'userGroups/addUserGroup',
  async ({ newUserGroup }, { dispatch }) => {
    return api(dispatch, new PostUserGroup(newUserGroup));
  },
);

export const attachToUserGroup = createAsyncThunk<
ApiUser,
number,
AppThunkApi
>(
  'userGroups/attachUserToGroup',
  async (userGroupId, { dispatch }) => {
    return api(dispatch, new AttachToUserGroup(userGroupId));
  },
);

export const userGroupsSlice = createSlice({
  name: 'userGroups',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder.addCase(fetchUserGroups.fulfilled, (state, action) => {
      state.userGroups = action.payload;
    });

    builder.addCase(addUserGroup.fulfilled, (state, action) => {
      state.userGroups.push(action.payload);
    });
  },
});

export default userGroupsSlice.reducer;
