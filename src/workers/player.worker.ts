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
  do_step_ffi: (map: AbstractStructType<MapStructType>, owner: number) => void,
};

let wasi: WASI;
let instance: WebAssembly.Instance;
let wrapper: IWrapper<Exports>;

const PlayerWorker = {
  doStep: async (map: GameMap, robotToMoveIndex: number) => {
    const robots = map.robots.map((robot) => new RobotStruct({
      position: new PositionStruct({
        x: robot.position.x,
        y: robot.position.y,
      }),
      energy: robot.energy,
      owner: robot.owner,
    }));

    const energyStations = map.energyStations.map((energyStation) => new EnergyStationStruct({
      position: new PositionStruct({
        x: energyStation.position.x,
        y: energyStation.position.y,
      }),
      recovery_rate: energyStation.recoveryRate,
      energy: energyStation.energy,
    }));

    try {
      wrapper.do_step_ffi(new MapStruct({
        robots_len: robots.length,
        robots: new Pointer([RobotStruct, robots.length], robots),
        energy_stations_len: energyStations.length,
        energy_stations: new Pointer([EnergyStationStruct, energyStations.length], energyStations),
      }), robotToMoveIndex);

      // eslint-disable-next-line no-console
      console.log('[instance]', wasi.getStdoutString());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[instance]', wasi.getStderrString());
    }
  },
  initWasi: async (
    file: File | Blob,
    gameConfig: GameConfig,
    owner: number,
    onMove: (x: number, y: number) => number,
    onCollectEnergy: () => number,
    onCloneRobot: (energy: number) => number,
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
      do_step_ffi: [null, [MapStruct, 'usize']],
    });

    instance = await wasi.instantiate(module, wrapper.imports((wrap) => ({
      robotchallenge: {
        clone_robot: wrap(['u32', ['u32']], onCloneRobot),
        collect_energy: wrap(['u32', []], onCollectEnergy),
        move_robot: wrap(['u32', ['i32', 'i32']], onMove),
      },
    })));

    wrapper.use(instance);

    try {
      wrapper.init_game(gameConfigToStruct(gameConfig), owner);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[instance]', e);
    }

    return true;
  },
};

export type PlayerWorkerType = typeof PlayerWorker;

Comlink.expose(PlayerWorker);
