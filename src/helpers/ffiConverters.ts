import {
  CloneRobotFailedStruct,
  CloneRobotStruct,
  CollectEnergyFailedStruct,
  CollectEnergyStruct,
  EnergyStationStructType,
  GameConfigStructType,
  MapStructType,
  PlayerActionMoveFailedStruct,
  PlayerActionMoveStruct,
  PlayerActionsType,
  PlayerActionTypeEnum,
  PositionStructType,
  RobotStructType, TimeoutStruct,
} from './ffiStructs';
import {
  GameConfig, GameEnergyStation, GameMap, GamePlayerActions, GamePosition, GameRobot,
} from '../types/gameTypes';
import ffiReadArray from './ffiReadArray';
import ffiReadEnumArray from './ffiReadEnumArray';

export function gameConfigToStruct(gameConfig: GameConfig): GameConfigStructType {
  return {
    width: gameConfig.width,
    rounds_count: gameConfig.roundsCount,
    players_count: gameConfig.playersCount,
    initial_robots_count: gameConfig.initialRobotsCount,
    start_energy: gameConfig.startEnergy,
    rng_seed: gameConfig.rngSeed,
    energy_stations_per_robot: gameConfig.energyStationsPerRobot,
    energy_loss_to_clone_robot: gameConfig.energyLossToCloneRobot,
    max_robots_count: gameConfig.maxRobotsCount,
    energy_collect_distance: gameConfig.energyCollectDistance,
  };
}

function positionStructToObject(position: PositionStructType): GamePosition {
  return {
    q: position.q,
    r: position.r,
  };
}

function robotStructToObject(robot: RobotStructType): GameRobot {
  return {
    energy: robot.energy,
    owner: robot.owner,
    position: positionStructToObject(robot.position),
  };
}

export function mapStructToObject(map: MapStructType): GameMap {
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

function playerActionStructToObject(playerAction: PlayerActionTypeEnum): GamePlayerActions | undefined {
  switch (playerAction.id) {
    case 0:
      return {
        type: 'move',
        robotId: playerAction.robot_id,
        newPosition: positionStructToObject(playerAction.new_position),
        loss: playerAction.loss,
      };
    case 1:
      return {
        type: 'moveFailed',
        robotId: playerAction.robot_id,
        newPosition: positionStructToObject(playerAction.new_position),
      };
    case 2:
      return {
        type: 'cloneRobot',
        robotId: playerAction.robot_id,
        newRobot: robotStructToObject(playerAction.new_robot),
      };
    case 3:
      return {
        type: 'cloneRobotFailed',
        robotId: playerAction.robot_id,
      };
    case 4:
      return {
        type: 'collectEnergy',
        robotId: playerAction.robot_id,
      };
    case 5:
      return {
        type: 'collectEnergyFailed',
        robotId: playerAction.robot_id,
      };
    case 6:
      return {
        type: 'timeout',
        robotId: playerAction.robot_id,
        isTimeoutTooMuch: playerAction.is_timeout_too_much,
      };
    default:
      return undefined;
  }
}

export function playerActionsStructToObject(playerActions: PlayerActionsType): any {
  return ffiReadEnumArray(playerActions.player_actions_len, playerActions.player_actions, [
    PlayerActionMoveStruct,
    PlayerActionMoveFailedStruct,
    CloneRobotStruct,
    CloneRobotFailedStruct,
    CollectEnergyStruct,
    CollectEnergyFailedStruct,
    TimeoutStruct,
  ]).map(playerActionStructToObject);
}
