import { Pointer, Struct, types } from 'wasm-ffi';

export type PositionStructType = {
  x: number;
  y: number;
};

export const PositionStruct = new Struct<PositionStructType>({
  x: 'i32',
  y: 'i32',
});

export type RobotStructType = {
  position: PositionStructType,
  energy: number,
  owner: number,
};

export const RobotStruct = new Struct<RobotStructType>({
  position: PositionStruct,
  energy: 'u32',
  owner: 'u32',
});

export type EnergyStationStructType = {
  position: PositionStructType,
  recovery_rate: number,
  energy: number,
};

export const EnergyStationStruct = new Struct<EnergyStationStructType>({
  position: PositionStruct,
  recovery_rate: 'u32',
  energy: 'u32',
});

export type MapStructType = {
  robots_len: number,
  robots: Pointer<RobotStructType>,
  energy_stations_len: number,
  energy_stations: Pointer<EnergyStationStructType>,
};

export const MapStruct = new Struct<MapStructType>({
  robots_len: 'usize',
  robots: types.pointer(RobotStruct),
  energy_stations_len: 'usize',
  energy_stations: types.pointer(EnergyStationStruct),
});

export type GameConfigStructType = {
  width: number,
  height: number,
  rounds_count: number,
  players_count: number,
  initial_robots_count: number,
  start_energy: number,
  rng_seed: number,
  energy_stations_per_robot: number,
  energy_loss_to_clone_robot: number,
  max_robots_count: number,
};

export const GameConfigStruct = new Struct<GameConfigStructType>({
  width: 'i32',
  height: 'i32',
  rounds_count: 'u32',
  players_count: 'u32',
  initial_robots_count: 'u32',
  start_energy: 'u32',
  rng_seed: 'u32',
  energy_stations_per_robot: 'u32',
  energy_loss_to_clone_robot: 'u32',
  max_robots_count: 'u32',
});
