import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiCategory } from '../../api/types';
import type { AppThunkApi } from '../index';
import type { ParamsType } from '../../api/makeRequest';
import { GetCategories, PostCategory } from '../../api/methods/categories';
import { api } from '../thunks/apiThunks';

export type CategoryId = number;

type CategoriesState = {
  categories: ApiCategory[];
};

const initialState: CategoriesState = {
  categories: [
    {
      id: 0,
      icon: 'Robot',
      name: 'Robot Challenge',
      description: 'Game with standard rules. 50 rounds, 100 max robots, 100ms per move.',
      descriptionShort: 'Game with standard rules.',
      maxPoints: 10,
      createdAt: '',
      updatedAt: '',
      gameConfig: {
        width: 16,
        roundsCount: 50,
        playersCount: 0, // algos.length,
        initialRobotsCount: 10,
        startEnergy: 50,
        rngSeed: 123,
        energyStationsPerRobot: 2,
        energyLossToCloneRobot: 10,
        maxRobotsCount: 50,
        timeout: 1000,
        maxTimeoutsCount: 5,
        energyCollectDistance: 2,
      },
    },
    {
      id: 1,
      icon: 'Lightning',
      name: 'Blitz',
      description: 'All the same as the standard game, but you only have 15ms to make your move.',
      descriptionShort: 'All the same as the standard game, but you only have 15ms to make your move.',
      maxPoints: 15,
      createdAt: '',
      updatedAt: '',
      gameConfig: {
        width: 16,
        roundsCount: 50,
        playersCount: 0, // algos.length,
        initialRobotsCount: 10,
        startEnergy: 50,
        rngSeed: 123,
        energyStationsPerRobot: 2,
        energyLossToCloneRobot: 10,
        maxRobotsCount: 50,
        timeout: 1000,
        maxTimeoutsCount: 5,
        energyCollectDistance: 2,
      },
    },
    {
      id: 2,
      icon: 'Crown',
      name: 'Battle Royale',
      description: 'The last standing robot wins. You can clone at maximum 25 robots',
      descriptionShort: 'The last standing robot wins.',
      maxPoints: 25,
      createdAt: '',
      updatedAt: '',
      gameConfig: {
        width: 16,
        roundsCount: 50,
        playersCount: 0, // algos.length,
        initialRobotsCount: 10,
        startEnergy: 50,
        rngSeed: 123,
        energyStationsPerRobot: 2,
        energyLossToCloneRobot: 10,
        maxRobotsCount: 50,
        timeout: 1000,
        maxTimeoutsCount: 5,
        energyCollectDistance: 2,
      },
    },
  ],
};

export const fetchCategories = createAsyncThunk<
ApiCategory[],
void,
AppThunkApi
>(
  'categories/fetchCategories',
  async (_, { dispatch }) => {
    return api(dispatch, new GetCategories());
  },
);

export const addCategory = createAsyncThunk<
ApiCategory,
ParamsType<PostCategory>,
AppThunkApi
>(
  'categories/addCategory',
  async ({ newCategory }, { dispatch }) => {
    return api(dispatch, new PostCategory(newCategory));
  },
);

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {

  },
  extraReducers: (builder) => {
    builder.addCase(fetchCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    builder.addCase(addCategory.fulfilled, (state, action) => {
      state.categories.push(action.payload);
    });
  },
});

export default categoriesSlice.reducer;
