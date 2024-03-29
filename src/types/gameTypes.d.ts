export type GamePosition = {
  q: number;
  r: number;
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
  roundsCount: number,
  playersCount: number,
  initialRobotsCount: number,
  startEnergy: number,
  rngSeed: number,
  energyStationsPerRobot: number,
  energyLossToCloneRobot: number,
  maxRobotsCount: number,
  timeout: number,
  maxTimeoutsCount: number,
  energyCollectDistance: number,
};

export type GameLibraryInfo = {
  version: string,
  name: string,
  language: string,
};

export type GamePlayerActionMove = {
  type: 'move',
  robotId: number,
  newPosition: GamePosition,
  loss: number,
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

export type Timeout = {
  type: 'timeout',
  robotId: number,
  isTimeoutTooMuch: boolean,
};

export type GamePlayerActions =
    GamePlayerActionMove | GamePlayerActionMoveFailed | GameCloneRobot | GameCloneRobotFailed |
    GameCollectEnergy | GameCollectEnergyFailed | Timeout;
