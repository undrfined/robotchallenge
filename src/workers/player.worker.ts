import * as Comlink from 'comlink';
import type { IWrapper, AbstractStructType } from 'wasm-ffi';
import {
  Wrapper, Pointer,
} from 'wasm-ffi';
import { init, WASI } from '@wasmer/wasi';
import type {
  GameConfigStructType, LibraryInfoStructType,
  MapStructType,
} from '../helpers/ffiStructs';
import {
  EnergyStationStruct, GameConfigStruct, LibraryInfoStruct, MapStruct,
  PositionStruct,
  RobotStruct,
} from '../helpers/ffiStructs';
import type { GameConfig, GameLibraryInfo, GameMap } from '../types/gameTypes';
import { gameConfigToStruct, libraryInfoToObject } from '../helpers/ffiConverters';

type Exports = {
  init_game: (gameConfig: AbstractStructType<GameConfigStructType>, owner: number) => void,
  do_step_ffi: (map: AbstractStructType<MapStructType>, owner: number, roundNo: number) => void,
  get_lib_info: () => AbstractStructType<LibraryInfoStructType>
};

let wasi: WASI;
let instance: WebAssembly.Instance;
let wrapper: IWrapper<Exports>;
let actionDoneResolver: VoidFunction | undefined;
let onLogUpdated: (log: string, errorLog: string) => void;

function addLogs() {
  const stdout = wasi.getStdoutString();
  const stderr = wasi.getStderrString();
  onLogUpdated(stdout + (stdout ? '\n' : ''), stderr + (stderr ? '\n' : ''));
}

function withPromiseResolver<T extends Array<any>, U>(afterFn: (...args: T) => U) {
  return (...args: T): U => {
    actionDoneResolver?.();
    actionDoneResolver = undefined;
    return afterFn(...args);
  };
}

const PlayerWorker = {
  doStep: async (map: GameMap, robotToMoveIndex: number, roundNo: number): Promise<void> => {
    const robots = map.robots.map((robot) => new RobotStruct({
      position: new PositionStruct({
        q: robot.position.q,
        r: robot.position.r,
      }),
      energy: robot.energy,
      owner: robot.owner,
    }));

    const energyStations = map.energyStations.map((energyStation) => new EnergyStationStruct({
      position: new PositionStruct({
        q: energyStation.position.q,
        r: energyStation.position.r,
      }),
      recovery_rate: energyStation.recoveryRate,
      energy: energyStation.energy,
    }));

    try {
      const actionDonePromise = new Promise<void>((resolve) => {
        actionDoneResolver = resolve;
      });
      wrapper.do_step_ffi(new MapStruct({
        robots_len: robots.length,
        robots: new Pointer([RobotStruct, robots.length], robots),
        energy_stations_len: energyStations.length,
        energy_stations: new Pointer([EnergyStationStruct, energyStations.length], energyStations),
      }), robotToMoveIndex, roundNo);
      addLogs();

      return await actionDonePromise;
    } catch (e) {
      addLogs();
      // Do nothing
    }

    return Promise.reject();
  },
  initGame: async (gameConfig: GameConfig, owner: number): Promise<void> => {
    try {
      // TODO timeout
      wrapper.init_game(gameConfigToStruct(gameConfig), owner);
      addLogs();
    } catch (e) {
      addLogs();
      // eslint-disable-next-line no-console
      console.warn('[instance]', e);
    }
  },
  getLibraryInfo: async (): Promise<GameLibraryInfo> => {
    if (!wrapper.get_lib_info) throw new Error('get_lib_info not found');
    const result = libraryInfoToObject(wrapper.get_lib_info());
    // eslint-disable-next-line no-console
    console.log(wasi.getStdoutString());
    // eslint-disable-next-line no-console
    console.log(wasi.getStderrString());
    return result;
  },
  initWasi: async (
    file: File | Blob,
    onMove: (x: number, y: number) => void,
    onCollectEnergy: () => void,
    onCloneRobot: (energy: number) => void,
    _onLogUpdated: (log: string, errorLog: string) => void,
  ) => {
    await init();

    onLogUpdated = _onLogUpdated;

    wasi = new WASI({
      env: {
      },
      args: [],
    });

    const module = await WebAssembly.compile(
      await file.arrayBuffer(),
    );

    wrapper = new Wrapper<Exports>({
      init_game: [null, [GameConfigStruct, 'u32']],
      do_step_ffi: [null, [MapStruct, 'usize', 'u32']],
      get_lib_info: [LibraryInfoStruct, []],
    });

    try {
      // TODO error handling
      instance = await wasi.instantiate(module, wrapper.imports((wrap) => ({
        robotchallenge: {
          clone_robot: wrap([null, ['u32']], withPromiseResolver((energy) => onCloneRobot(energy))),
          collect_energy: wrap([null, []], withPromiseResolver(() => onCollectEnergy())),
          move_robot: wrap([null, ['i32', 'i32']], withPromiseResolver((q, r) => onMove(q, r))),
        },
      })));

      wrapper.use(instance);
    } catch (e) {
      // console.error(e);
    }

    return true;
  },
};

export type PlayerWorkerType = typeof PlayerWorker;

Comlink.expose(PlayerWorker);
