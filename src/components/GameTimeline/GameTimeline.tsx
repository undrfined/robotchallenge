import React from 'react';
import styles from './GameTimeline.module.scss';
import Pause from '../../assets/icons/Pause.svg';
import Play from '../../assets/icons/Play.svg';
import NextRound from '../../assets/icons/NextRound.svg';
import NextStep from '../../assets/icons/NextStep.svg';
import type { GameConfig } from '../../types/gameTypes';

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

  const PlayComponent = isPaused ? Play : Pause;

  return (
    <div className={styles.root}>
      <button className={styles.controlButton} onClick={handleBackwardsClick}>
        <NextRound className={styles.reversed} />
        <span className={styles.controlButtonSubtext}>1 round</span>
      </button>
      <button
        className={styles.controlButton}
        onClick={() => {
          if (step === undefined) return;
          onChangeStep(step - 1);
        }}
      >
        <NextStep className={styles.reversed} />
        <span className={styles.controlButtonSubtext}>1 step</span>

      </button>
      <PlayComponent onClick={onTogglePause} className={styles.controlButton} />
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
        <NextStep />
        <span className={styles.controlButtonSubtext}>1 step</span>
      </button>

      <button onClick={handleForwardsClick} className={styles.controlButton}>
        <NextRound />
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
