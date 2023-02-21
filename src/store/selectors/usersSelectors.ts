import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectSelf = (state: RootState) => state.users;
export const selectUsers = createSelector(selectSelf, (state) => state.users);
export const selectUser = (userId: string) => createSelector(selectUsers, (users) => users[userId]);
