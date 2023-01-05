import * as Comlink from 'comlink';
import { Wrapper, IWrapper } from 'wasm-ffi';
import { init, WASI } from '@wasmer/wasi';
import core from '../core.wasm';
import { GameConfig, GameMap } from '../types/gameTypes';
import {
  GameConfigStruct,
  GameConfigStructType, MapStruct,
  MapStructType, PlayerActionsStruct, PlayerActionsType,
} from '../helpers/ffiStructs';
import type { PlayerWorkerType } from './player.worker';
import { gameConfigToStruct, mapStructToObject, playerActionsStructToObject } from '../helpers/ffiConverters';

type Exports = {
  init_mod: () => void,
  init_game: (gameConfig: GameConfigStructType) => void,
  do_round: VoidFunction,
  get_map: () => MapStructType,
  done_step: VoidFunction,
  move_robot: (x: number, y: number) => number,
  clone_robot: (energy: number) => number,
  collect_energy: () => number;
  get_player_actions: (round: number) => PlayerActionsType,
};

let wasi: WASI;
let instance: WebAssembly.Instance;
let wrapper: IWrapper<Exports>;
let currentGameConfig: GameConfig;
let playerWorkers: {
  worker: Worker;
  comlink: PlayerWorkerType;
}[] = [];

const doStep = async (owner: number, robotToMoveIndex: number, map: MapStructType) => {
  try {
    await Promise.race(
      [
        playerWorkers[owner].comlink.doStep(mapStructToObject(map), robotToMoveIndex),
        new Promise((_, reject) => {
          setTimeout(() => reject(Error('Timeout')), currentGameConfig.timeout);
        }),
      ],
    );
    // eslint-disable-next-line no-console
    console.log('[wcore] step stop!');
    wrapper.done_step();
    // eslint-disable-next-line no-console
    console.log(wasi.getStdoutString());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[wcore] step error!', e);
    playerWorkers[owner].worker.terminate();
    wrapper.done_step();
    // eslint-disable-next-line no-console
    console.log(wasi.getStdoutString());
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
    playerWorkers = await Promise.all(algos.map(async (algo, i) => {
      const worker = new Worker(new URL('./player.worker.ts', import.meta.url));
      const comlink = Comlink.wrap<PlayerWorkerType>(worker);

      await comlink.initWasi(
        algo,
        gameConfig,
        i,
        Comlink.proxy(wrapper.move_robot.bind(wrapper)),
        Comlink.proxy(wrapper.collect_energy.bind(wrapper)),
        Comlink.proxy(wrapper.clone_robot.bind(wrapper)),
      );

      return {
        comlink,
        worker,
      };
    }));

    try {
      currentGameConfig = gameConfig;
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
  initCore: async (
    updateMap: (map: GameMap) => void,
    onRoundFinished: () => void,
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
      done_step: [null],
      move_robot: ['u32', ['i32', 'i32']],
      clone_robot: ['u32', ['u32']],
      collect_energy: ['u32', []],
      get_player_actions: [PlayerActionsStruct, ['u32']],
    });

    instance = await wasi.instantiate(module, wrapper.imports((wrap) => ({
      robotchallenge: {
        round_finished: onRoundFinished,
        update_map: wrap([null, [MapStruct]], (map: MapStructType) => {
          // eslint-disable-next-line no-console
          console.log('[wcore] update map', map);
          updateMap(mapStructToObject(map));
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
