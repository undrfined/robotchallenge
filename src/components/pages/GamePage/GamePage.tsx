import React, { useMemo } from 'react';
import styles from './GamePage.module.scss';
import PlayerCard from '../../PlayerCard/PlayerCard';
import GameCanvas from '../../GameCanvas/GameCanvas';
import { GameConfig, GameMap } from '../../../types/gameTypes';
import { PLAYER_COLORS } from '../../../helpers/playerColors';
import GameTimeline from '../../GameTimeline/GameTimeline';

type OwnProps = {
  map: GameMap;
  gameConfig: GameConfig;
  diff: number;
  roundNumber: number;
  onChangeRoundNumber: (roundNumber: number) => void;
};

export default function GamePage({
  map,
  gameConfig,
  diff,
  roundNumber,
  onChangeRoundNumber,
}: OwnProps) {
  const playerStats = useMemo(() => {
    return Array(gameConfig.playersCount).fill(undefined).map((_, i) => ({
      id: i,
      energy: map.robots.filter((r) => r.owner === i).reduce((acc, r) => acc + r.energy, 0),
      robotsCount: map.robots.filter((r) => r.owner === i).length,
      maxRobots: gameConfig.maxRobotsCount,
    })).sort((a, b) => b.energy - a.energy);
  }, [gameConfig.playersCount, map.robots]);

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <GameCanvas map={map} gameConfig={gameConfig} diff={diff} />
        <GameTimeline
          onChange={onChangeRoundNumber}
          onPauseClick={() => {}}
          gameConfig={gameConfig}
          isPaused
          roundNumber={roundNumber}
        />
      </div>

      <div className={styles.playerList}>
        {playerStats.map(({
          id, energy, robotsCount, maxRobots,
        }, i) => (
          <PlayerCard
            key={id}
            avatar="https://i.pravatar.cc/300"
            playerName={`Maksim Sunduk ${id}`}
            playerColor={PLAYER_COLORS[id]}
            rank={i + 1}
            energy={energy}
            robotsLeft={robotsCount}
            maxRobots={maxRobots}
          />
        ))}

      </div>
    </div>
  );
}
