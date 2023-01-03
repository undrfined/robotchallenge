import {
  EnergyStationStructType,
  GameConfigStructType,
  MapStructType,
  PositionStructType,
  RobotStructType,
} from './ffiStructs';
import {
  GameConfig, GameEnergyStation, GameMap, GamePosition, GameRobot,
} from '../types/gameTypes';
import ffiReadArray from './ffiReadArray';

export function gameConfigToStruct(gameConfig: GameConfig): GameConfigStructType {
  return {
    width: gameConfig.width,
    height: gameConfig.height,
    rounds_count: gameConfig.roundsCount,
    players_count: gameConfig.playersCount,
    initial_robots_count: gameConfig.initialRobotsCount,
    start_energy: gameConfig.startEnergy,
    rng_seed: gameConfig.rngSeed,
    energy_stations_per_robot: gameConfig.energyStationsPerRobot,
    energy_loss_to_clone_robot: gameConfig.energyLossToCloneRobot,
    max_robots_count: gameConfig.maxRobotsCount,
  };
}

export function mapStructToObject(map: MapStructType): GameMap {
  const positionStructToObject = (position: PositionStructType): GamePosition => ({
    x: position.x,
    y: position.y,
  });

  const robotStructToObject = (robot: RobotStructType): GameRobot => ({
    energy: robot.energy,
    owner: robot.owner,
    position: positionStructToObject(robot.position),
  });

  const energyStationStructToObject = (energyStation: EnergyStationStructType): GameEnergyStation => ({
    energy: energyStation.energy,
    recoveryRate: energyStation.recovery_rate,
    position: positionStructToObject(energyStation.position),
  });

  const robots = ffiReadArray(map.robots_len, map.robots).map(robotStructToObject);
  const energyStations = ffiReadArray(map.energy_stations_len, map.energy_stations).map(energyStationStructToObject);

  return {
    robots,
    energyStations,
  };
}
