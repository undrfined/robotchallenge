import { createSlice } from '@reduxjs/toolkit';
import { LottieIcon } from '../../helpers/lottieIcons';

export type CategoryId = string;

type Category = {
  id: CategoryId;
  icon: LottieIcon;
  title: string;
  description: string;
  maxPoints: number;
};

type CategoriesState = {
  categories: Category[];
};

const initialState: CategoriesState = {
  categories: [
    {
      id: '0',
      icon: 'Robot',
      title: 'Robot Challenge',
      description: 'Game with very standard rules. 50 rounds, 100 max robots, 100ms per move.',
      maxPoints: 10,
    },
    {
      id: '1',
      icon: 'Lightning',
      title: 'Blitz',
      description: 'All the same as the standard game, but you only have 15ms to make your move.',
      maxPoints: 15,
    },
    {
      id: '2',
      icon: 'Crown',
      title: 'Battle Royale',
      description: 'The last standing robot wins. You can clone at maximum 25 robots',
      maxPoints: 25,
    },
  ],
};

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {

  },
});

export default categoriesSlice.reducer;
