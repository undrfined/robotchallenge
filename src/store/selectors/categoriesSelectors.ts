import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectSelf = (state: RootState) => state.categories;
export const selectCategories = createSelector(selectSelf, (state) => state.categories);
export const selectCategory = (categoryId: string) => {
  return createSelector(selectCategories, (categories) => categories.find((category) => category.id === categoryId));
};