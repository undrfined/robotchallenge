import * as Comlink from 'comlink';
import { Wrapper, IWrapper } from 'wasm-ffi';
import { init, WASI } from '@wasmer/wasi';
import core from '../core.wasm';
import { GameConfig, GameMap, GamePlayerActions } from '../types/gameTypes';
import {
  GameConfigStruct,
  GameConfigStructType, MapStruct,
  MapStructType, PlayerActionsStruct, PlayerActionsType,
} from '../helpers/ffiStructs';
import type { PlayerWorkerType } from './player.worker';
import { gameConfigToStruct, mapStructToObject, playerActionsStructToObject } from '../helpers/ffiConverters';
import delay from '../helpers/delay';

type Exports = {
  init_mod: () => void,
  init_game: (gameConfig: GameConfigStructType) => void,
  do_round: VoidFunction,
  get_map: () => MapStructType,
  done_step: (is_timeout: boolean, is_timeout_too_much: boolean) => void,
  move_robot: (x: number, y: number) => number,
  clone_robot: (energy: number) => number,
  collect_energy: () => number;
  get_player_actions: (round: number) => PlayerActionsType,
};

type RoundFinishedCallback = (map: GameMap, playerActions: GamePlayerActions[]) => void;

let wasi: WASI;
let instance: WebAssembly.Instance;
let wrapper: IWrapper<Exports>;
let currentGameConfig: GameConfig;
let playerWorkers: {
  worker: Worker;
  comlink: PlayerWorkerType;
  algo: Blob;
  timeouts: number;
}[] = [];
let onRoundFinished: RoundFinishedCallback;

const initPlayerWorker = async (algo: Blob, i: number) => {
  const worker = new Worker(new URL('./player.worker.ts', import.meta.url));
  const comlink = Comlink.wrap<PlayerWorkerType>(worker);

  await comlink.initWasi(
    algo,
    currentGameConfig,
    i,
    Comlink.proxy(wrapper.move_robot.bind(wrapper)),
    Comlink.proxy(wrapper.collect_energy.bind(wrapper)),
    Comlink.proxy(wrapper.clone_robot.bind(wrapper)),
  );

  return {
    comlink,
    worker,
    algo,
    timeouts: (playerWorkers[i]?.timeouts || -1) + 1,
  };
};

const doStep = async (owner: number, robotToMoveIndex: number, map: MapStructType) => {
  try {
    if (playerWorkers[owner]?.timeouts >= currentGameConfig.maxTimeoutsCount) {
      throw Error('Too many timeouts');
    }

    await Promise.race(
      [
        playerWorkers[owner].comlink.doStep(mapStructToObject(map), robotToMoveIndex),
        new Promise((_, reject) => {
          setTimeout(() => reject(Error('Timeout')), currentGameConfig.timeout);
        }),
      ],
    );
    // eslint-disable-next-line no-console
    console.log('[wcore] step stop!', robotToMoveIndex);
    wrapper.done_step(false, false);
    // eslint-disable-next-line no-console
    console.log(wasi.getStdoutString());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`[wcore] step error! ${owner} ${playerWorkers[owner].timeouts} ${robotToMoveIndex}`, e);
    playerWorkers[owner].worker.terminate();
    const isTimeoutTooMuch = playerWorkers[owner]?.timeouts >= currentGameConfig.maxTimeoutsCount;
    if (!isTimeoutTooMuch) {
      playerWorkers[owner].timeouts++;
      playerWorkers[owner] = await initPlayerWorker(playerWorkers[owner].algo, owner);
    } else {
      // TODO we're too fast, lock is not unlocked at this point
      await delay(1);
    }

    try {
      wrapper.done_step(true, isTimeoutTooMuch);
      // eslint-disable-next-line no-console
      console.log(wasi.getStdoutString());
    } catch (e2) {
      // eslint-disable-next-line no-console
      console.error(wasi.getStderrString(), robotToMoveIndex);
    }
  }

  return 1;
};

const CoreWorker = {
  getMap: async () => {
    const map = wrapper.get_map();

    return mapStructToObject(map);
  },
  doRound: () => {
    wrapper.do_round();
    // eslint-disable-next-line no-console
    console.log('[wcore] done round');
    // eslint-disable-next-line no-console
    console.log(wasi.getStdoutString());
    // eslint-disable-next-line no-console
    console.error(wasi.getStderrString());
  },
  initGame: async (gameConfig: GameConfig, algos: (File | Blob)[]) => {
    currentGameConfig = gameConfig;

    playerWorkers = await Promise.all(algos.map(initPlayerWorker));

    try {
      wrapper.init_game(gameConfigToStruct(gameConfig));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[wcore] log', wasi.getStdoutString());
      // eslint-disable-next-line no-console
      console.error('[wcore] init error!', wasi.getStderrString());
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  },
  get_player_actions: (round: number) => {
    return playerActionsStructToObject(wrapper.get_player_actions(round));
  },
  setCallbacks: (
    onRoundFinishedCallback: RoundFinishedCallback,
  ) => {
    onRoundFinished = onRoundFinishedCallback;
  },
  initCore: async (
  ) => {
    await init();

    wasi = new WASI({
      env: {},
      args: [],
    });

    const module = await WebAssembly.compileStreaming(fetch(core));

    wrapper = new Wrapper<Exports>({
      init_mod: [null],
      init_game: [null, [GameConfigStruct]],
      do_round: [null],
      get_map: [MapStruct],
      done_step: [null, ['bool']],
      move_robot: ['u32', ['i32', 'i32']],
      clone_robot: ['u32', ['u32']],
      collect_energy: ['u32', []],
      get_player_actions: [PlayerActionsStruct, ['u32']],
    });

    instance = await wasi.instantiate(module, wrapper.imports((wrap) => ({
      robotchallenge: {
        round_finished: wrap([null, [MapStruct, PlayerActionsStruct]], async (
          map: MapStructType, playerActions: PlayerActionsType,
        ) => {
          for (let i = 0; i < playerWorkers.length; i++) {
            if (playerWorkers[i].timeouts >= currentGameConfig.maxTimeoutsCount) {
              playerWorkers[i].worker.terminate();
              playerWorkers[i] = await initPlayerWorker(playerWorkers[i].algo, i);
            }
            playerWorkers[i].timeouts = 0;
          }
          onRoundFinished(mapStructToObject(map), playerActionsStructToObject(playerActions));
        }),
        do_step: wrap(['u32', ['u32', 'usize', MapStruct]], doStep),
      },
    })));

    wrapper.use(instance);

    wrapper.init_mod();

    return true;
  },
};

export type CoreWorkerType = typeof CoreWorker;

Comlink.expose(CoreWorker);
