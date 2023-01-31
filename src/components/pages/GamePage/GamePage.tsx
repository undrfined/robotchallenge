import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import styles from './GamePage.module.scss';
import PlayerCard from '../../PlayerCard/PlayerCard';
import GameCanvas from '../../GameCanvas/GameCanvas';
import { GameConfig } from '../../../types/gameTypes';
import { PLAYER_COLORS } from '../../../helpers/playerColors';
import GameTimeline from '../../GameTimeline/GameTimeline';
import type { MapState } from '../../../App';
import Timeout from '../../../assets/icons/Timeout.webm';
import TimeoutTooMuch from '../../../assets/icons/TimeoutTooMuch.webm';

type OwnProps = {
  mapStates: MapState[];
  gameConfig: GameConfig;
  roundNumber: number;
  onChangeRoundNumber: (roundNumber: number) => void;
};

export default function GamePage({
  mapStates,
  gameConfig,
  roundNumber,
  onChangeRoundNumber,
}: OwnProps) {
  const hasPlayerActions = Boolean(mapStates[roundNumber]?.playerActions?.length);
  const mapState = useMemo(() => {
    return mapStates[roundNumber];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNumber, hasPlayerActions]);
  const map = mapState.map;

  const [isPaused, setIsPaused] = useState(true);

  const [step, setStep] = useState<number | undefined>(undefined);
  const previousActions = useMemo(() => {
    return step !== undefined ? mapState.playerActions.slice(0, step) : [];
  }, [mapState.playerActions, step]);
  const shownActions = useMemo(() => {
    return step !== undefined
      ? mapState.playerActions.slice(Math.max(0, step - 6), step) : [];
  }, [mapState.playerActions, step]);
  const currentPlayerAction = step !== undefined && !isPaused ? mapState.playerActions[step] : undefined;
  const isTimeout = currentPlayerAction?.type === 'timeout';
  const isTimeoutTooMuch = currentPlayerAction?.type === 'timeout' && currentPlayerAction.isTimeoutTooMuch;

  const handleChangeRoundNumber = useCallback((newRoundNumber: number, noPause = false) => {
    if (!noPause) {
      setStep(undefined);
      setIsPaused(true);
    } else {
      setStep(0);
    }
    onChangeRoundNumber(newRoundNumber);
  }, [onChangeRoundNumber]);

  const onTogglePause = useCallback(() => {
    if (step === undefined) {
      setStep(0);
    }
    setIsPaused((wasPaused) => !wasPaused);
  }, [step]);

  const handleAnimationEnd = useCallback(() => {
    if (step === undefined) return;
    if (step === mapState.playerActions.length - 1) {
      handleChangeRoundNumber(roundNumber + 1, true);
      return;
    }
    setStep(step + 1);
  }, [handleChangeRoundNumber, mapState.playerActions.length, roundNumber, step]);

  const handleChangeStep = useCallback((newStep: number) => {
    setStep(newStep);
    setIsPaused(true);
  }, []);

  const playerStats = useMemo(() => {
    return Array(gameConfig.playersCount).fill(undefined).map((_, i) => ({
      id: i,
      energy: map.robots.filter((r) => r.owner === i).reduce((acc, r) => acc + r.energy, 0),
      robotsCount: map.robots.filter((r) => r.owner === i).length,
      maxRobots: gameConfig.maxRobotsCount,
    })).sort((a, b) => b.energy - a.energy);
  }, [gameConfig.maxRobotsCount, gameConfig.playersCount, map.robots]);

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={isTimeoutTooMuch ? TimeoutTooMuch : Timeout}
          className={cn(
            styles.timeout,
            isTimeout && styles.visible,
          )}
          loop
          autoPlay
          muted
          playsInline
        />
        <GameCanvas
          startingMap={map}
          isPaused={isPaused}
          gameConfig={gameConfig}
          previousActions={previousActions}
          currentPlayerAction={currentPlayerAction}
          onAnimationEnd={handleAnimationEnd}
        />
        <GameTimeline
          onChange={handleChangeRoundNumber}
          onTogglePause={onTogglePause}
          gameConfig={gameConfig}
          isPaused={isPaused}
          roundNumber={roundNumber}
          calculatedRounds={mapStates.length - 1}
          step={step}
          onChangeStep={handleChangeStep}
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
