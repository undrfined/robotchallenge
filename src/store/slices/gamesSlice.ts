import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as Comlink from 'comlink';
import type { AppThunkApi } from '../index';
import { CoreWorkerType } from '../../workers/core.worker';
import { GameConfig, GameMap, GamePlayerActions } from '../../types/gameTypes';
import createUUID, { UUID } from '../../helpers/createUUID';

export type MapState = {
  map: GameMap;
  playerActions: GamePlayerActions[];
};

export type GameState = {
  id: GameId;
  core: CoreWorkerType;
  coreWorker: Worker;
  gameConfig: GameConfig;
  mapStates: MapState[];
};

export type GameId = UUID;
export type GamesState = {
  games: Record<GameId, GameState>;
  isLoading: boolean
};

const initialState: GamesState = {
  games: {},
  isLoading: false,
};

export const startGame = createAsyncThunk<
GameState,
{
  gameConfig: GameConfig;
  algos: Blob[];
},
AppThunkApi
>(
  'games/startGame',
  async ({
    gameConfig, algos,
  }) => {
    const coreWorker = new Worker(new URL('../../workers/core.worker.ts', import.meta.url));
    const core = Comlink.wrap<CoreWorkerType>(coreWorker);

    await core.initCore();

    await core.setLogUpdatedCallback(Comlink.proxy(() => {
      // console.log(owner, log, errorLog);
    }));

    await core.initGame(gameConfig, algos);

    const mapStates = [{
      map: await core.getMap(),
      playerActions: [],
    }];

    return {
      id: createUUID(),
      gameConfig,
      core,
      coreWorker,
      mapStates,
    };
  },
);

type MR = {
  map: GameMap;
  playerActions: GamePlayerActions[];
};

export const doRound = createAsyncThunk<MR, { gameId: GameId; }, AppThunkApi>(
  'games/doRound',
  async ({ gameId }, { getState }) => {
    const game = getState().games.games[gameId];
    if (!game) throw Error('Game not found');

    let resolver: (mr: MR) => void;
    const promise = new Promise<MR>((resolve) => {
      resolver = resolve;
    });

    await game.core.setRoundFinishedCallback(Comlink.proxy((map, playerActions) => {
      resolver({ map, playerActions });
    }));

    await game.core.doRound();

    return promise;
  },
);

export const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(startGame.pending, (state) => {
        if (state.isLoading) throw Error('Game is already loading');
        state.isLoading = true;
      })
      .addCase(startGame.fulfilled, (state, action) => {
        state.isLoading = false;
        state.games[action.payload.id] = action.payload;
      })
      .addCase(startGame.rejected, (state) => {
        // TODO display error
        state.isLoading = false;
      });

    builder
      .addCase(doRound.pending, (state, action) => {
        const game = state.games[action.meta.arg.gameId];
        if (!game) throw Error('Game not found');
      })
      .addCase(doRound.fulfilled, (state, action) => {
        const game = state.games[action.meta.arg.gameId];
        if (!game) throw Error('Game not found');

        const { map, playerActions } = action.payload;

        const other = game.mapStates.slice(0, -1);
        const last = game.mapStates[game.mapStates.length - 1];

        state.games[action.meta.arg.gameId].mapStates = [...other, {
          ...last,
          playerActions,
        }, {
          map,
          playerActions: [],
        }];
      })
      .addCase(doRound.rejected, () => {
        // TODO display error
      });
  },
});

// Action creators are generated for each case reducer function
// export const {} = gamesSlice.actions;

export default gamesSlice.reducer;
