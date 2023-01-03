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
};
