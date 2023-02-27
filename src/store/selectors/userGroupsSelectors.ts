import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

const selectSelf = (state: RootState) => state.userGroups;
export const selectUserGroups = createSelector(selectSelf, (state) => state.userGroups);
export const selectUserGroup = (userGroupId: number) => createSelector(selectUserGroups,
  (userGroups) => userGroups.find((userGroup) => userGroup.id === userGroupId));
