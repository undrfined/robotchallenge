import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

const selectSelf = (state: RootState) => state.games;
export const selectGames = createSelector(selectSelf, (state) => state.games);
export const selectGame = (gameId: string) => createSelector(selectGames, (games) => games[gameId]);
export const selectGameConfig = (gameId: string) => createSelector(selectGame(gameId), (game) => game.gameConfig);
export const selectGameCategoryId = (gameId: string) => createSelector(selectGame(gameId), (game) => game.categoryId);
export const selectGameMapStates = (gameId: string) => createSelector(selectGame(gameId), (game) => game.mapStates);
export const selectPlayers = (gameId: string) => (state: RootState) => {
  return Object.values(selectGame(gameId)(state).players).map((playerId) => state.users.users[playerId]);
};
