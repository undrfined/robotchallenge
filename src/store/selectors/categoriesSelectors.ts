import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { CategoryId } from '../slices/categoriesSlice';

const selectSelf = (state: RootState) => state.categories;
export const selectCategories = createSelector(selectSelf, (state) => state.categories);
export const selectCategory = (categoryId: CategoryId) => {
  return createSelector(selectCategories, (categories) => categories.find((category) => category.id === categoryId));
};
