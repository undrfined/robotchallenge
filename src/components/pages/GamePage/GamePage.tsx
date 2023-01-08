import React, { useMemo, useState } from 'react';
import cn from 'classnames';
import styles from './GamePage.module.scss';
import PlayerCard from '../../PlayerCard/PlayerCard';
import GameCanvas from '../../GameCanvas/GameCanvas';
import { GameConfig } from '../../../types/gameTypes';
import { PLAYER_COLORS } from '../../../helpers/playerColors';
import GameTimeline from '../../GameTimeline/GameTimeline';
import type { MapState } from '../../../App';

type OwnProps = {
  mapStates: MapState[];
  gameConfig: GameConfig;
  roundNumber: number;
  onChangeRoundNumber: (roundNumber: number) => void;
  onTogglePause: VoidFunction;
  isPaused: boolean;
};

export default function GamePage({
  mapStates,
  gameConfig,
  roundNumber,
  onChangeRoundNumber,
  onTogglePause,
  isPaused,
}: OwnProps) {
  const map = mapStates[roundNumber].map;
  const [step, setStep] = useState(0);
  const previousActions = mapStates[roundNumber].playerActions.slice(0, step);
  const shownActions = mapStates[roundNumber].playerActions.slice(Math.max(0, step - 6), step);
  const currentPlayerAction = mapStates[roundNumber].playerActions[step];
  const handleChangeRoundNumber = (newRoundNumber: number) => {
    setStep(0);
    onChangeRoundNumber(newRoundNumber);
  };

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
        <GameCanvas
          startingMap={map}
          gameConfig={gameConfig}
          previousActions={previousActions}
          currentPlayerAction={currentPlayerAction}
        />
        <GameTimeline
          onChange={handleChangeRoundNumber}
          onTogglePause={onTogglePause}
          gameConfig={gameConfig}
          isPaused={isPaused}
          roundNumber={roundNumber}
          calculatedRounds={mapStates.length - 1}
          step={step}
          onChangeStep={setStep}
        />
      </div>

      <div className={styles.playerList}>
        {playerStats.map(({
          id, energy, robotsCount, maxRobots,
        }, i) => (
          <PlayerCard
            key={id}
            avatar="https://i.pravatar.cc/300"
            playerName={`Player #${id}`}
            playerColor={PLAYER_COLORS[id]}
            rank={i + 1}
            energy={energy}
            robotsLeft={robotsCount}
            maxRobots={maxRobots}
          />
        ))}

      </div>

      {currentPlayerAction && (
        <div className={styles.playerActions}>
          <div className={cn(styles.playerAction)}>
            {currentPlayerAction.type} {currentPlayerAction.robotId}
          </div>
          {shownActions.reverse().map((action, index) => {
            return (
              <div
                key={previousActions.indexOf(action)}
                className={cn(styles.playerAction, index === 5 && styles.hiding)}
              >
                {action.type} {action.robotId}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
