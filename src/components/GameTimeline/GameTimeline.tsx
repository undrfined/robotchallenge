import React from 'react';
import styles from './GameTimeline.module.scss';
import type { GameConfig } from '../../types/gameTypes';
import Icon from '../common/Icon/Icon';

type OwnProps = {
  roundNumber: number;
  calculatedRounds: number;
  isPaused: boolean;
  gameConfig: GameConfig;
  step: number | undefined;
  onTogglePause: VoidFunction;
  onChange: (roundNumber: number) => void;
  onChangeStep: (step: number) => void;
};

export default function GameTimeline({
  roundNumber,
  calculatedRounds,
  isPaused,
  step,
  gameConfig,
  onTogglePause,
  onChange,
  onChangeStep,
}: OwnProps) {
  function handleForwardsClick() {
    onChange(Math.min(calculatedRounds, roundNumber + 1));
  }

  function handleBackwardsClick() {
    onChange(Math.max(0, roundNumber - 1));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    if (value >= 0 && value <= calculatedRounds) {
      onChange(value);
    }
  }

  return (
    <div className={styles.root}>
      <button className={styles.controlButton} onClick={handleBackwardsClick}>
        <Icon name="NextRound" className={styles.reversed} />
        <span className={styles.controlButtonSubtext}>1 round</span>
      </button>
      <button
        className={styles.controlButton}
        onClick={() => {
          if (step === undefined) return;
          onChangeStep(step - 1);
        }}
      >
        <Icon name="NextStep" className={styles.reversed} />
        <span className={styles.controlButtonSubtext}>1 step</span>

      </button>
      <Icon name={isPaused ? 'Play' : 'Pause'} onClick={onTogglePause} className={styles.controlButton} />
      <button
        onClick={() => {
          if (step === undefined) {
            onChangeStep(0);
            return;
          }
          onChangeStep(step + 1);
        }}
        className={styles.controlButton}
      >
        <Icon name="NextStep" />
        <span className={styles.controlButtonSubtext}>1 step</span>
      </button>

      <button onClick={handleForwardsClick} className={styles.controlButton}>
        <Icon name="NextRound" />
        <span className={styles.controlButtonSubtext}>1 round</span>
      </button>
      <div className={styles.timelineWrapper}>
        <div
          className={styles.timelineFillTrackCalculated}
          style={{ '--progress': calculatedRounds / gameConfig.roundsCount }}
        />
        <div
          className={styles.timelineFillTrack}
          style={{ '--progress': roundNumber / gameConfig.roundsCount }}
        />

        <input
          type="range"
          className={styles.timeline}
          value={roundNumber}
          max={gameConfig.roundsCount}
          onChange={handleChange}
        />
      </div>
      <div className={styles.roundNumber}>Round #{roundNumber}, Step #{step}</div>
    </div>
  );
}
