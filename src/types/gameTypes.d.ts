export type GamePosition = {
  x: number;
  y: number;
};

export type GameRobot = {
  position: GamePosition;
  energy: number;
  owner: number;
};

export type GameEnergyStation = {
  position: GamePosition;
  energy: number;
  recoveryRate: number;
};

export type GameMap = {
  robots: GameRobot[];
  energyStations: GameEnergyStation[];
};

export type GameConfig = {
  width: number,
  height: number,
  roundsCount: number,
  playersCount: number,
  initialRobotsCount: number,
  startEnergy: number,
  rngSeed: number,
  energyStationsPerRobot: number,
  energyLossToCloneRobot: number,
  maxRobotsCount: number,
  timeout: number,
  energyCollectDistance: number,
};

export type GamePlayerActionMove = {
  type: 'move',
  robotId: number,
  newPosition: GamePosition,
};

export type GamePlayerActionMoveFailed = {
  type: 'moveFailed',
  robotId: number,
  newPosition: GamePosition,
};

export type GameCloneRobot = {
  type: 'cloneRobot',
  robotId: number,
  newRobot: GameRobot,
};

export type GameCloneRobotFailed = {
  type: 'cloneRobotFailed',
  robotId: number,
};

export type GameCollectEnergy = {
  type: 'collectEnergy',
  robotId: number,
};

export type GameCollectEnergyFailed = {
  type: 'collectEnergyFailed',
  robotId: number,
};

export type GamePlayerActions =
    GamePlayerActionMove | GamePlayerActionMoveFailed | GameCloneRobot | GameCloneRobotFailed |
    GameCollectEnergy | GameCollectEnergyFailed;
