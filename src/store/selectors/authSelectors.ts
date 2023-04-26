import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

const selectSelf = (state: RootState) => state.auth;
export const selectIsLoggingIn = createSelector(selectSelf, (state) => state.isLoggingIn);
