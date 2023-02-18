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

export type PlayerId = number;

export type Log = {
  owner: PlayerId;
  log: string;
  errorLog: string;
};

export type GameState = {
  id: GameId;
  core: CoreWorkerType;
  coreWorker: Worker;
  gameConfig: GameConfig;
  logs: Record<PlayerId, Log>;
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

export const addLogs = createAsyncThunk<
Log,
{ gameId: GameId; log: Log },
AppThunkApi
>(
  'games/addLogs',
  async ({ gameId, log }, { getState }) => {
    const game = getState().games.games[gameId];
    if (!game) throw Error('Game not found');

    const oldLog = game.logs[log.owner];
    if (!oldLog) throw Error(`Player ${log.owner} not found`);

    return {
      ...log,
      log: oldLog.log + log.log,
      errorLog: oldLog.errorLog + log.errorLog,
    };
  },
);

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
  }, { dispatch }) => {
    const coreWorker = new Worker(new URL('../../workers/core.worker.ts', import.meta.url));
    const core = Comlink.wrap<CoreWorkerType>(coreWorker);

    await core.initCore();

    const gameId = createUUID();

    await core.setLogUpdatedCallback(Comlink.proxy((owner: number, log: string, errorLog: string) => {
      dispatch(addLogs({
        gameId,
        log: {
          log,
          errorLog,
          owner,
        },
      }));
    }));

    await core.initGame(gameConfig, algos);

    const mapStates = [{
      map: await core.getMap(),
      playerActions: [],
    }];

    return {
      id: gameId,
      gameConfig,
      core,
      coreWorker,
      mapStates,
      logs: new Array(algos.length).fill(null).reduce((acc, _, i) => {
        acc[i] = {
          owner: i,
          log: '',
          errorLog: '',
        };
        return acc;
      }, {}),
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

    builder
      .addCase(addLogs.fulfilled, (state, action) => {
        state.games[action.meta.arg.gameId].logs[action.payload.owner] = action.payload;
      });
  },
});

// Action creators are generated for each case reducer function
// export const {  } = gamesSlice.actions;

export default gamesSlice.reducer;
