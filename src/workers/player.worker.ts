import * as Comlink from 'comlink';
import {
  Wrapper, Pointer, IWrapper, AbstractStructType,
} from 'wasm-ffi';
import { init, WASI } from '@wasmer/wasi';
import {
  EnergyStationStruct, GameConfigStruct, GameConfigStructType, MapStruct,
  MapStructType,
  PositionStruct,
  RobotStruct,
} from '../helpers/ffiStructs';
import { GameConfig, GameMap } from '../types/gameTypes';
import { gameConfigToStruct } from '../helpers/ffiConverters';

type Exports = {
  init_game: (gameConfig: AbstractStructType<GameConfigStructType>, owner: number) => void,
  do_step_ffi: (map: AbstractStructType<MapStructType>, owner: number, roundNo: number) => void,
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
      // Do nothing
    }

    return Promise.reject();
  },
  initWasi: async (
    file: File | Blob,
    gameConfig: GameConfig,
    owner: number,
    onMove: (x: number, y: number) => number,
    onCollectEnergy: () => number,
    onCloneRobot: (energy: number) => number,
    _onLogUpdated: (log: string, errorLog: string) => void,
  ) => {
    await init();

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
    });

    instance = await wasi.instantiate(module, wrapper.imports((wrap) => ({
      robotchallenge: {
        clone_robot: wrap(['u32', ['u32']], withPromiseResolver(onCloneRobot)),
        collect_energy: wrap(['u32', []], withPromiseResolver(onCollectEnergy)),
        move_robot: wrap(['u32', ['i32', 'i32']], withPromiseResolver(onMove)),
      },
    })));

    wrapper.use(instance);

    try {
      onLogUpdated = _onLogUpdated;
      // TODO timeout
      wrapper.init_game(gameConfigToStruct(gameConfig), owner);
      addLogs();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[instance]', e);
    }

    return true;
  },
};

export type PlayerWorkerType = typeof PlayerWorker;

Comlink.expose(PlayerWorker);
