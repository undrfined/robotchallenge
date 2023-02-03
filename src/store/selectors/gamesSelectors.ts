import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectSelf = (state: RootState) => state.games;
export const selectGames = createSelector(selectSelf, (state) => state.games);
export const selectGame = (gameId: string) => createSelector(selectGames, (games) => games[gameId]);
